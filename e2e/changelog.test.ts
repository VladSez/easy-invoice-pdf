import { test, expect } from "@playwright/test";

test.describe("Changelog page", () => {
  test("should display changelog page content", async ({ page }) => {
    await page.goto("/changelog");

    // Verify the page is loaded
    await expect(page).toHaveURL("/changelog");

    // Check main heading
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Changelog",
        exact: true,
      }),
    ).toBeVisible();

    // Check subtitle
    await expect(
      page.getByText(
        "All the latest updates, improvements, and fixes to EasyInvoicePDF",
      ),
    ).toBeVisible();

    // Check that changelog entries are present
    const entryCards = page.locator('[data-testid="changelog-entry-card"]');

    // At least one entry should be visible
    await expect(entryCards.first()).toBeVisible();
  });

  test("should navigate to individual changelog entry", async ({ page }) => {
    await page.goto("/changelog");

    // Find and click on the first changelog entry title link
    // Find first changelog entry link and get its href
    const firstEntryLink = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 2 }) })
      .first();

    await firstEntryLink.waitFor({ state: "visible" });
    const href = await firstEntryLink.getAttribute("href");
    await firstEntryLink.click();

    // Verify we navigated to the individual entry page
    await expect(page).toHaveURL(href!);

    // Check that we're on an individual entry page by looking for "Back to All Posts" link
    await expect(
      page.getByRole("link", { name: "Back to All Posts" }),
    ).toBeVisible();
  });

  test("should display individual changelog entry content", async ({
    page,
  }) => {
    // Navigate to changelog and then to first entry
    await page.goto("/changelog");

    // Find and click on the first changelog entry title link
    // Find first changelog entry link and get its href
    const firstEntryLink = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 2 }) })
      .first();

    await firstEntryLink.waitFor({ state: "visible" });
    const href = await firstEntryLink.getAttribute("href");
    await firstEntryLink.click();

    // Verify we navigated to the individual entry page
    await expect(page).toHaveURL(href!);

    // Check "Back to All Posts" navigation link
    const backLink = page.getByRole("link", { name: "Back to All Posts" });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/changelog");

    // Check that the entry has a title (h1)
    const entryTitle = page.locator("h1").first();
    await expect(entryTitle).toBeVisible();

    // Check author information
    await expect(page.getByTestId("author-info-text")).toHaveText(
      "Vlad SazonauFounder,  EasyInvoicePDF",
    );
    await expect(page.getByTestId("author-info-img")).toBeVisible();

    // Check social sharing buttons are present
    const twitterShareLink = page.locator(
      'a[href*="twitter.com/intent/tweet"]',
    );
    await expect(twitterShareLink).toBeVisible();

    const linkedinShareLink = page.locator(
      'a[href*="linkedin.com/shareArticle"]',
    );
    await expect(linkedinShareLink).toBeVisible();

    // Check "Go to App" CTA button
    const goToAppButtonContainer = page.getByTestId(
      "go-to-app-button-container",
    );

    const goToAppButton = goToAppButtonContainer.getByRole("link");
    await expect(goToAppButton).toBeVisible();
    await expect(goToAppButton).toHaveText("Go to App");
  });

  test("should navigate back to changelog from individual entry", async ({
    page,
  }) => {
    // Navigate to an individual entry
    await page.goto("/changelog");
    const firstEntryLink = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 2 }) })
      .first();

    const link = await firstEntryLink.getAttribute("href");
    await firstEntryLink.waitFor({ state: "visible" });
    await firstEntryLink.click();

    // Wait for navigation to individual entry
    // Wait for URL pattern: /changelog/[any-slug] where [any-slug] is any characters except forward slash
    await page.waitForURL(link!);

    // Click "Back to All Posts" link
    await page.getByRole("link", { name: "Back to All Posts" }).click();

    // Verify we're back on the main changelog page
    await expect(page).toHaveURL("/changelog");
    await expect(
      page.getByRole("heading", { level: 1, name: "Changelog" }),
    ).toBeVisible();
  });

  test("should handle direct navigation to changelog entry", async ({
    page,
  }) => {
    // Try to navigate directly to a changelog entry
    // First get the slug from the main page
    await page.goto("/changelog");
    const firstEntryLink = page.locator('a[href^="/changelog/"]').first();
    const href = await firstEntryLink.getAttribute("href");

    // Navigate directly to the entry
    await page.goto(href!);

    // Verify the page loads correctly
    await expect(
      page.getByRole("link", { name: "Back to All Posts" }),
    ).toBeVisible();

    // Verify we can still navigate back
    await page.getByRole("link", { name: "Back to All Posts" }).click();
    await expect(page).toHaveURL("/changelog");
  });
});
