import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { NewsletterForm } from "./components/newsletter-form";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./components/language-switcher";

interface Feature {
  title: string;
  description: string;
}

export default function AboutPage({
  params,
}: {
  params: { locale: "en" | "pl" };
}) {
  const { locale } = params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations("LandingPage");
  const navT = useTranslations("Navigation");
  const footerT = useTranslations("Footer");

  // Get features as a properly typed array
  const features = t.raw("features.items") as Feature[];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header/Navigation */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">{t("title")}</h1>
          </div>
          <nav className="flex items-center space-x-6">
            {/* <Link
              href="/"
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {navT("home")}
            </Link> */}
            {/* <a
              href="#features"
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {navT("features")}
            </a> */}
            <Button asChild _variant="default">
              <Link href="/app">{navT("app")}</Link>
            </Button>
            <LanguageSwitcher locale={locale} />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section */}
        <section className="px-4 py-20">
          <div className="container mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1 space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {t("title")}
              </h1>
              <p className="text-muted-foreground text-xl">{t("subtitle")}</p>
              <p className="text-muted-foreground max-w-lg text-lg">
                {t("description")}
              </p>
              <div className="pt-4">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/app">{t("cta")}</Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-1 justify-center">
              <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg shadow-xl">
                <div className="from-primary/20 to-primary/10 absolute inset-0 bg-gradient-to-br backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-3/4 w-3/4 flex-col items-center justify-center rounded-lg bg-white/95 p-6 shadow-lg">
                    <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="w-full space-y-2">
                      <div className="h-2 w-full rounded bg-gray-200"></div>
                      <div className="h-2 w-3/4 rounded bg-gray-200"></div>
                      <div className="h-2 w-full rounded bg-gray-200"></div>
                      <div className="h-2 w-1/2 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 px-4 py-20">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              {t("features.title")}
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-background p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="px-4 py-20">
          <div className="container mx-auto flex max-w-6xl flex-col items-center text-center">
            <NewsletterForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-4 py-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-muted-foreground">{footerT("copyright")}</p>
            <div className="mt-4 flex space-x-6 md:mt-0">
              <a
                href="#"
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {footerT("links.privacy")}
              </a>
              <a
                href="#"
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {footerT("links.terms")}
              </a>
              <a
                href="#"
                className="text-muted-foreground text-sm transition-colors hover:text-foreground"
              >
                {footerT("links.contact")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
