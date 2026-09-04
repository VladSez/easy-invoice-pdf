import { expect, test } from "@playwright/test";

import { LINKEDIN_URL, TWITTER_URL } from "@/config";

test.describe("Founder page", () => {
  test("renders the founder page and its links", async ({ page }) => {
    const response = await page.goto("/founder");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL("/founder");

    // Heading and tagline
    await expect(
      page.getByRole("heading", { name: "Vlad Sazonau", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Software Engineer & Design Enthusiast"),
    ).toBeVisible();

    // Avatar (the page one, the footer has a smaller avatar with the same alt text)
    await expect(page.getByAltText("Vlad Sazonau").first()).toBeVisible();

    // Social links (the links are labelled with aria-label)
    const socialLinks = [
      { name: "Visit website", href: "https://vladsazon.com" },
      { name: "Visit Twitter", href: TWITTER_URL },
      { name: "Visit LinkedIn", href: LINKEDIN_URL },
      // the personal GitHub profile, not the repository
      { name: "Visit GitHub", href: "https://github.com/VladSez" },
    ] as const;

    for (const { name, href } of socialLinks) {
      const link = page.getByRole("link", { name, exact: true });

      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });

  test("is reachable from the footer link", async ({ page }) => {
    await page.goto("/en/about");

    const footerFounderLink = page
      .getByRole("contentinfo")
      .getByTestId("footer-social-links")
      .getByRole("link", { name: "Founder", exact: true });

    await expect(footerFounderLink).toBeVisible();

    await footerFounderLink.click();

    await expect(page).toHaveURL("/founder");
    await expect(
      page.getByRole("heading", { name: "Vlad Sazonau", level: 1 }),
    ).toBeVisible();
  });
});
