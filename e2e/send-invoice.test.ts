import { expect, test } from "@playwright/test";

const configured =
  process.env.NEXT_PUBLIC_SEND_INVOICE_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

test.describe("Send invoice", () => {
  if (!configured) return;

  test("asks a signed-out visitor to authenticate before composing", async ({
    page,
  }) => {
    await page.goto("/?template=default");
    await page.getByRole("button", { name: "Send invoice" }).first().click();

    // Authentication comes first, and it never asks for mailbox permissions.
    await expect(page.locator(".cl-signIn-root")).toBeVisible();
    await expect(page.getByLabel("To")).toHaveCount(0);
    await expect(page.getByLabel("Subject")).toHaveCount(0);
  });
});
