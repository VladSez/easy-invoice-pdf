import { expect, test } from "@playwright/test";

test.describe("Terms of Service page", () => {
  test("should display terms of service content", async ({ page }) => {
    await page.goto("/tos");

    await expect(page).toHaveURL("/tos");

    // Check header visibility
    const header = page.locator("header");
    await expect(header).toBeVisible();

    const goToAppButton = header.getByRole("link", {
      name: "Open app",
      exact: true,
    });

    await expect(goToAppButton).toBeVisible();
    await expect(goToAppButton).toHaveAttribute("href", "/?template=default");

    await expect(page).toHaveTitle("Terms of Service | EasyInvoicePDF");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Terms of Service",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "1. Overview",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        'EasyInvoicePDF ("the Service") is a browser-based tool that allows users to generate invoice PDFs. By using the Service, you agree to these Terms.',
        { exact: false },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "8. No Data Storage",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "12. Contact",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("Effective date:", { exact: false }),
    ).toBeVisible();

    const contactLink = page.getByRole("link", {
      name: "vlad@mail.easyinvoicepdf.com",
    });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute(
      "href",
      "mailto:vlad@mail.easyinvoicepdf.com",
    );

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
});
