import {
  SEO_LANDING_DEFINITIONS,
  type SeoLandingSlug,
} from "@/app/(seo-landings)/seo-landing-definitions";
import { expect, test } from "@playwright/test";

const SLUGS = Object.keys(SEO_LANDING_DEFINITIONS) as SeoLandingSlug[];

const SEO_LANDING_CASES = SLUGS.map((slug) => {
  return {
    path: `/${slug}`,
    h1: SEO_LANDING_DEFINITIONS[slug].hero.h1,
    subheading: SEO_LANDING_DEFINITIONS[slug].hero.subheading,
    ctaName: SEO_LANDING_DEFINITIONS[slug].hero.ctaLabel,
    heroImageSrc: SEO_LANDING_DEFINITIONS[slug].hero.heroImage,
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

      await expect(
        page.getByRole("heading", { level: 1, name: h1 }),
      ).toBeVisible();

      await expect(
        page.getByRole("heading", { level: 2, name: subheading }),
      ).toBeVisible();

      const img = page.getByRole("img", { name: h1 });
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute("src", heroImageSrc);

      const primaryCtas = page.getByRole("link", {
        name: ctaName,
        exact: true,
      });
      await expect(primaryCtas.first()).toBeVisible();
      await expect(primaryCtas.first()).toHaveAttribute("href", ctaHref);

      await expect(page.getByTestId("seo-sticky-cta")).toBeVisible();
      await expect(page.getByTestId("seo-sticky-cta")).toHaveAttribute(
        "href",
        ctaHref,
      );
    });
  }

  test("should 404 for unknown SEO slug", async ({ page }) => {
    const response = await page.goto("/not-a-real-seo-landing-slug-xyz");

    expect(response?.status()).toBe(404);
  });
});
