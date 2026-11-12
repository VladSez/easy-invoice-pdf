import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { type Browser, chromium } from "@playwright/test";

/**
 * Renders each `*-og-video.html` in this folder to the MP4 used as an og:video. Run
 * with `pnpm og-video` (all of them) or `pnpm og-video stripe` (one); needs `ffmpeg`
 * on PATH.
 *
 * Recording the page in real time drops and stretches frames, so instead every CSS
 * animation is paused and seeked to each frame's timestamp, and each frame is a
 * screenshot. The output is the same on every run and on any machine.
 *
 * Each MP4 lands in `output/`, named after its URL constant in src/config.ts. To change
 * a video, bump the version suffix there first (platforms and the CDN cache by URL),
 * then upload the file to the root of the static.easyinvoicepdf.com R2 bucket.
 */

const OG_VIDEOS = [
  { name: "default", configConstant: "OG_VIDEO_URL" },
  { name: "stripe", configConstant: "STRIPE_OG_VIDEO_URL" },
] as const;

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = import.meta.dirname;
const REPO_ROOT = path.join(SCRIPT_DIR, "../..");
const OUTPUT_DIR = path.join(SCRIPT_DIR, "output");

const WIDTH = 1200;
const HEIGHT = 630;
const FPS = 30;
const DURATION_SECONDS = 8;
// Frames are captured at 2x and downscaled, which keeps small text crisp in the MP4.
const CAPTURE_SCALE = 2;

const LOGO_SOURCE = path.join(
  REPO_ROOT,
  "src/components/etc/final-project-logo.tsx",
);

const requestedName = process.argv[2];
const videos = requestedName
  ? OG_VIDEOS.filter(({ name }) => {
      return name === requestedName;
    })
  : OG_VIDEOS;

if (videos.length === 0) {
  const names = OG_VIDEOS.map(({ name }) => {
    return name;
  });

  console.error(
    `Unknown video "${requestedName}". Pick one of: ${names.join(", ")}`,
  );
  process.exit(1);
}

const config = fs.readFileSync(path.join(REPO_ROOT, "src/config.ts"), "utf8");
const logoSvg = readLogoSvg();

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const browser = await chromium.launch();

try {
  for (const video of videos) {
    await renderVideo({
      browser,
      name: video.name,
      outputFileName: readVideoFileName({
        config,
        configConstant: video.configConstant,
      }),
    });
  }
} finally {
  await browser.close();
}

interface RenderVideoOptions {
  /** The Chromium instance every video's page is opened in. */
  browser: Browser;
  /** Picks the source, `<name>-og-video.html`. */
  name: string;
  /** The MP4's file name in `output/`, matching its URL in src/config.ts. */
  outputFileName: string;
}

async function renderVideo({
  browser,
  name,
  outputFileName,
}: RenderVideoOptions) {
  const framesDir = path.join(OUTPUT_DIR, `${name}-frames`);
  const pageFile = path.join(OUTPUT_DIR, `${name}-og-video.html`);
  const outputFile = path.join(OUTPUT_DIR, outputFileName);

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  fs.writeFileSync(
    pageFile,
    fs
      .readFileSync(path.join(SCRIPT_DIR, `${name}-og-video.html`), "utf8")
      .replace("<!-- LOGO -->", logoSvg),
  );

  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: CAPTURE_SCALE,
  });

  try {
    await page.goto(`file://${pageFile}`);

    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.load('800 76px "Inter"');
      await document.fonts.ready;

      return document.fonts.check('800 76px "Inter"');
    });

    if (!fontsLoaded) {
      throw new Error(
        "Inter did not load from Google Fonts; check the network",
      );
    }

    const frameCount = FPS * DURATION_SECONDS;

    for (let frame = 0; frame < frameCount; frame++) {
      await page.evaluate(
        (timeMs) => {
          for (const animation of document.getAnimations()) {
            animation.pause();
            animation.currentTime = timeMs;
          }
        },
        (frame * 1000) / FPS,
      );

      await page.screenshot({
        path: path.join(framesDir, `${String(frame).padStart(4, "0")}.png`),
      });
    }
  } finally {
    await page.close();
  }

  await execFileAsync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-framerate",
    String(FPS),
    "-i",
    path.join(framesDir, "%04d.png"),
    "-vf",
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos,format=yuv420p`,
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-preset",
    "slow",
    "-crf",
    "20",
    // moov atom first, so players can start before the whole file has downloaded
    "-movflags",
    "+faststart",
    "-an",
    outputFile,
  ]);

  const sizeKb = Math.round(fs.statSync(outputFile).size / 1024);

  console.info(`Wrote ${path.relative(REPO_ROOT, outputFile)} (${sizeKb} KB)`);
}

interface ReadVideoFileNameOptions {
  /** The text of src/config.ts. */
  config: string;
  /** The constant holding the video's URL, e.g. `OG_VIDEO_URL`. */
  configConstant: string;
}

/**
 * The file name a URL constant in src/config.ts points at, read from the source
 * because Node can't import src/config.ts (it reads env vars through Next).
 */
function readVideoFileName({
  config,
  configConstant,
}: ReadVideoFileNameOptions) {
  const fileName = new RegExp(
    `\\b${configConstant} = \`[^\`]*/([^/\`]+\\.mp4)\``,
  ).exec(config)?.[1];

  if (!fileName) {
    throw new Error(
      `Could not find ${configConstant}'s file name in src/config.ts`,
    );
  }

  return fileName;
}

/**
 * The logo's shape, lifted out of its React component so the videos and the site can't
 * drift apart. Its gradient fill is swapped for `currentColor`, so each video paints
 * it one solid colour with CSS `color`.
 */
function readLogoSvg() {
  const source = fs.readFileSync(LOGO_SOURCE, "utf8");
  const svg = /<svg[\s\S]*<\/svg>/.exec(source)?.[0];

  if (!svg) {
    throw new Error(`No <svg> element found in ${LOGO_SOURCE}`);
  }

  const markup = svg
    .replace(/\s+className=\{[^}]*\}/, "")
    .replace(/\s*<defs>[\s\S]*<\/defs>/, "")
    .replaceAll(/fill="url\([^)]*\)"/g, 'fill="currentColor"');

  if (/[A-Z][a-z]*=\{|url\(/.test(markup)) {
    throw new Error(
      `${LOGO_SOURCE} changed shape: its SVG still has JSX expressions or a url() paint`,
    );
  }

  return markup;
}
