import {
  GITHUB_URL,
  TWITTER_URL,
  VIDEO_DEMO_FALLBACK_IMG,
  VIDEO_DEMO_URL,
} from "@/config";
import { expect, test } from "@playwright/test";

test.describe("About page", () => {
  test("should display about page content in English", async ({ page }) => {
    await page.goto("/en/about");

    // Verify the page is loaded
    await expect(page).toHaveURL("/en/about");

    await expect(page).toHaveTitle(
      "About EasyInvoicePDF — Free Invoice Generator",
    );

    const header = page.getByRole("banner");

    /* CHECK HEADER ELEMENTS */

    // Check language switcher button in header
    const languageSwitcher = header.getByRole("button", {
      name: "Switch language",
    });
    await expect(languageSwitcher).toBeVisible();

    // check app link button in header
    await expect(header.getByText("EasyInvoicePDF")).toBeVisible();
    const goToAppButton = header.getByRole("link", {
      name: "Go to app",
      exact: true,
    });
    await expect(goToAppButton).toBeVisible();
    await expect(goToAppButton).toHaveAttribute("href", "/?template=default");

    // Check Hero section
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Create professional invoices in seconds",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF is a free, open-source invoice generator with real-time preview. Create, customize, and download professional invoices. No sign-up required.",
      ),
    ).toBeVisible();

    const video = heroSection.getByTestId("hero-about-page-video");

    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("poster", VIDEO_DEMO_FALLBACK_IMG);
    await expect(video).toHaveAttribute("muted");
    await expect(video).toHaveAttribute("loop");
    await expect(video).toHaveAttribute("playsinline");
    await expect(video).toHaveAttribute("preload", "auto");
    await expect(video).toHaveAttribute("autoplay");

    const videoSource = video.locator("source");
    await expect(videoSource).toHaveAttribute(
      "src",
      `${VIDEO_DEMO_URL}#t=0.001`,
    );
    await expect(videoSource).toHaveAttribute("type", "video/mp4");

    // Check Features section
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(
      featuresSection.getByTestId("features-coming-soon"),
    ).toHaveText("E-invoicing and API support - coming soon");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Everything you need for professional invoicing",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      featuresSection.getByText(
        "Create professional invoices in minutes with a simple, powerful tool.",
      ),
    ).toBeVisible();

    // check FAQ section
    const faqSection = page.locator("#faq");
    await expect(faqSection).toBeVisible();

    await expect(
      faqSection.getByRole("heading", {
        level: 2,
        name: "Frequently Asked Questions",
        exact: true,
      }),
    ).toBeVisible();

    await expect(faqSection.getByText("What is EasyInvoicePDF?")).toBeVisible();
    await expect(faqSection.getByText("Is it really free?")).toBeVisible();

    // Check footer
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    // check footer social logos first
    const footerSocialLinks = footer.getByTestId("footer-logos-social-links");

    const githubSocialLink = footerSocialLinks.getByRole("link", {
      name: "GitHub",
      exact: true,
    });

    await expect(githubSocialLink).toBeVisible();
    await expect(githubSocialLink).toHaveAttribute("href", GITHUB_URL);
    await expect(githubSocialLink).toHaveAttribute("target", "_blank");

    const twitterSocialLink = footerSocialLinks.getByRole("link", {
      name: "Twitter",
      exact: true,
    });

    await expect(twitterSocialLink).toBeVisible();
    await expect(twitterSocialLink).toHaveAttribute("href", TWITTER_URL);
    await expect(twitterSocialLink).toHaveAttribute("target", "_blank");

    // now check all the rest of the footer links
    const footerLinks = footer.getByTestId("footer-social-links");

    const appLink = footerLinks.getByRole("link", { name: "App" });

    await expect(appLink).toBeVisible();
    await expect(appLink).toHaveAttribute("href", "/?template=default");
    await expect(appLink).not.toHaveAttribute("target", "_blank");

    const featuresLink = footerLinks.getByRole("link", {
      name: "Features",
      exact: true,
    });

    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute("href", "#features");
    await expect(featuresLink).not.toHaveAttribute("target", "_blank");

    const faqLink = footerLinks.getByRole("link", {
      name: "FAQ",
      exact: true,
    });

    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveAttribute("href", "#faq");
    await expect(faqLink).not.toHaveAttribute("target", "_blank");

    const changelogLink = footerLinks.getByRole("link", {
      name: "Changelog",
      exact: true,
    });

    await expect(changelogLink).toBeVisible();
    await expect(changelogLink).toHaveAttribute("href", "/changelog");
    await expect(changelogLink).not.toHaveAttribute("target", "_blank");

    const shareFeedbackLink = footerLinks.getByRole("link", {
      name: "Share feedback",
      exact: true,
    });

    await expect(shareFeedbackLink).toBeVisible();
    await expect(shareFeedbackLink).toHaveAttribute(
      "href",
      "https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10",
    );
    await expect(shareFeedbackLink).toHaveAttribute("target", "_blank");

    const githubLink = footerLinks.getByRole("link", {
      name: "GitHub",
      exact: true,
    });

    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("href", GITHUB_URL);
    await expect(githubLink).toHaveAttribute("target", "_blank");

    await expect(footer.getByText("Made by Vlad Sazonau")).toBeVisible();
  });

  test("should display about page content in French", async ({ page }) => {
    await page.goto("/fr/about");

    // Verify the page is loaded with French locale
    await expect(page).toHaveURL("/fr/about");

    const header = page.getByRole("banner");
    // Check header elements in French
    await expect(header.getByText("EasyInvoicePDF")).toBeVisible();

    const goToAppButton = header.getByRole("link", {
      name: "Ouvrir",
      exact: true,
    });
    await expect(goToAppButton).toBeVisible();

    // Check Hero section in French
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Créez des factures professionnelles en quelques secondes",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF est un outil gratuit et open-source qui vous permet de créer, personnaliser et télécharger des factures professionnelles avec aperçu en temps réel. Fonctionne entièrement dans votre navigateur.",
      ),
    ).toBeVisible();

    // Check Features section in French
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(
      featuresSection.getByTestId("features-coming-soon"),
    ).toHaveText("Version Pro et API bientôt disponibles");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Tout ce dont vous avez besoin pour une facturation professionnelle",
        exact: true,
      }),
    ).toBeVisible();

    // Check footer in French
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const footerLinks = footer.getByTestId("footer-social-links");

    const appLink = footerLinks.getByRole("link", {
      name: "Application",
      exact: true,
    });

    await expect(appLink).toBeVisible();
    await expect(appLink).toHaveAttribute("href", "/?template=default");
    await expect(appLink).not.toHaveAttribute("target", "_blank");

    const featuresLink = footerLinks.getByRole("link", {
      name: "Fonctionnalités",
      exact: true,
    });

    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute("href", "#features");
    await expect(featuresLink).not.toHaveAttribute("target", "_blank");
  });

  test("should display about page content in German", async ({ page }) => {
    await page.goto("/de/about");

    // Verify the page is loaded with German locale
    await expect(page).toHaveURL("/de/about");

    const header = page.getByRole("banner");
    // Check header elements in German
    await expect(header.getByText("EasyInvoicePDF")).toBeVisible();
    const goToAppButton = header.getByRole("link", {
      name: "Öffnen",
      exact: true,
    });
    await expect(goToAppButton).toBeVisible();

    // Check Hero section in German
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Erstellen Sie professionelle Rechnungen in Sekunden",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF ist ein kostenloses Open-Source-Tool, mit dem Sie professionelle Rechnungen mit Echtzeit-Vorschau erstellen, anpassen und herunterladen können.",
      ),
    ).toBeVisible();

    // Check Features section in German
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(
      featuresSection.getByTestId("features-coming-soon"),
    ).toHaveText("Pro-Version und API in Kürze verfügbar");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Alles, was Sie für professionelle Rechnungsstellung brauchen",
        exact: true,
      }),
    ).toBeVisible();

    // Check footer in German
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const footerLinks = footer.getByTestId("footer-social-links");
    await expect(
      footerLinks.getByRole("link", { name: "Funktionen", exact: true }),
    ).toBeVisible();
  });

  test("should handle language switching", async ({ page }) => {
    // Start with English
    await page.goto("/en/about");
    await expect(page).toHaveURL("/en/about");

    // Switch to French
    await page
      .getByRole("button", { name: "Switch language", exact: true })
      .click();
    await page.getByText("Français").click();

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link", {
        name: "Ouvrir",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page).toHaveURL("/fr/about");
  });

  test("should navigate to app when clicking Go to App button", async ({
    page,
  }) => {
    await page.goto("/en/about");

    // Click the Go to App button in header
    const header = page.getByRole("banner");

    const headerGoToAppButton = header.getByRole("link", {
      name: "Go to app",
      exact: true,
    });

    await headerGoToAppButton.click();
    await expect(page).toHaveURL("/?template=default");
  });
});
