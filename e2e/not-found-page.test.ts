import { test, expect } from "@playwright/test";

test.describe("Not Found page", () => {
  test("should display not found page in English (default locale) in root layout", async ({
    page,
  }) => {
    await page.goto("/non-existent-page");

    // Verify URL is correct
    await expect(page).toHaveURL("/non-existent-page");

    // Verify error message is displayed
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", { name: "Return to homepage" });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/?template=default");
  });

  test("should display not found page in Spanish under [locale] root layout", async ({
    page,
  }) => {
    await page.goto("/es/non-existent-page");

    // Verify URL is correct
    await expect(page).toHaveURL("/es/non-existent-page");

    // Verify error message is displayed in English (default locale)
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This page could not be found." }),
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", { name: "Return to homepage" });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/?template=default");
  });
});
