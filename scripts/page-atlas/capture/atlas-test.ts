import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

import { CTA_TOAST_STORAGE_KEY } from "@/app/schema";
import { POSTHOG_E2E_DISABLED_STORAGE_KEY } from "@/lib/analytics/posthog-e2e-flags";
import { SENTRY_E2E_DISABLED_STORAGE_KEY } from "@/lib/sentry/sentry-e2e-flags";

import {
  getShotFileName,
  STATES,
  VIEWPORTS,
  type StateId,
  type Viewport,
} from "../atlas-model";
import { recordShot, type ShotRegion } from "../shot-history";

const SHOTS_DIR = path.join(__dirname, "../output/shots");

/** This capture run, set once by `playwright.config.ts` and shared by every worker. */
const RUN_ID = process.env.ATLAS_RUN_ID ?? new Date().toISOString();

/** Every capture runs on this date, so invoice numbers and dates never drift. */
const FIXED_NOW = new Date("2026-11-02T09:00:00Z");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const DOWNLOAD_PDF_LINK_NAME = /^(Download PDF|Download PDF in .+)$/;

/** The form debounce (500ms) plus slack for the PDF render to start. */
const DEBOUNCE_WAIT_MS = 700;

interface StorageStateOptions {
  /** Let the support toast show after the next download. */
  isSupportToastDue?: boolean;
}

/**
 * The browser state every capture starts from: analytics off and the support toast already shown today, unless a flow asks otherwise.
 */
export function atlasStorageState({
  isSupportToastDue = false,
}: StorageStateOptions = {}) {
  const localStorage = [
    { name: "umami.disabled", value: "1" },
    { name: SENTRY_E2E_DISABLED_STORAGE_KEY, value: "1" },
    { name: POSTHOG_E2E_DISABLED_STORAGE_KEY, value: "1" },
    ...(isSupportToastDue
      ? []
      : [{ name: CTA_TOAST_STORAGE_KEY, value: String(FIXED_NOW.getTime()) }]),
  ];

  return { cookies: [], origins: [{ origin: BASE_URL, localStorage }] };
}

interface SnapOptions {
  /** Scroll this element into view first, so the shot shows the part that changed. */
  scrollTo?: Locator;
  /** Take the shot at once, for states that only last a moment. */
  isTransient?: boolean;
}

interface OpenEditorOptions {
  path?: string;
  /** Wait for the PDF before returning; off for states captured mid-render. */
  shouldWaitForPdf?: boolean;
}

interface Atlas {
  viewport: Viewport;
  isPhone: boolean;
  /** Screenshots the page as the given state, unless the state skips this viewport. */
  snap: (stateId: StateId, options?: SnapOptions) => Promise<void>;
  openEditor: (options?: OpenEditorOptions) => Promise<void>;
  waitForPdf: () => Promise<void>;
  /** Runs a form edit and waits for the debounce and the PDF re-render. */
  editAndWait: (edit: () => Promise<void>) => Promise<void>;
  /** A per-test scratch directory for downloads and generated files. */
  scratchDir: string;
}

export const test = base.extend<{ atlas: Atlas }>({
  storageState: atlasStorageState(),

  atlas: async ({ page, browser }, use, testInfo) => {
    const viewport = testInfo.project.name as Viewport;

    if (!VIEWPORTS.includes(viewport)) {
      throw new Error(`Unknown atlas project "${viewport}"`);
    }

    const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "page-atlas-"));

    // YouTube embeds and thumbnails never render the same twice
    await page.route(/youtube\.com|ytimg\.com|googlevideo\.com/, (route) => {
      return route.abort();
    });
    await page.clock.setSystemTime(FIXED_NOW);

    // Seeded randomness, so anything drawn at random (the about page's rough-notation
    // highlights) comes out the same in every capture
    await page.addInitScript(() => {
      let seed = 0x2f_6b_4a_1d;

      Math.random = () => {
        // mulberry32
        seed = Math.trunc(seed + 0x6d_2b_79_f5);
        let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

        return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
      };
    });

    async function waitForPdf() {
      const downloadLink = getDownloadPdfLink(page);

      await expect(downloadLink).toBeVisible();
      await expect(downloadLink).toHaveAttribute("href", /^blob:/);
    }

    const atlas: Atlas = {
      viewport,
      isPhone: viewport === "phone",
      scratchDir,
      waitForPdf,

      async snap(stateId, { scrollTo, isTransient = false } = {}) {
        const { only } = STATES[stateId];

        if (only && only !== viewport) {
          return;
        }

        if (scrollTo) {
          await scrollTo.scrollIntoViewIfNeeded();
        }

        if (!isTransient) {
          await page.evaluate(async () => {
            await document.fonts.ready;
          });
          // let toasts, popovers and the PDF iframe finish painting
          // oxlint-disable-next-line playwright/no-wait-for-timeout
          await page.waitForTimeout(500);
        }

        await freezeVideos(page);
        await waitForImages(page);

        if (!isTransient) await waitForToastsToSettle(page);

        const screenshot = await page.screenshot({
          type: "jpeg",
          // a running animation would make every capture look changed, see shot-history.ts
          animations: "disabled",
          quality: 70,
          caret: "hide",
          // dev-only overlays: the breakpoint badge and the Next.js dev tools button
          style:
            '[data-info="responsive-indicator"], nextjs-portal { display: none !important; }',
        });

        await recordShot({
          browser,
          file: path.join(SHOTS_DIR, viewport, getShotFileName(stateId)),
          viewport,
          screenshot,
          runId: RUN_ID,
          ignoredRegions: await getVolatileRegions(page),
        });
      },

      async openEditor({ path: url = "/", shouldWaitForPdf = true } = {}) {
        // `load` can stall behind the dev server's lazy compiles; the PDF wait is the real signal
        await page.goto(url, { waitUntil: "domcontentloaded" });

        if (shouldWaitForPdf) {
          await waitForPdf();
        }
      },

      async editAndWait(edit) {
        await edit();
        // oxlint-disable-next-line playwright/no-wait-for-timeout
        await page.waitForTimeout(DEBOUNCE_WAIT_MS);
        await waitForPdf();
      },
    };

    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      await use(atlas);
    } finally {
      fs.rmSync(scratchDir, { recursive: true, force: true });
    }
  },
});

