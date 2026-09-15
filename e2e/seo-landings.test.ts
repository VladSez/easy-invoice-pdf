import { expect, test } from "@playwright/test";

import {
  SEO_LANDING_DEFINITIONS,
  type SeoLandingSlug,
} from "@/app/(main)/(seo-landings)/seo-landing-definitions";

const SLUGS = Object.keys(SEO_LANDING_DEFINITIONS) as SeoLandingSlug[];

const SEO_LANDING_CASES = SLUGS.map((slug) => {
  return {
    path: `/${slug}`,
    h1: SEO_LANDING_DEFINITIONS[slug].hero.h1,
    subheading: SEO_LANDING_DEFINITIONS[slug].hero.subheading,
    ctaName: SEO_LANDING_DEFINITIONS[slug].hero.ctaLabel,
    heroImageSrc: SEO_LANDING_DEFINITIONS[slug].hero.heroImage,
    heroVideo:
      "heroVideo" in SEO_LANDING_DEFINITIONS[slug].hero
        ? SEO_LANDING_DEFINITIONS[slug].hero.heroVideo
        : undefined,
    ctaHref: SEO_LANDING_DEFINITIONS[slug].hero.ctaHref,
  };
});

test.describe("SEO landing pages", () => {
  for (const {
    path,
    h1,
    subheading,
    ctaName,
    heroImageSrc,
    ctaHref,
  } of SEO_LANDING_CASES) {
    test(`should render ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(path);

      // Check header visibility
      const header = page.locator("header");
      await expect(header).toBeVisible();

      const goToAppButton = header.getByRole("link", {
        name: "Open app",
        exact: true,
      });

      await expect(goToAppButton).toBeVisible();
      await expect(goToAppButton).toHaveAttribute("href", "/?template=default");

      await expect(
        page.getByRole("heading", { level: 1, name: h1 }),
      ).toBeVisible();

      // the hero opener is a paragraph, so that the section titles are the page's h2s
      await expect(page.getByText(subheading, { exact: true })).toBeVisible();

      /** Check that hero image exists and loads  */
      const imageRes = await fetch(heroImageSrc);

      const imageOk = imageRes.ok;
      expect(imageOk).toBe(true);

      const imageStatus = imageRes.status;
      expect(imageStatus).toBe(200);

      const imageHeaders = imageRes.headers;
      expect(imageHeaders.get("content-type")).toContain("image/png");

      const primaryCtas = page.getByRole("link", {
        name: ctaName,
        exact: true,
      });
      await expect(primaryCtas.first()).toBeVisible();
      await expect(primaryCtas.first()).toHaveAttribute("href", ctaHref);

      // the sticky bar stands down while another CTA is on screen, so at the top of the
      // page it is parked; `inert` is what the assertions read, because Playwright counts
      // an `opacity: 0` element as visible
      await expect(page.getByTestId("seo-sticky-cta-root")).toHaveAttribute(
        "inert",
        "",
      );
      await expect(page.getByTestId("seo-sticky-cta")).toHaveAttribute(
        "href",
        ctaHref,
      );
      await expect(page.getByTestId("seo-sticky-cta")).toHaveText(ctaName);

      // Check footer visibility
      const footer = page.locator("footer");
      await expect(footer).toBeVisible();

      const appLink = footer.getByRole("link", {
        name: "Invoice Generator",
        exact: true,
      });

      await expect(appLink).toBeVisible();
      await expect(appLink).toHaveAttribute("href", "/");
      await expect(appLink).not.toHaveAttribute("target", "_blank");

      await expect(
        footer.locator('[data-testid="footer-logos-social-links"]'),
      ).toBeVisible();
    });
  }

  test("sticky CTA stays up once the hero CTA is behind you", async ({
    page,
  }) => {
    await page.goto("/invoice-template-pdf");

    const stickyRoot = page.getByTestId("seo-sticky-cta-root");
    const heroCta = page.getByRole("link", {
      name: "Fill In and Download a PDF",
      exact: true,
    });

    // parked next to the hero CTA; `inert` is what the assertions read, because Playwright
    // counts an `opacity: 0` element as visible
    await expect(stickyRoot).toHaveAttribute("inert", "");

    // scrolling the hero CTA away brings it out
    await heroCta.first().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 1400);
    await expect(stickyRoot).not.toHaveAttribute("inert", "");

    // the CTAs further down no longer send it away
    await page.getByTestId("seo-landing-inline-cta").scrollIntoViewIfNeeded();
    await expect(stickyRoot).not.toHaveAttribute("inert", "");

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(stickyRoot).not.toHaveAttribute("inert", "");

    // back at the top it parks again
    await page.mouse.wheel(0, -20_000);
    await expect(stickyRoot).toHaveAttribute("inert", "");
  });

  test("should 404 for unknown SEO slug", async ({ page }) => {
    const response = await page.goto("/not-a-real-seo-landing-slug-xyz");

    expect(response?.status()).toBe(404);
  });
});

/**
 * The hero shows a demo clip where one is defined and the still image otherwise, so the
 * two shapes are asserted by separate tests rather than a branch inside one -- a
 * conditional `expect` passes just as happily when neither arm runs.
 */
const IMAGE_HERO_CASES = SEO_LANDING_CASES.filter((landingCase) => {
  return !landingCase.heroVideo;
});

const VIDEO_HERO_CASES = SEO_LANDING_CASES.filter((landingCase) => {
  return Boolean(landingCase.heroVideo);
});

test.describe("SEO landing hero art", () => {
  for (const { path, h1, heroImageSrc } of IMAGE_HERO_CASES) {
    test(`shows the hero image on ${path}`, async ({ page }) => {
      await page.goto(path);

      const img = page.getByRole("img", { name: h1 });

      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute("src", heroImageSrc);
    });
  }

  for (const { path, heroVideo } of VIDEO_HERO_CASES) {
    test(`shows the hero video on ${path}`, async ({ page }) => {
      await page.goto(path);

      const video = page.getByTestId("seo-landing-hero-video");

      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute("src", heroVideo?.embedUrl ?? "");
      await expect(video).toHaveAttribute("title", heroVideo?.title ?? "");

      // the clip is only visible to search engines through its VideoObject, so the
      // fields Google requires for it have to reach the page
      const jsonLd = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();

      expect(jsonLd).toContain(heroVideo?.uploadDate);
      expect(jsonLd).toContain(heroVideo?.thumbnailUrl);
      expect(jsonLd).toContain("VideoObject");
    });
  }
});
