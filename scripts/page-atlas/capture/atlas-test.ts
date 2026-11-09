import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

import {
  CHANGELOG_SEEN_STORAGE_KEY,
  CTA_TOAST_STORAGE_KEY,
  WELCOME_POPUP_SEEN_STORAGE_KEY,
  WELCOME_POPUP_SEEN_VALUE,
} from "@/app/schema";
import { POSTHOG_E2E_DISABLED_STORAGE_KEY } from "@/lib/analytics/posthog-e2e-flags";
import { SENTRY_E2E_DISABLED_STORAGE_KEY } from "@/lib/sentry/sentry-e2e-flags";

import { getLatestChangelogSlug } from "../../../e2e/utils/latest-changelog-slug";
import {
  getShotFileName,
  STATES,
  VIEWPORTS,
  type StateId,
  type Viewport,
} from "../atlas-model";

const SHOTS_DIR = path.join(__dirname, "../output/shots");

/** Every capture runs on this date, so invoice numbers and dates never drift. */
const FIXED_NOW = new Date("2026-11-02T09:00:00Z");

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const DOWNLOAD_PDF_LINK_NAME = /^(Download PDF|Download PDF in .+)$/;

/** The form debounce (500ms) plus slack for the PDF render to start. */
const DEBOUNCE_WAIT_MS = 700;

interface StorageStateOptions {
  /** Leave the welcome popup unseen, as on a first visit. */
  isFirstVisit?: boolean;
  /** Leave the newest changelog post unseen, so the What's new popup shows. */
  hasUnseenRelease?: boolean;
  /** Let the support toast show after the next download. */
  isSupportToastDue?: boolean;
}

/**
 * The browser state every capture starts from: analytics off, both popups seen and the
 * support toast already shown today, unless a flow asks otherwise.
 */
export function atlasStorageState({
  isFirstVisit = false,
  hasUnseenRelease = false,
  isSupportToastDue = false,
}: StorageStateOptions = {}) {
  const localStorage = [
    { name: "umami.disabled", value: "1" },
    { name: SENTRY_E2E_DISABLED_STORAGE_KEY, value: "1" },
    { name: POSTHOG_E2E_DISABLED_STORAGE_KEY, value: "1" },
    ...(isFirstVisit
      ? []
      : [
          {
            name: WELCOME_POPUP_SEEN_STORAGE_KEY,
            value: WELCOME_POPUP_SEEN_VALUE,
          },
        ]),
    ...(hasUnseenRelease
      ? []
      : [
          {
            name: CHANGELOG_SEEN_STORAGE_KEY,
            value: getLatestChangelogSlug(),
          },
        ]),
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

  atlas: async ({ page }, use, testInfo) => {
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

        await page.screenshot({
          path: path.join(SHOTS_DIR, viewport, getShotFileName(stateId)),
          type: "jpeg",
          quality: 70,
          caret: "hide",
          // dev-only overlays: the breakpoint badge and the Next.js dev tools button
          style:
            '[data-info="responsive-indicator"], nextjs-portal { display: none !important; }',
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

export function getDownloadPdfLink(page: Page) {
  return page.getByRole("link", { name: DOWNLOAD_PDF_LINK_NAME });
}

export function getToasts(page: Page) {
  return page.getByLabel("Notifications alt+T");
}

export { expect };
