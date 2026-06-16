import {
  DISCORD_COMMUNITY_URL,
  REDDIT_COMMUNITY_URL,
  VIDEO_DEMO_YOUTUBE_URL,
  YOUTUBE_VIDEO_HOW_TO_ADD_SELLER,
} from "@/config";
import { expect, test } from "@playwright/test";

test.describe("How it works page", () => {
  test("should display page content and video tutorials", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page).toHaveURL("/how-it-works");

    const header = page.locator("header");
    await expect(header).toBeVisible();

    const goToAppButton = header.getByRole("link", {
      name: "Open app",
      exact: true,
    });

    await expect(goToAppButton).toBeVisible();
    await expect(goToAppButton).toHaveAttribute("href", "/?template=default");

    await expect(page.getByTestId("how-it-works-page-title")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "How EasyInvoicePDF Works",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(
        "Learn how to create and customize professional PDF invoices.",
      ),
    ).toBeVisible();

    const embed = page.getByTestId("how-it-works-video");
    await expect(embed).toBeVisible();
    await expect(embed).toHaveAttribute("src", VIDEO_DEMO_YOUTUBE_URL);
    await expect(embed).toHaveAttribute("title", "EasyInvoicePDF Demo Video");

    await page.getByTestId("how-it-works-tab-add-seller").click();
    await expect(embed).toHaveAttribute("src", YOUTUBE_VIDEO_HOW_TO_ADD_SELLER);
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "How to add a seller",
      }),
    ).toBeVisible();

    const discordLink = page.getByTestId("how-it-works-discord");
    const redditLink = page.getByTestId("how-it-works-reddit");
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute("href", DISCORD_COMMUNITY_URL);
    await expect(redditLink).toBeVisible();
    await expect(redditLink).toHaveAttribute("href", REDDIT_COMMUNITY_URL);

    await expect(page.getByTestId("how-it-works-tutorial-index")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "All tutorials" }),
    ).toBeVisible();

    const cta = page.getByTestId("how-it-works-cta");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const howItWorksFooterLink = footer.getByRole("link", {
      name: "How it works",
      exact: true,
    });
    await expect(howItWorksFooterLink).toBeVisible();
    await expect(howItWorksFooterLink).toHaveAttribute("href", "/how-it-works");
  });

  test("should support video deep link via query param", async ({ page }) => {
    await page.goto("/how-it-works?video=add-buyer");

    await expect(page).toHaveURL("/how-it-works?video=add-buyer");

    const embed = page.getByTestId("how-it-works-video");
    await expect(embed).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/XxAY0YGgXIk",
    );
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "How to add a buyer",
      }),
    ).toBeVisible();
  });
});
