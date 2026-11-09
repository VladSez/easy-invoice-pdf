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
  const filePath = resolveFilePath(request.url ?? "/");

  if (!filePath) {
    response.writeHead(404).end("Not found");

    return;
  }

  response.writeHead(200, {
    "Content-Type":
      CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath)
    .on("error", () => {
      // the file vanished mid-request (a capture rewriting output/)
      response.destroy();
    })
    .pipe(response);
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

/**
 * Maps a request URL to a file inside `output/`, or `null` when there is none: a
 * malformed escape (`/%E0`), a path that leaves `output/` (`/../package.json`, or a
 * sibling such as `output-old/`), a directory, or a missing file.
 */
function resolveFilePath(requestUrl: string) {
  let urlPath: string;

  try {
    urlPath = decodeURIComponent(
      new URL(requestUrl, "http://localhost").pathname,
    );
  } catch {
    return null;
  }

  const filePath = path.join(
    OUTPUT_DIR,
    urlPath === "/" ? "index.html" : urlPath,
  );
  // compares whole path segments, unlike a string prefix check
  const relativePath = path.relative(OUTPUT_DIR, filePath);

  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return null;
  }

  try {
    return fs.statSync(filePath).isFile() ? filePath : null;
  } catch {
    return null;
  }
}