/**
 * Shows every video's poster instead of whatever frame it's on: which frame a playing
 * video shows at screenshot time is down to timing, and even a seek to a fixed time lands
 * a frame either side, so only the poster looks the same in every capture.
 */
async function freezeVideos(page: Page) {
  await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")];

    await Promise.all(
      videos.map(async (video) => {
        const poster = video.getAttribute("poster");

        video.autoplay = false;
        video.pause();

        if (!poster) return;

        const image = new Image();
        image.src = poster;
        await image.decode().catch(() => {
          return null;
        });

        // reloading an element that won't autoplay puts it back on its poster
        video.load();
      }),
    );

    // let the posters paint before the screenshot
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });
}

/**
 * Waits for every toast to be mounted and laid out. Sonner measures each toast and then
 * positions the stack from those heights, so a busy machine can otherwise catch a toast
 * before it has moved into place.
 */
async function waitForToastsToSettle(page: Page) {
  await page
    .waitForFunction(
      () => {
        return [...document.querySelectorAll("[data-sonner-toast]")].every(
          (toast) => {
            return toast.getAttribute("data-mounted") === "true";
          },
        );
      },
      undefined,
      { timeout: 5000 },
    )
    .catch(() => {
      return null;
    });

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });
}

/**
 * Elements whose content comes from outside the app and can differ from one capture to
 * the next: the GitHub star counts, which read "Star on GitHub" whenever the dev server's
 * request to GitHub fails.
 */
const VOLATILE_SELECTOR = 'a[href^="https://github.com/"]';

/** Where the volatile elements are on screen, in screenshot pixels. */
function getVolatileRegions(page: Page): Promise<ShotRegion[]> {
  return page.evaluate((selector) => {
    const scale = window.devicePixelRatio;

    return [...document.querySelectorAll(selector)]
      .map((element) => {
        return element.getBoundingClientRect();
      })
      .filter((box) => {
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.bottom > 0 &&
          box.top < window.innerHeight
        );
      })
      .map((box) => {
        return {
          x: Math.floor(box.left * scale),
          y: Math.floor(box.top * scale),
          width: Math.ceil(box.width * scale),
          height: Math.ceil(box.height * scale),
        };
      });
  }, VOLATILE_SELECTOR);
}

/**
 * Waits for the images on the page to finish loading (a lazy avatar is otherwise there in
 * one capture and blank in the next), giving up after a few seconds on any that never do.
 */
async function waitForImages(page: Page) {
  await page.evaluate(async () => {
    // only the ones on screen: a lazy image below the fold never loads, and waiting for
    // it would hold every shot up long enough for a toast to expire
    const pending = [...document.images].filter((image) => {
      const box = image.getBoundingClientRect();

      return (
        !image.complete &&
        box.bottom > 0 &&
        box.top < window.innerHeight &&
        box.right > 0 &&
        box.left < window.innerWidth
      );
    });

    await Promise.race([
      Promise.all(
        pending.map((image) => {
          return image.decode().catch(() => {
            return null;
          });
        }),
      ),
      new Promise((resolve) => {
        setTimeout(resolve, 3000);
      }),
    ]);
  });
}

export function getDownloadPdfLink(page: Page) {
  return page.getByRole("link", { name: DOWNLOAD_PDF_LINK_NAME });
}

export function getToasts(page: Page) {
  return page.getByLabel("Notifications alt+T");
}

export { expect };
