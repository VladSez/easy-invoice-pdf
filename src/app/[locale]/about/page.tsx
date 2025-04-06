import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations, type Locale } from "next-intl";
import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogo } from "@/components/etc/project-logo";
import { cn } from "@/lib/utils";
import {
  CalculatorIcon,
  Download,
  FileText,
  GlobeIcon,
  Share2,
} from "lucide-react";
import { LanguageSwitcher } from "./components/language-switcher";

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header locale={locale} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("About.buttons");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex items-center justify-center">
        <div className="container h-auto px-3 py-2 sm:h-16 sm:py-0">
          <div className="flex h-full flex-row flex-wrap items-center justify-between gap-2">
            <div className="w-[50%]">
              <Logo />
            </div>
            <div className="flex items-center sm:mt-0 sm:gap-2">
              <LanguageSwitcher
                locale={locale}
                buttonText={t("switchLanguage")}
              />
              <GoToAppButton className="" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const t = useTranslations("About");

  return (
    <section
      id="hero"
      className="flex w-full items-center justify-center bg-white py-12 md:py-24 lg:py-32 lg:pb-44"
    >
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-balance pb-3 text-3xl font-bold tracking-tighter text-slate-900 sm:text-[54px]/[1]">
                {t("hero.title")}
              </h1>
              <p className="max-w-[450px] text-balance text-slate-600 md:text-lg">
                {t("hero.description")}
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <GoToAppButton />
              <Button _size="lg" _variant="outline" className="px-8" asChild>
                <Link
                  href="https://github.com/VladSez/easy-invoice-pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 h-5 w-5" />
                  {t("buttons.viewOnGithub")}
                </Link>
              </Button>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {t("hero.noSignup")}
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.webp"
            alt="EasyInvoicePDF interface showing invoice creation with live preview"
            className="h-full w-full rounded-xl border-none object-cover shadow-md"
            width={1000}
            height={1000}
          />
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations("About");

  const FEATURES_CARDS = [
    {
      key: "livePreview",
      icon: <FileText className="h-10 w-10 text-slate-700" />,
    },
    {
      key: "shareableLinks",
      icon: <Share2 className="h-10 w-10 text-slate-700" />,
    },
    {
      key: "instantDownload",
      icon: <Download className="h-10 w-10 text-slate-700" />,
    },
    {
      key: "multiLanguage",
      icon: <GlobeIcon className="h-10 w-10 text-slate-700" />,
    },
    {
      key: "vatSupport",
      icon: <CalculatorIcon className="h-10 w-10 text-slate-700" />,
    },
    {
      key: "openSource",
      icon: <GithubIcon className="h-10 w-10 text-slate-700" />,
    },
  ] as const satisfies {
    key: string;
    icon: React.ReactNode;
  }[];

  return (
    <section
      id="features"
      className="flex w-full items-center justify-center bg-slate-50 py-12 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="mb-10 inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-900 shadow-sm transition-colors">
              {t("features.badge")}
            </div>

            <h2 className="text-3xl font-bold tracking-tighter text-slate-900 md:text-4xl/tight">
              {t("features.title")}
            </h2>
            <p className="max-w-[900px] text-slate-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("features.description")}
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 pt-10 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
          {FEATURES_CARDS.map((feature) => {
            const title = t(`features.items.${feature.key}.title`);
            const description = t(`features.items.${feature.key}.description`);

            return (
              <div
                key={feature.key}
                className="flex h-full flex-col items-start gap-4 rounded-lg border border-slate-100 bg-white p-6 shadow-sm"
              >
                {feature.icon}
                <div>
                  <h3 className="text-balance pb-2 text-xl font-bold text-slate-900">
                    {title}
                  </h3>
                  <p className="text-balance text-slate-600">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const t = useTranslations("About");

  return (
    <section
      id="cta"
      className="flex w-full items-center justify-center bg-slate-900 py-12 md:py-24 lg:py-32"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-white md:text-4xl/tight">
              {t("cta.title")}
            </h2>
            <p className="max-w-[600px] text-slate-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("cta.description")}
            </p>
          </div>
          <div className="flex w-full flex-col justify-center gap-2 md:flex-row">
            <GoToAppButton className="border-slate-600 bg-white text-slate-950 hover:bg-white/90" />

            <Button
              _size="lg"
              className="bg-slate-700 px-8 text-white hover:bg-slate-700/90"
              asChild
            >
              <Link
                href="https://github.com/VladSez/easy-invoice-pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="mr-2 h-5 w-5 fill-white" />
                {t("buttons.viewOnGithub")}
              </Link>
            </Button>
          </div>
          <p className="text-sm text-slate-400">{t("cta.noSignup")}</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("About");

  return (
    <footer
      id="footer"
      className="flex w-full items-center justify-center border-t border-slate-200 bg-white py-12 md:py-16 lg:py-20"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row">
          <div className="space-y-4 md:w-1/3">
            <Logo />
            <p className="text-sm text-slate-500">{t("footer.description")}</p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/VladSez/easy-invoice-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                href="https://x.com/vlad_sazon"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-800"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:gap-10 md:flex-1 md:grid-cols-2">
            <div className="space-y-3"></div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-900">
                {t("footer.product")}
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    {t("footer.links.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/VladSez/easy-invoice-pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-500 hover:text-slate-900"
                  >
                    {t("footer.links.github")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">
            {t("footer.copyright", {
              year: String(new Date().getFullYear()),
            })}
          </p>
          <p className="text-xs text-slate-500">
            {t("footer.createdBy")}{" "}
            <Link
              href="https://github.com/VladSez"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-900"
            >
              Vlad Sazonau
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function GoToAppButton({ className }: { className?: string }) {
  const t = useTranslations("About");

  return (
    <Button
      _size="lg"
      className={cn("bg-slate-950 px-8 hover:bg-slate-950/85", className)}
      asChild
    >
      <Link href="/app">{t("buttons.goToApp")}</Link>
    </Button>
  );
}

function Logo() {
  const t = useTranslations("About");

  return (
    <div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ProjectLogo className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
        <div className="flex flex-col">
          <p className="text-balance text-base font-bold text-slate-800 sm:text-xl lg:text-2xl">
            <a
              href="https://easyinvoicepdf.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              EasyInvoicePDF.com
            </a>
          </p>
          <p className="text-balance text-[11px] text-slate-700 sm:text-[12px]">
            {t("tagline")}
          </p>
        </div>
      </div>
    </div>
  );
}
