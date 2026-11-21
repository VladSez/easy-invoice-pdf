import fs from "node:fs";
import path from "node:path";

import type { Browser, BrowserContext } from "@playwright/test";

import type { Viewport } from "./atlas-model";

/**
 * When each screenshot last changed, kept beside the shots so it survives between
 * captures. A recapture of an unchanged screen still writes a new file (JPEG output is
 * not byte-stable), so "changed" is decided by comparing pixels, not file times.
 */
const HISTORY_DIR = path.join(__dirname, "output/history");

/**
 * Fraction of pixels that must differ before a shot counts as changed, about 200 pixels.
 * Recapturing an unchanged screen measured at most 0.00008 (JPEG and anti-aliasing
 * noise); one changed word comes to roughly 0.0002 to 0.0009, and an edited field with
 * its PDF re-rendered to 0.02 or more.
 */
const CHANGED_PIXEL_RATIO = 0.00015;

/**
 * How far apart two pixels' channels must be to count as different, out of 255. High, so
 * the soft halo JPEG leaves around edges is ignored while text on a background, which
 * differs by far more, still counts.
 */
const CHANNEL_TOLERANCE = 96;

/**
 * Compares a new screenshot with the one it replaces and updates its history: a shot
 * that looks different (or is the first of its state) is stamped with this run.
 */
export async function recordShot({
  browser,
  file,
  viewport,
  screenshot,
  runId,
  ignoredRegions,
}: RecordShotArgs) {
  const previous = fs.existsSync(file) ? fs.readFileSync(file) : null;
  const previousCapturedAt = previous ? fs.statSync(file).mtime : null;
  const history = readShotHistory({ viewport, fileName: path.basename(file) });

  const hasChanged = previous
    ? await looksDifferent({
        browser,
        before: previous,
        after: screenshot,
        // where they were then and where they are now, as they may have changed size
        ignoredRegions: [...(history?.ignoredRegions ?? []), ...ignoredRegions],
      })
    : true;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, screenshot);

  if (hasChanged) {
    writeShotHistory({
      viewport,
      fileName: path.basename(file),
      history: {
        changedAt: new Date().toISOString(),
        changedInRun: runId,
        isNew: !previous,
        ignoredRegions,
      },
    });

    return;
  }

  if (!history && previousCapturedAt) {
    // first capture since history began: a baseline, dated to the old shot, that belongs
    // to no run, so it never shows among the latest changes
    writeShotHistory({
      viewport,
      fileName: path.basename(file),
      history: {
        changedAt: previousCapturedAt.toISOString(),
        changedInRun: null,
        isNew: false,
        ignoredRegions,
      },
    });

    return;
  }

  if (history) {
    // unchanged, but keep where the volatile elements are now for the next comparison
    writeShotHistory({
      viewport,
      fileName: path.basename(file),
      history: { ...history, ignoredRegions },
    });
  }
}

export function readShotHistory({
  viewport,
  fileName,
}: ShotLocation): ShotHistory | null {
  const file = getHistoryFile({ viewport, fileName });

  if (!fs.existsSync(file)) return null;

  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as ShotHistory;
  } catch {
    return null;
  }
}

function writeShotHistory({
  viewport,
  fileName,
  history,
}: ShotLocation & { history: ShotHistory }) {
  const file = getHistoryFile({ viewport, fileName });

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(history, null, 2)}\n`);
}

function getHistoryFile({ viewport, fileName }: ShotLocation) {
  return path.join(HISTORY_DIR, viewport, fileName.replace(/\.jpg$/, ".json"));
}

/**
 * Decodes both screenshots in a blank page of their own (so the captured page keeps its
 * focus and state) and reports whether enough pixels differ to call it a change.
 */
async function looksDifferent({
  browser,
  before,
  after,
  ignoredRegions,
}: LooksDifferentArgs) {
  const context = await getComparisonContext(browser);
  const page = await context.newPage();

  try {
    const ratio = await page.evaluate(
      async ({ beforeBase64, afterBase64, tolerance, regions }) => {
        // inside the callback on purpose: it runs in the browser, not here
        // oxlint-disable-next-line unicorn/consistent-function-scoping
        async function decode(base64: string) {
          const response = await fetch(`data:image/jpeg;base64,${base64}`);
          const bitmap = await createImageBitmap(await response.blob());
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext("2d");

          if (!context) throw new Error("no 2d context to compare screenshots");

          context.drawImage(bitmap, 0, 0);

          return context.getImageData(0, 0, bitmap.width, bitmap.height);
        }

        const [a, b] = await Promise.all([
          decode(beforeBase64),
          decode(afterBase64),
        ]);

        if (a.width !== b.width || a.height !== b.height) return 1;

        const ignored = new Uint8Array(a.width * a.height);

        for (const region of regions) {
          for (
            let y = Math.max(0, region.y);
            y < Math.min(a.height, region.y + region.height);
            y++
          ) {
            ignored.fill(
              1,
              y * a.width + Math.max(0, region.x),
              y * a.width + Math.min(a.width, region.x + region.width),
            );
          }
        }

        let differing = 0;

        for (let index = 0; index < a.data.length; index += 4) {
          if (ignored[index / 4]) continue;

          if (
            Math.abs(a.data[index] - b.data[index]) > tolerance ||
            Math.abs(a.data[index + 1] - b.data[index + 1]) > tolerance ||
            Math.abs(a.data[index + 2] - b.data[index + 2]) > tolerance
          ) {
            differing++;
          }
        }

        return differing / (a.width * a.height);
      },
      {
        beforeBase64: before.toString("base64"),
        afterBase64: after.toString("base64"),
        tolerance: CHANNEL_TOLERANCE,
        regions: ignoredRegions,
      },
    );

    return ratio > CHANGED_PIXEL_RATIO;
  } finally {
    await page.close();
  }
}

const comparisonContexts = new WeakMap<Browser, Promise<BrowserContext>>();

/** One blank context per browser, reused for every comparison in the worker. */
function getComparisonContext(browser: Browser) {
  let context = comparisonContexts.get(browser);

  if (!context) {
    context = browser.newContext();
    comparisonContexts.set(browser, context);
  }

  return context;
}

/** One shot's history, stored as `output/history/<viewport>/<shot>.json`. */
export interface ShotHistory {
  /** When the shot last looked different from the one before it. */
  changedAt: string;
  /**
   * The capture run that saw that change, so one run's changes can be shown together;
   * null for the baseline recorded when history began.
   */
  changedInRun: string | null;
  /** The change was the state's first screenshot. */
  isNew: boolean;
  /** Where the volatile elements were in the last capture, left out of the next comparison. */
  ignoredRegions?: ShotRegion[];
}

/** A rectangle of a screenshot, in its pixels. */
export interface ShotRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ShotLocation {
  viewport: Viewport;
  /** The shot's file name, e.g. `editor--default.jpg`. */
  fileName: string;
}

interface RecordShotArgs {
  browser: Browser;
  /** Where the shot is written. */
  file: string;
  viewport: Viewport;
  screenshot: Buffer;
  /** This capture run's id, from `ATLAS_RUN_ID`. */
  runId: string;
  /** Volatile parts of this screenshot that don't count as a change. */
  ignoredRegions: ShotRegion[];
}

interface LooksDifferentArgs {
  browser: Browser;
  before: Buffer;
  after: Buffer;
  ignoredRegions: ShotRegion[];
}
