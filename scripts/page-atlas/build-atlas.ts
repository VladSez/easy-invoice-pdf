import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  AREAS,
  FLOWS,
  getPageId,
  getShotFileName,
  PAGES,
  STATES,
  VIEWPORTS,
  type StateId,
} from "./atlas-model";

const OUTPUT_DIR = path.join(__dirname, "output");
const SHOTS_DIR = path.join(OUTPUT_DIR, "shots");
/** Matched loosely: oxfmt puts a space between the comment and `null`. */
const DATA_PLACEHOLDER = /\/\*__ATLAS_DATA__\*\/\s*null/;

/**
 * The JSON escape for `<`, built from parts: oxfmt rewrites a written-out `\u003c`
 * escape back into the literal character, which would make the replace a no-op.
 */
const SCRIPT_SAFE_LESS_THAN = `${"\\"}u003c`;

/** When this Playwright run started; shots written after it are new in this run. */
const RUN_STARTED_AT = Date.now() - process.uptime() * 1000;

/**
 * Playwright global teardown: joins the screenshots on disk with the atlas model and
 * writes `output/index.html`, a self-contained viewer that loads `shots/` next to it.
 * Runs after every capture, including partial ones, so a failed flow shows up as
 * states marked "not captured" instead of a missing page.
 *
 * @lintignore loaded by name from `playwright.config.ts`
 */
export default function buildAtlas() {
  const states = (Object.keys(STATES) as StateId[]).map((id) => {
    const shots = Object.fromEntries(
      VIEWPORTS.flatMap((viewport) => {
        const file = path.join(SHOTS_DIR, viewport, getShotFileName(id));

        if (!fs.existsSync(file)) {
          return [];
        }

        return [
          [
            viewport,
            {
              src: `shots/${viewport}/${getShotFileName(id)}`,
              capturedAt: fs.statSync(file).mtime.toISOString(),
            },
          ],
        ];
      }),
    );

    return { id, page: getPageId(id), ...STATES[id], shots };
  });

  const missing = states.flatMap((state) => {
    return VIEWPORTS.filter((viewport) => {
      return (!state.only || state.only === viewport) && !state.shots[viewport];
    }).map((viewport) => {
      return `${state.id} (${viewport})`;
    });
  });

  const data = {
    builtAt: new Date().toISOString(),
    commit: readGitCommit(),
    areas: AREAS,
    pages: PAGES,
    states,
    flows: FLOWS,
  };

  const template = fs.readFileSync(path.join(__dirname, "viewer.html"), "utf8");

  if (!DATA_PLACEHOLDER.test(template)) {
    throw new Error("viewer.html has no /*__ATLAS_DATA__*/ null placeholder");
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "index.html"),
    // `<` escaped so a state title can never close the script tag
    // a replacer function, so `$` in the data is never read as a replacement pattern
    template.replace(DATA_PLACEHOLDER, () => {
      return JSON.stringify(data).replaceAll("<", SCRIPT_SAFE_LESS_THAN);
    }),
  );

  console.info(
    `Page atlas: ${states.length} states, ${FLOWS.length} flows -> ${path.join(OUTPUT_DIR, "index.html")}`,
  );

  writePublishManifest();

  if (missing.length > 0) {
    console.warn(
      `Not captured (${missing.length}):\n  ${missing.join("\n  ")}`,
    );
  }
}

/**
 * `output/publish.json`, for republishing the artifact: `changed` lists the shots this
 * run wrote, `all` every shot the model still uses, and `removed` the shots on disk
 * whose state left the model, to delete from the artifact.
 */
function writePublishManifest() {
  const used = new Set(
    (Object.keys(STATES) as StateId[]).flatMap((id) => {
      return VIEWPORTS.map((viewport) => {
        return `shots/${viewport}/${getShotFileName(id)}`;
      });
    }),
  );
  const onDisk = VIEWPORTS.flatMap((viewport) => {
    const dir = path.join(SHOTS_DIR, viewport);

    return fs.existsSync(dir)
      ? fs.readdirSync(dir).map((file) => {
          return `shots/${viewport}/${file}`;
        })
      : [];
  }).toSorted();

  const all = onDisk.filter((file) => {
    return used.has(file);
  });
  const changed = all.filter((file) => {
    return fs.statSync(path.join(OUTPUT_DIR, file)).mtimeMs >= RUN_STARTED_AT;
  });
  const removed = onDisk.filter((file) => {
    return !used.has(file);
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "publish.json"),
    `${JSON.stringify({ changed, removed, all }, null, 2)}\n`,
  );
  console.info(
    `Publish manifest: ${changed.length} changed, ${removed.length} removed, ${all.length} total`,
  );
}

function readGitCommit() {
  try {
    const sha = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    const isDirty =
      execSync("git status --porcelain", { encoding: "utf8" }).trim() !== "";

    return { sha, isDirty };
  } catch {
    return null;
  }
}
