/* eslint-disable playwright/no-conditional-expect */
/* eslint-disable playwright/no-conditional-in-test */
import { GITHUB_URL, TWITTER_URL, VIDEO_DEMO_FALLBACK_IMG } from "@/config";
import { expect, test } from "@playwright/test";

test.describe("About page", () => {
  test("should display about page content in English", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/en/about");

    // Verify the page is loaded
    await expect(page).toHaveURL("/en/about");

    await expect(page).toHaveTitle(
      "About EasyInvoicePDF — Free Invoice Generator",
    );

    const header = page.getByRole("banner");

    /* CHECK HEADER ELEMENTS */

    if (isMobile) {
      // Mobile: burger button visible, nav links and language switcher hidden in header
      await expect(
        header.getByRole("button", { name: "Open menu" }),
      ).toBeVisible();

      await expect(
        header.getByRole("button", { name: "Switch language" }),
      ).toBeHidden();

      await expect(
        header.getByRole("link", { name: "Features", exact: true }),
      ).toBeHidden();
    } else {
      // Desktop: nav links and language switcher visible inline, burger button hidden
      await expect(
        header.getByRole("button", { name: "Switch language" }),
      ).toBeVisible();

      const featuresLink = header.getByRole("link", {
        name: "Features",
        exact: true,
      });

      await expect(featuresLink).toBeVisible();
      await expect(featuresLink).toHaveAttribute("href", "/en/about#features");

      const faqLink = header.getByRole("link", { name: "FAQ", exact: true });

      await expect(faqLink).toBeVisible();
      await expect(faqLink).toHaveAttribute("href", "/en/about#faq");

      const changelogLink = header.getByRole("link", {
        name: "Changelog",
        exact: true,
      });

      await expect(changelogLink).toBeVisible();
      await expect(changelogLink).toHaveAttribute("href", "/changelog");

      const githubLink = header.getByRole("link", {
        name: "View on GitHub",
        exact: true,
      });

      await expect(githubLink).toBeVisible();
      await expect(githubLink).toHaveAttribute("href", GITHUB_URL);

      // hidden on desktop
      await expect(
        header.getByRole("button", { name: "Open menu" }),
      ).toBeHidden();
    }

    // check app link button in header
    await expect(
      header.getByRole("link", { name: "EasyInvoicePDF" }),
    ).toBeVisible();

    const goToAppButton = header.getByRole("link", {
      name: "Open app",
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
    await expect(video).toHaveAttribute("preload", "none");

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

    const founderLink = footerLinks.getByRole("link", {
      name: "Founder",
      exact: true,
    });

    await expect(founderLink).toBeVisible();
    await expect(founderLink).toHaveAttribute("href", "/founder");
    await expect(founderLink).not.toHaveAttribute("target", "_blank");

    const termsOfServiceLink = footerLinks.getByRole("link", {
      name: "Terms of Service",
      exact: true,
    });

    await expect(termsOfServiceLink).toBeVisible();
    await expect(termsOfServiceLink).toHaveAttribute("href", "/tos");
    await expect(termsOfServiceLink).not.toHaveAttribute("target", "_blank");

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
    await expect(
      header.getByRole("link", { name: "EasyInvoicePDF" }),
    ).toBeVisible();

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

    const termsOfServiceLinkFr = footerLinks.getByRole("link", {
      name: "Conditions d'utilisation",
      exact: true,
    });

    await expect(termsOfServiceLinkFr).toBeVisible();
    await expect(termsOfServiceLinkFr).toHaveAttribute("href", "/tos");
    await expect(termsOfServiceLinkFr).not.toHaveAttribute("target", "_blank");
  });

  test("should display about page content in German", async ({ page }) => {
    await page.goto("/de/about");

    // Verify the page is loaded with German locale
    await expect(page).toHaveURL("/de/about");

    const header = page.getByRole("banner");
    // Check header elements in German
    await expect(
      header.getByRole("link", { name: "EasyInvoicePDF" }),
    ).toBeVisible();

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

    const termsOfServiceLinkDe = footerLinks.getByRole("link", {
      name: "Nutzungsbedingungen",
      exact: true,
    });

    await expect(termsOfServiceLinkDe).toBeVisible();
    await expect(termsOfServiceLinkDe).toHaveAttribute("href", "/tos");
    await expect(termsOfServiceLinkDe).not.toHaveAttribute("target", "_blank");
  });

  test("should handle language switching", async ({ page, isMobile }) => {
    // Start with English
    await page.goto("/en/about");
    await expect(page).toHaveURL("/en/about");

    // On mobile, open the mobile menu first
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();

    // Then switch to French
    await page
      .getByRole("button", { name: "Switch language", exact: true })
      .click();
    await page.getByText("Français").click();

    await expect(page).toHaveURL("/fr/about");

    const header = page.getByRole("banner");

    await expect(
      header.getByRole("link", {
        name: "Ouvrir",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("should navigate to app when clicking Go to App button", async ({
    page,
  }) => {
    await page.goto("/en/about");
    await expect(page).toHaveURL("/en/about");

    // Click the Go to App button in header
    const header = page.getByRole("banner");

    const headerGoToAppButton = header.getByRole("link", {
      name: "Open app",
      exact: true,
    });

    await headerGoToAppButton.click();
    await expect(page).toHaveURL("/?template=default");
  });

  // we don't show nav links and language switcher in header on mobile
  // we test mobile menu separately
  test("should show desktop nav links in header (ON MOBILE TEST WILL BE SKIPPED)", async ({
    page,
    isMobile,
  }) => {
    // skip test on mobile
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(isMobile, "Desktop nav only exists on desktop viewport");

    await page.goto("/en/about");

    const header = page.getByRole("banner");

    await expect(
      header.getByRole("link", { name: "Features", exact: true }),
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "FAQ", exact: true }),
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "Changelog", exact: true }),
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "Terms of Service", exact: true }),
    ).toBeVisible();

    await expect(
      header.getByRole("link", { name: "View on GitHub", exact: true }),
    ).toBeVisible();

    // we don't show founder link in header
    await expect(
      header.getByRole("link", { name: "Founder", exact: true }),
    ).toBeHidden();

    await expect(
      header.getByRole("button", { name: "Switch language" }),
    ).toBeVisible();

    // hidden on desktop
    await expect(
      header.getByRole("button", { name: "Open menu" }),
    ).toBeHidden();
  });

  // we don't show nav links and language switcher in header on mobile
  // we test desktop nav links separately
  test("should show mobile menu with nav links and language switcher (ON DESKTOP TEST WILL BE SKIPPED)", async ({
    page,
    isMobile,
  }) => {
    // skip test on desktop
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!isMobile, "Mobile menu only exists on mobile viewport");

    await page.goto("/en/about");

    const header = page.getByRole("banner");
    const burgerButton = header.getByRole("button", { name: "Open menu" });

    // Burger button visible on MOBILE, nav links and language switcher not visible in header
    await expect(burgerButton).toBeVisible();

    await expect(
      header.getByRole("link", { name: "Features", exact: true }),
    ).toBeHidden();

    await expect(
      header.getByRole("button", { name: "Switch language" }),
    ).toBeHidden();

    // Open the mobile menu
    await burgerButton.click();

    const sheet = page.getByRole("dialog", { name: "Mobile Menu" });

    const featuresLink = sheet.getByRole("link", {
      name: "Features",
      exact: true,
    });
    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute("href", "/en/about#features");

    const faqLink = sheet.getByRole("link", { name: "FAQ", exact: true });
    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveAttribute("href", "/en/about#faq");

    const changelogLink = sheet.getByRole("link", {
      name: "Changelog",
      exact: true,
    });
    await expect(changelogLink).toBeVisible();
    await expect(changelogLink).toHaveAttribute("href", "/changelog");

    const termsLinkMobile = sheet.getByRole("link", {
      name: "Terms of Service",
      exact: true,
    });
    await expect(termsLinkMobile).toBeVisible();
    await expect(termsLinkMobile).toHaveAttribute("href", "/tos");

    const githubLink = sheet.getByRole("link", {
      name: "Star on GitHub",
      exact: true,
    });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("href", GITHUB_URL);

    // we don't show founder link in mobile menu
    const founderLinkMobile = sheet.getByRole("link", {
      name: "Founder",
      exact: true,
    });
    await expect(founderLinkMobile).toBeHidden();

    await expect(
      sheet.getByRole("button", { name: "Switch language" }),
    ).toBeVisible();

    // Close the menu and verify burger button is accessible again
    await page.getByRole("button", { name: "Close menu" }).click();
    await expect(burgerButton).toBeVisible();

    // Verify mobile menu is closed
    await expect(
      page.getByRole("dialog", { name: "Mobile Menu" }),
    ).toBeHidden();

    // Verify burger button is visible again
    await expect(
      header.getByRole("button", { name: "Open menu" }),
    ).toBeVisible();
  });
});
