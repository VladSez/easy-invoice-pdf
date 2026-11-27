import { expect, test } from "@playwright/test";

import { INITIAL_INVOICE_DATA } from "@/app/constants";
import { PDF_DATA_LOCAL_STORAGE_KEY } from "@/app/schema";
import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

/**
 * Each invoice app route has its own crawlable copy below the editor: `HomeSeoContent` on
 * `/` and `StripeTemplateSeoContent` on `/stripe-template`. The two are written for
 * different queries, so each route must carry its own block and never the other's.
 */

const ROUTES = [
  {
    pathname: "/",
    testId: "home-seo-content",
    otherTestId: "stripe-template-seo-content",
    heading: "A free invoice generator that runs in your browser",
  },
  {
    pathname: STRIPE_TEMPLATE_PATHNAME,
    testId: "stripe-template-seo-content",
    otherTestId: "home-seo-content",
    heading: "A free Stripe-style invoice template",
  },
] as const;

test.describe("Invoice app SEO content @desktop-only", () => {
  for (const { pathname, testId, otherTestId, heading } of ROUTES) {
    test(`${pathname} serves its own SEO block in the prerendered HTML`, async ({
      request,
    }, testInfo) => {
      // eslint-disable-next-line playwright/no-skipped-test -- HTTP only test, Desktop Chrome only
      test.skip(
        testInfo.project.name !== "Desktop Chrome",
        "the served HTML does not depend on the browser",
      );

      const response = await request.get(pathname);
      expect(response.status()).toBe(200);

      // what a crawler gets before any JavaScript runs: the editor is client-only, this is not
      const html = await response.text();
      expect(html).toContain(`data-testid="${testId}"`);
      expect(html).toContain(heading);
      expect(html).not.toContain(`data-testid="${otherTestId}"`);
    });

    test(`${pathname} shows its own SEO block below the editor`, async ({
      page,
    }) => {
      await page.goto(pathname);

      const section = page.getByTestId(testId);
      await expect(section).toBeVisible();
      await expect(
        section.getByRole("heading", { level: 2, name: heading }),
      ).toBeVisible();
      await expect(section.getByRole("heading", { name: "FAQ" })).toBeVisible();

      await expect(page.getByTestId(otherTestId)).toHaveCount(0);
    });
  }

  test("/ links to the Stripe template and the landing pages", async ({
    page,
  }) => {
    await page.goto("/");

    const section = page.getByTestId("home-seo-content");

    await expect(
      section.getByRole("link", { name: "Stripe-style invoice template" }),
    ).toHaveAttribute("href", STRIPE_TEMPLATE_PATHNAME);
    await expect(
      section.getByRole("link", { name: "no login and no signup" }),
    ).toHaveAttribute("href", "/invoice-generator-no-login");

    // the template chooser marks the classic template as the one in use here
    await expect(
      section.getByRole("article", { name: "Classic" }),
    ).toHaveAttribute("aria-current", "true");
    await expect(
      section.getByRole("article", { name: "Stripe" }),
    ).not.toHaveAttribute("aria-current");
  });

  test("/stripe-template links to the Stripe invoice generator landing, not to itself", async ({
    page,
  }) => {
    await page.goto(STRIPE_TEMPLATE_PATHNAME);

    const section = page.getByTestId("stripe-template-seo-content");

    await expect(
      section.getByRole("link", { name: "Stripe invoice generator" }),
    ).toHaveAttribute("href", "/stripe-invoice-alternative");
    await expect(
      section.getByRole("link", { name: "there is no signup" }),
    ).toHaveAttribute("href", "/invoice-generator-no-login");
    await expect(
      section.locator(`a[href="${STRIPE_TEMPLATE_PATHNAME}"]`),
    ).toHaveCount(0);
  });

  test("/stripe-template 'Switch to classic' opens the default template for a visitor whose invoice uses Stripe", async ({
    page,
  }) => {
    await page.goto(STRIPE_TEMPLATE_PATHNAME);

    // a bare `/` would send this visitor straight back to `/stripe-template`
    await page.evaluate(
      ({ invoiceData, storageKey }) => {
        localStorage.setItem(storageKey, JSON.stringify(invoiceData));
      },
      {
        storageKey: PDF_DATA_LOCAL_STORAGE_KEY,
        invoiceData: { ...INITIAL_INVOICE_DATA, template: "stripe" },
      },
    );

    // `dispatchEvent`, not a real click: Chrome's PDF viewer takes focus when it loads and
    // scrolls the preview back into view, so a real click can land on the preview
    await page
      .getByTestId("stripe-template-seo-content")
      .getByRole("link", { name: "Switch to classic" })
      .dispatchEvent("click");

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("combobox", { name: "Template" })).toHaveValue(
      "default",
    );
    await expect(page.getByTestId("home-seo-content")).toBeVisible();
  });

  // A template switch rewrites the address bar in place and keeps the server-rendered
  // block, so the template chooser in it follows the switch.
  test("/stripe-template's template chooser follows a switch to the default template", async ({
    page,
  }) => {
    await page.goto(STRIPE_TEMPLATE_PATHNAME);

    const section = page.getByTestId("stripe-template-seo-content");
    const stripeCard = section.getByRole("article", { name: "Stripe" });
    const classicCard = section.getByRole("article", { name: "Classic" });

    await expect(stripeCard).toHaveAttribute("aria-current", "true");
    await expect(
      classicCard.getByRole("link", { name: "Switch to classic" }),
    ).toBeVisible();

    await page
      .getByRole("combobox", { name: "Template" })
      .selectOption("default");
    await expect(page).toHaveURL("/");

    // the block itself stays, only the chooser's current template changes
    await expect(section).toBeVisible();
    await expect(classicCard).toHaveAttribute("aria-current", "true");
    await expect(stripeCard).not.toHaveAttribute("aria-current");
    await expect(
      section.getByRole("link", { name: "Switch to classic" }),
    ).toHaveCount(0);

    const stripeTemplateLink = stripeCard.getByRole("link", {
      name: "Switch to Stripe",
    });
    await expect(stripeTemplateLink).toHaveAttribute(
      "href",
      STRIPE_TEMPLATE_PATHNAME,
    );

    // `dispatchEvent` for the same PDF viewer focus reason as above
    await stripeTemplateLink.dispatchEvent("click");

    await expect(page).toHaveURL(STRIPE_TEMPLATE_PATHNAME);
    await expect(page.getByRole("combobox", { name: "Template" })).toHaveValue(
      "stripe",
    );
  });
});
