import { expect, test } from "@playwright/test";

test.describe("Terms of Service page", () => {
  test("should display terms of service content", async ({ page }) => {
    await page.goto("/tos");

    await expect(page).toHaveURL("/tos");

    await expect(page).toHaveTitle(
      "Terms of Service | EasyInvoicePDF - Free & Open-Source Invoice Generator",
    );

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
  });
});
