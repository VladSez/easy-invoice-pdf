import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

/**
 * Serves the last captured atlas (`output/`) on http://localhost:6007 and opens it,
 * the way `storybook dev` does. Run with `pnpm atlas:view`; Node runs this file
 * directly, so it imports nothing but Node built-ins.
 */

const OUTPUT_DIR = path.join(import.meta.dirname, "output");
const PORT = Number(process.env.ATLAS_PORT ?? 6007);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};

if (!fs.existsSync(path.join(OUTPUT_DIR, "index.html"))) {
  console.error("No atlas yet. Run `pnpm atlas` first to capture it.");
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(
    new URL(request.url ?? "/", "http://localhost").pathname,
  );
  const filePath = path.join(
    OUTPUT_DIR,
    urlPath === "/" ? "index.html" : urlPath,
  );

  // keep requests inside output/
  if (
    !filePath.startsWith(OUTPUT_DIR) ||
    !fs.existsSync(filePath) ||
    !fs.statSync(filePath).isFile()
  ) {
    response.writeHead(404).end("Not found");

    return;
  }

  response.writeHead(200, {
    "Content-Type":
      CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;

  console.info(`Screen atlas: ${url} (Ctrl+C to stop)`);

  const opener =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "explorer"
        : "xdg-open";

  execFile(opener, [url], () => {
    // no browser to open (CI, SSH): the URL above is enough
  });
});
