import { test, expect } from "@playwright/test";

test.describe("Not Found page", () => {
  test("should display not found page in English (default locale) in root layout", async ({
    page,
  }) => {
    await page.goto("/non-existent-page");

    // Verify error message is displayed
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This page could not be found." })
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", { name: "Return to homepage" });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/en/app");
  });

  test("should display not found page in Spanish under [locale] root layout", async ({
    page,
  }) => {
    await page.goto("/es/non-existent-page");

    // Verify error message is displayed
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No se pudo encontrar esta página." })
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", {
      name: "Volver a la página principal",
    });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/es/app");
  });

  test("should display not found page in French under [locale]/about layout", async ({
    page,
  }) => {
    await page.goto("/fr/about/non-existent-page");

    // Verify error message is displayed in French
    await expect(page.getByText("404")).toBeVisible();
    const returnHomeLink = page.getByRole("link", {
      name: "Retour à l'accueil",
    });
    await expect(returnHomeLink).toBeVisible();
    await returnHomeLink.click();

    await expect(page).toHaveURL("/fr/app");
  });

  test("should display not found page in German under [locale]/app root layout", async ({
    page,
  }) => {
    await page.goto("/de/app/non-existent-page");

    // Verify error message is displayed in German
    await expect(page.getByText("404")).toBeVisible();
    const returnHomeLink = page.getByRole("link", {
      name: "Zur Startseite zurückkehren",
    });
    await expect(returnHomeLink).toBeVisible();
    await returnHomeLink.click();

    await expect(page).toHaveURL("/de/app");
  });

  test("should display not found page in Portuguese under [locale]/app layout", async ({
    page,
  }) => {
    await page.goto("pt/app/non-existent-page");

    // Verify error message is displayed
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Esta página não pôde ser encontrada.",
      })
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", {
      name: "Voltar à página inicial",
    });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/pt/app");
  });

  test("should display not found page in Polish under root layout with multiple levels", async ({
    page,
  }) => {
    await page.goto("pl/non-exist/404/non-exist/404");

    // Verify error message is displayed
    await expect(page.getByText("404")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Nie można znaleźć tej strony.",
      })
    ).toBeVisible();

    // Check return home link
    const homeLink = page.getByRole("link", {
      name: "Wróć do strony głównej",
    });
    await expect(homeLink).toBeVisible();
    await homeLink.click();

    await expect(page).toHaveURL("/en/app");
  });
});
