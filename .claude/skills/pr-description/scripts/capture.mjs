#!/usr/bin/env node
import { spawn, execFileSync } from "node:child_process";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  rm,
  stat,
} from "node:fs/promises";
// Captures PR media with no npm dependencies: drives headless Chrome over the DevTools protocol
// against a running server (--url) or a static folder it serves itself (--dir), and writes PNG
// screenshots plus MP4 and GIF recordings (ffmpeg).
//
//   node capture.mjs --url http://localhost:3000 --scenario scenario.json --out /tmp/pr-media
//
// See ../SKILL.md (Capturing media) for the scenario format.
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    dir: { type: "string" },
    scenario: { type: "string" },
    out: { type: "string" },
    chrome: { type: "string" },
    recorder: { type: "string", default: "screencast" },
  },
});
if (
  Boolean(args.url) === Boolean(args.dir) ||
  !args.scenario ||
  !args.out ||
  !["screencast", "native"].includes(args.recorder)
) {
  console.error(
    "usage: node capture.mjs (--url <server origin> | --dir <static folder>) --scenario <scenario.json> --out <media folder> [--recorder screencast|native]",
  );
  process.exit(2);
}

const GITHUB_LIMIT = 10 * 1024 * 1024;
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};
const KEYS = {
  Space: [" ", 32],
  Enter: ["Enter", 13],
  Escape: ["Escape", 27],
  Tab: ["Tab", 9],
  ArrowUp: ["ArrowUp", 38],
  ArrowDown: ["ArrowDown", 40],
  ArrowLeft: ["ArrowLeft", 37],
  ArrowRight: ["ArrowRight", 39],
  KeyW: ["w", 87],
  KeyA: ["a", 65],
  KeyS: ["s", 83],
  KeyD: ["d", 68],
  KeyQ: ["q", 81],
  KeyE: ["e", 69],
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scenario = JSON.parse(await readFile(args.scenario, "utf8"));
const [width, height] = scenario.viewport ?? [1440, 900];
const scale = scenario.scale ?? 2;
const out = path.resolve(args.out);
await mkdir(out, { recursive: true });

const server = args.dir ? await serveStatic(path.resolve(args.dir)) : undefined;
const origin = args.url ?? `http://127.0.0.1:${server.address().port}`;

const chromePath =
  args.chrome ??
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const profile = await mkdtemp(path.join(tmpdir(), "pr-capture-profile-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--mute-audio",
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
const browserUrl = await new Promise((resolve, reject) => {
  let log = "";
  chrome.stderr.on("data", (chunk) => {
    log += chunk;
    const match = /DevTools listening on (ws:\/\/\S+)/.exec(log);
    if (match) resolve(match[1]);
  });
  chrome.on("exit", (code) =>
    reject(
      new Error(`Chrome exited (${code}) before DevTools was ready:\n${log}`),
    ),
  );
});
const debugPort = new URL(browserUrl).port;
const targets = await (
  await fetch(`http://127.0.0.1:${debugPort}/json/list`)
).json();
const page = await connect(
  targets.find((target) => target.type === "page").webSocketDebuggerUrl,
);

const written = [];
try {
  await page.send("Page.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: scale,
    mobile: width < 768,
  });
  const url = new URL(scenario.path ?? "/", origin).href;
  await navigate(url);
  if (scenario.storage) {
    await evaluate(
      `Object.entries(${JSON.stringify(scenario.storage)}).forEach(([k, v]) => localStorage.setItem(k, v))`,
    );
    await navigate(url);
  }
  await runSteps(scenario.steps ?? []);
} finally {
  page.close();
  const exited = new Promise((resolve) => chrome.once("exit", resolve));
  chrome.kill();
  await exited;
  server?.close();
  await rm(profile, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 200,
  });
}

for (const file of written) {
  const { size } = await stat(file);
  const flag = size > GITHUB_LIMIT ? "  ⚠ over GitHub’s 10 MB limit" : "";
  console.info(`${file}  ${(size / 1024).toFixed(0)} KB${flag}`);
}

async function serveStatic(root) {
  // A sync handler: an async one would hand Node a promise it ignores.
  const server = createServer((request, response) => {
    void serveFile({ root, request, response });
  });
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

/** One static file, or a 403/404. */
async function serveFile({ root, request, response }) {
  const pathname = decodeURIComponent(
    new URL(request.url, "http://localhost").pathname,
  );
  const file = path.resolve(
    root,
    `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`,
  );
  if (!file.startsWith(root)) return response.writeHead(403).end();
  try {
    const body = await readFile(file);
    response
      .writeHead(200, {
        "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
}

async function runSteps(steps) {
  for (const step of steps) {
    if (step.wait !== undefined) await sleep(step.wait);
    else if (step.waitFor) await waitFor(step.waitFor, step.timeout ?? 5000);
    else if (step.eval) await evaluate(step.eval);
    else if (step.click)
      await evaluate(
        `document.querySelector(${JSON.stringify(step.click)}).click()`,
      );
    else if (step.hover) await hover(step.hover);
    else if (step.key) await pressKey(step.key, step.hold ?? 50);
    else if (step.screenshot) await screenshot(step);
    else if (step.record) await record(step);
    else throw new Error(`Unknown step: ${JSON.stringify(step)}`);
  }
}

async function hover(selector) {
  const { x, y } = await evaluate(
    `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`,
  );
  await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
}

async function screenshot({ screenshot: name, selector, pad = 16 }) {
  let clip;
  if (selector) {
    const rect = await evaluate(
      `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })()`,
    );
    const x = Math.max(0, rect.x - pad);
    const y = Math.max(0, rect.y - pad);
    clip = {
      x,
      y,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      scale,
    };
  }
  const { data } = await page.send("Page.captureScreenshot", {
    format: "png",
    clip,
  });
  const file = path.join(out, name);
  await writeFile(file, Buffer.from(data, "base64"));
  written.push(file);
}

// Screencast frames arrive only when the page repaints, so each frame is held until the next one's
// timestamp. Chrome can send a stray frame at another size first, which would set the video's size.
async function record(step) {
  return args.recorder === "native"
    ? recordNative(step)
    : recordScreencast(step);
}

// Page.startScreenRecording (Chrome 153+, experimental) encodes AV1 inside Chrome at a steady frame
// rate, but only at 1x whatever the device scale. AV1 doesn't play on older Safari, so it is
// re-encoded to H.264 like the screencast path.
async function recordNative(step) {
  const {
    record: name,
    steps,
    gifWidth = 720,
    gifFps = 12,
    frameRate = 60,
  } = step;
  try {
    await page.send("Page.startScreenRecording", {
      maxWidth: width * scale,
      maxHeight: height * scale,
      frameRate,
    });
  } catch (error) {
    console.warn(
      `Native recording unavailable (${error.message}); using screencast for "${name}"`,
    );
    return recordScreencast(step);
  }
  await runSteps(steps);
  const { stream } = await page.send("Page.stopScreenRecording");
  const chunks = [];
  for (;;) {
    const { data, eof, base64Encoded } = await page.send("IO.read", {
      handle: stream,
      size: 1 << 20,
    });
    chunks.push(Buffer.from(data, base64Encoded ? "base64" : "utf8"));
    if (eof) break;
  }
  await page.send("IO.close", { handle: stream });
  const raw = path.join(out, `${name}.av1.mp4`);
  await writeFile(raw, Buffer.concat(chunks));
  const mp4 = path.join(out, `${name}.mp4`);
  const gif = path.join(out, `${name}.gif`);
  ffmpeg([
    "-i",
    raw,
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    mp4,
  ]);
  ffmpeg([
    "-i",
    mp4,
    "-vf",
    `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    gif,
  ]);
  written.push(mp4, gif);
  await rm(raw);
}

async function recordScreencast({
  record: name,
  steps,
  gifWidth = 720,
  gifFps = 12,
}) {
  const framesDir = await mkdtemp(path.join(tmpdir(), "pr-capture-frames-"));
  const frames = [];
  const off = page.on(
    "Page.screencastFrame",
    async ({ data, metadata, sessionId }) => {
      // A failed ack only means the screencast already stopped.
      page
        .send("Page.screencastFrameAck", { sessionId })
        .catch(() => undefined);
      if (
        Math.round(metadata.deviceWidth) !== width ||
        Math.round(metadata.deviceHeight) !== height
      )
        return;
      const file = path.join(
        framesDir,
        `${String(frames.length).padStart(5, "0")}.jpg`,
      );
      frames.push({
        file,
        time: metadata.timestamp,
        arrived: Date.now() / 1000,
      });
      await writeFile(file, Buffer.from(data, "base64"));
    },
  );
  await page.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: width * scale,
    maxHeight: height * scale,
    everyNthFrame: 1,
  });
  await runSteps(steps);
  const stopped = Date.now() / 1000;
  await page.send("Page.stopScreencast");
  off();
  await sleep(200);
  if (frames.length === 0)
    throw new Error(`Recording "${name}" captured no frames`);

  const list = frames.map((frame, i) => {
    const duration = frames[i + 1]
      ? frames[i + 1].time - frame.time
      : stopped - frame.arrived;
    return `file '${frame.file}'\nduration ${Math.max(0.01, duration).toFixed(3)}`;
  });
  const listFile = path.join(framesDir, "frames.txt");
  await writeFile(
    listFile,
    `${list.join("\n")}\nfile '${frames.at(-1).file}'\n`,
  );
  const mp4 = path.join(out, `${name}.mp4`);
  const gif = path.join(out, `${name}.gif`);
  ffmpeg([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listFile,
    "-vf",
    `scale=${width * scale}:${height * scale}`,
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    "-crf",
    "20",
    "-r",
    "30",
    "-movflags",
    "+faststart",
    mp4,
  ]);
  ffmpeg([
    "-i",
    mp4,
    "-vf",
    `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
    gif,
  ]);
  written.push(mp4, gif);
  await rm(framesDir, { recursive: true, force: true });
}

function ffmpeg(ffmpegArgs) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...ffmpegArgs], {
    stdio: "inherit",
  });
}

async function pressKey(code, hold) {
  const [key, keyCode] = KEYS[code] ?? [code, 0];
  const base = {
    code,
    key,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  };
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    ...base,
    text: key.length === 1 ? key : undefined,
  });
  await sleep(hold);
  await page.send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
}

async function waitFor(expression, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(50);
  }
  throw new Error(`Timed out after ${timeout}ms waiting for: ${expression}`);
}

async function evaluate(expression) {
  const { result, exceptionDetails } = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails)
    throw new Error(
      `Page script failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`,
    );
  return result.value;
}

async function navigate(url) {
  const loaded = new Promise((resolve) => {
    const off = page.on("Page.loadEventFired", () => {
      off();
      resolve();
    });
  });
  await page.send("Page.navigate", { url });
  await loaded;
}

function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id !== undefined) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error)
        reject(
          new Error(`${message.error.message} (${message.error.data ?? ""})`),
        );
      else resolve(message.result);
    } else {
      for (const listener of listeners.get(message.method) ?? [])
        listener(message.params);
    }
  };
  const client = {
    send: (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        pending.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      }),
    on(method, listener) {
      if (!listeners.has(method)) listeners.set(method, new Set());
      listeners.get(method).add(listener);
      return () => listeners.get(method).delete(listener);
    },
    close: () => socket.close(),
  };
  return new Promise((resolve, reject) => {
    socket.onopen = () => resolve(client);
    socket.onerror = () =>
      reject(new Error(`Could not connect to Chrome at ${url}`));
  });
}
