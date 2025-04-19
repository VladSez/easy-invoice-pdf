import { test, expect } from "@playwright/test";

test.describe("About page", () => {
  test("should display about page content in English", async ({ page }) => {
    await page.goto("/en/about");

    // Verify the page is loaded
    await expect(page).toHaveURL("/en/about");

    const header = page.getByRole("banner");
    // Check header elements
    await expect(header.getByText("EasyInvoicePDF.com")).toBeVisible();
    const goToAppButton = header.getByRole("link", { name: "Go to app" });
    await expect(goToAppButton).toBeVisible();

    // Check Hero section
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Create professional invoices in seconds",
      })
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF is a free, open-source tool that lets you create, customize, and download professional PDF invoices with real-time preview."
      )
    ).toBeVisible();

    await expect(
      heroSection.getByText("No sign-up required. 100% free and open-source.")
    ).toBeVisible();

    const video = heroSection.getByTestId("hero-about-page-video");

    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute("poster", "/easy-invoice-hero.webp");
    await expect(video).toHaveAttribute("muted");
    await expect(video).toHaveAttribute("loop");
    await expect(video).toHaveAttribute("playsinline");
    await expect(video).toHaveAttribute("preload", "auto");
    await expect(video).toHaveAttribute("autoplay");

    const videoSource = video.locator("source");
    await expect(videoSource).toHaveAttribute(
      "src",
      "/easy-invoice-demo.mp4#t=0.001"
    );
    await expect(videoSource).toHaveAttribute("type", "video/mp4");

    // Check Features section
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(
      featuresSection.getByTestId("features-coming-soon")
    ).toHaveText("Pro version and API coming soon");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Everything you need for professional invoicing",
      })
    ).toBeVisible();

    await expect(
      featuresSection.getByText(
        "Our simple yet powerful invoice generator includes all the features you need to create professional invoices quickly."
      )
    ).toBeVisible();

    await expect(
      featuresSection.getByText("Pro version and API coming soon")
    ).toBeVisible();

    // check FAQ section
    const faqSection = page.locator("#faq");
    await expect(faqSection).toBeVisible();

    await expect(
      faqSection.getByRole("heading", {
        level: 2,
        name: "Frequently Asked Questions",
      })
    ).toBeVisible();

    await expect(faqSection.getByText("What is EasyInvoicePDF?")).toBeVisible();
    await expect(faqSection.getByText("Is it really free?")).toBeVisible();

    // check subscribe form section
    const subscribeFormSection = page.locator("#newsletter");
    await expect(subscribeFormSection).toBeVisible();

    await expect(
      subscribeFormSection.getByRole("heading", {
        level: 2,
        name: "Subscribe to our newsletter",
      })
    ).toBeVisible();

    await expect(
      subscribeFormSection.getByText(
        "Get updates on new features and improvements from EasyInvoicePDF.com"
      )
    ).toBeVisible();

    const subscribeForm = subscribeFormSection.getByTestId("subscribe-form");
    await expect(subscribeForm).toBeVisible();

    const subscribeFormEmailInput =
      subscribeForm.getByPlaceholder("Enter your email");

    await expect(subscribeFormEmailInput).toBeVisible();
    await expect(subscribeFormEmailInput).toHaveAttribute("type", "email");
    await expect(subscribeFormEmailInput).toHaveAttribute("required");
    await expect(subscribeFormEmailInput).toHaveAttribute(
      "autocomplete",
      "email"
    );

    const subscribeFormButton = subscribeForm.getByRole("button", {
      name: "Subscribe",
    });

    await expect(subscribeFormButton).toBeVisible();
    await expect(subscribeFormButton).toHaveAttribute("type", "submit");

    // Check footer
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const footerSocialLinks = footer.getByTestId(
      "about-page-footer-social-links"
    );

    const githubSocialLink = footerSocialLinks.getByRole("link", {
      name: "GitHub",
    });

    await expect(githubSocialLink).toBeVisible();
    await expect(githubSocialLink).toHaveAttribute(
      "href",
      "https://github.com/VladSez/easy-invoice-pdf"
    );
    await expect(githubSocialLink).toHaveAttribute("target", "_blank");

    const twitterSocialLink = footerSocialLinks.getByRole("link", {
      name: "Twitter",
    });

    await expect(twitterSocialLink).toBeVisible();
    await expect(twitterSocialLink).toHaveAttribute(
      "href",
      "https://x.com/vlad_sazon"
    );
    await expect(twitterSocialLink).toHaveAttribute("target", "_blank");

    // Check newsletter subscription form
    await expect(footer.getByText("Subscribe to our newsletter")).toBeVisible();

    await expect(
      footer.getByText("All emails will be sent in English")
    ).toBeVisible();

    const newsletterForm = footer.getByTestId("subscribe-form");
    await expect(newsletterForm).toBeVisible();

    await expect(
      newsletterForm.getByPlaceholder("Enter your email")
    ).toBeVisible();

    await expect(
      newsletterForm.getByRole("button", { name: "Subscribe" })
    ).toBeVisible();

    const footerLinks = footer.getByTestId("about-page-footer-links");

    const appLink = footerLinks.getByRole("link", { name: "App" });

    await expect(appLink).toBeVisible();
    await expect(appLink).toHaveAttribute("href", "/en/app");
    await expect(appLink).not.toHaveAttribute("target", "_blank");

    const featuresLink = footerLinks.getByRole("link", {
      name: "Features",
    });

    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute("href", "#features");
    await expect(featuresLink).not.toHaveAttribute("target", "_blank");

    const faqLink = footerLinks.getByRole("link", {
      name: "FAQ",
    });

    await expect(faqLink).toBeVisible();
    await expect(faqLink).toHaveAttribute("href", "#faq");
    await expect(faqLink).not.toHaveAttribute("target", "_blank");

    const shareFeedbackLink = footerLinks.getByRole("link", {
      name: "Share feedback",
    });

    await expect(shareFeedbackLink).toBeVisible();
    await expect(shareFeedbackLink).toHaveAttribute(
      "href",
      "https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
    );
    await expect(shareFeedbackLink).toHaveAttribute("target", "_blank");

    const githubLink = footerLinks.getByRole("link", {
      name: "GitHub",
    });

    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/VladSez/easy-invoice-pdf"
    );
    await expect(githubLink).toHaveAttribute("target", "_blank");
  });

  test("should display about page content in French", async ({ page }) => {
    await page.goto("/fr/about");

    // Verify the page is loaded with French locale
    await expect(page).toHaveURL("/fr/about");

    const header = page.getByRole("banner");
    // Check header elements in French
    await expect(header.getByText("EasyInvoicePDF.com")).toBeVisible();
    const goToAppButton = header.getByRole("link", {
      name: "Aller à l'application",
    });
    await expect(goToAppButton).toBeVisible();

    // Check Hero section in French
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Créez des factures professionnelles en quelques secondes",
      })
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF est un outil gratuit et open-source qui vous permet de créer, personnaliser et télécharger des factures PDF professionnelles avec aperçu en temps réel."
      )
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "Aucune inscription requise. 100% gratuit et open-source."
      )
    ).toBeVisible();

    // Check Features section in French
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(featuresSection.getByTestId("features-badge")).toHaveText(
      "Fonctionnalités"
    );

    await expect(
      featuresSection.getByTestId("features-coming-soon")
    ).toHaveText("Version Pro et API bientôt disponibles");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Tout ce dont vous avez besoin pour une facturation professionnelle",
      })
    ).toBeVisible();

    // check subscribe form section in French
    const subscribeFormSection = page.locator("#newsletter");
    await expect(subscribeFormSection).toBeVisible();

    await expect(
      subscribeFormSection.getByRole("heading", {
        level: 2,
        name: "Abonnez-vous à notre newsletter",
      })
    ).toBeVisible();

    await expect(
      subscribeFormSection.getByText(
        "Recevez des mises à jour sur les nouvelles fonctionnalités et améliorations de EasyInvoicePDF.com"
      )
    ).toBeVisible();

    // Check footer in French
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    // Check newsletter subscription form in French
    await expect(
      footer.getByText("Abonnez-vous à notre newsletter")
    ).toBeVisible();
    await expect(
      footer.getByText("Tous les emails seront envoyés en anglais")
    ).toBeVisible();

    const newsletterForm = footer.getByTestId("subscribe-form");
    await expect(newsletterForm).toBeVisible();
    await expect(
      newsletterForm.getByPlaceholder("Entrez votre email")
    ).toBeVisible();
    await expect(
      newsletterForm.getByRole("button", { name: "S'abonner" })
    ).toBeVisible();

    const footerLinks = footer.getByTestId("about-page-footer-links");

    const appLink = footerLinks.getByRole("link", { name: "App" });

    await expect(appLink).toBeVisible();
    await expect(appLink).toHaveAttribute("href", "/fr/app");
    await expect(appLink).not.toHaveAttribute("target", "_blank");

    const featuresLink = footerLinks.getByRole("link", {
      name: "Fonctionnalités",
    });

    await expect(featuresLink).toBeVisible();
    await expect(featuresLink).toHaveAttribute("href", "#features");
  });

  test("should display about page content in German", async ({ page }) => {
    await page.goto("/de/about");

    // Verify the page is loaded with German locale
    await expect(page).toHaveURL("/de/about");

    const header = page.getByRole("banner");
    // Check header elements in German
    await expect(header.getByText("EasyInvoicePDF.com")).toBeVisible();
    const goToAppButton = header.getByRole("link", { name: "Zur App" });
    await expect(goToAppButton).toBeVisible();

    // Check Hero section in German
    const heroSection = page.locator("#hero");
    await expect(heroSection).toBeVisible();

    await expect(
      heroSection.getByRole("heading", {
        level: 1,
        name: "Erstellen Sie professionelle Rechnungen in Sekunden",
      })
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "EasyInvoicePDF ist ein kostenloses Open-Source-Tool, mit dem Sie professionelle PDF-Rechnungen mit Echtzeit-Vorschau erstellen, anpassen und herunterladen können."
      )
    ).toBeVisible();

    await expect(
      heroSection.getByText(
        "Keine Anmeldung erforderlich. 100% kostenlos und Open-Source."
      )
    ).toBeVisible();

    // Check Features section in German
    const featuresSection = page.locator("#features");
    await expect(featuresSection).toBeVisible();

    await expect(featuresSection.getByTestId("features-badge")).toHaveText(
      "Funktionen"
    );

    await expect(
      featuresSection.getByTestId("features-coming-soon")
    ).toHaveText("Pro-Version und API in Kürze verfügbar");

    await expect(
      featuresSection.getByRole("heading", {
        level: 2,
        name: "Alles, was Sie für professionelle Rechnungsstellung brauchen",
      })
    ).toBeVisible();

    // Check footer in German
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    // Check newsletter subscription form in German
    await expect(footer.getByText("Newsletter abonnieren")).toBeVisible();
    await expect(
      footer.getByText("Alle E-Mails werden in englischer Sprache versendet")
    ).toBeVisible();

    const newsletterForm = footer.getByTestId("subscribe-form");
    await expect(newsletterForm).toBeVisible();
    await expect(
      newsletterForm.getByPlaceholder("E-Mail eingeben")
    ).toBeVisible();
    await expect(
      newsletterForm.getByRole("button", { name: "Abonnieren" })
    ).toBeVisible();

    const footerLinks = footer.getByTestId("about-page-footer-links");
    await expect(
      footerLinks.getByRole("link", { name: "Funktionen" })
    ).toBeVisible();
  });

  test("should handle language switching", async ({ page }) => {
    // Start with English
    await page.goto("/en/about");
    await expect(page).toHaveURL("/en/about");

    // Switch to French
    await page.getByRole("button", { name: "Switch language" }).click();
    await page.getByText("Français").click();

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link", { name: "Aller à l'application" })
    ).toBeVisible();
    await expect(page).toHaveURL("/fr/about");
  });

  test("should navigate to app when clicking Go to App button", async ({
    page,
  }) => {
    await page.goto("/en/about");

    // Click the Go to App button in header
    const header = page.getByRole("banner");

    const headerGoToAppButton = header.getByRole("link", { name: "Go to app" });

    await headerGoToAppButton.click();
    await expect(page).toHaveURL("/en/app");
  });
});
