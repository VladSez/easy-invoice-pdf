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

    await expect(
      heroSection.getByRole("img", {
        name: "EasyInvoicePDF interface showing invoice creation with live preview",
      })
    ).toBeVisible();

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

    // Check footer
    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();

    const footerSocialLinks = footer.getByTestId(
      "about-page-footer-social-links"
    );

    await expect(
      footerSocialLinks.getByRole("link", { name: "GitHub" })
    ).toBeVisible();
    await expect(
      footerSocialLinks.getByRole("link", { name: "Twitter" })
    ).toBeVisible();

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

    await expect(
      footerLinks.getByRole("link", { name: "Features" })
    ).toBeVisible();
    await expect(
      footerLinks.getByRole("link", { name: "GitHub" })
    ).toBeVisible();
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
    await expect(
      footerLinks.getByRole("link", { name: "Fonctionnalités" })
    ).toBeVisible();
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

    await expect(page).toHaveURL("/fr/about");

    const header = page.getByRole("banner");
    await expect(
      header.getByRole("link", { name: "Aller à l'application" })
    ).toBeVisible();

    // Switch to German
    await page.getByRole("button", { name: "Changer de langue" }).click();
    await page.getByText("Deutsch").click();
    await expect(page).toHaveURL("/de/about");

    await expect(header.getByRole("link", { name: "Zur App" })).toBeVisible();
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
