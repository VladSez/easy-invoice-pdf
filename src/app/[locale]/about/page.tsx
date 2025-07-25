import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogo } from "@/components/etc/project-logo";
import { Footer } from "@/components/footer";
import {
  BlackGoToAppButton,
  GoToAppButton,
} from "@/components/go-to-app-button-cta";
import { SubscribeInput } from "@/components/subscribe-input";
import { Button } from "@/components/ui/button";
import {
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  DisclosureTrigger,
} from "@/components/ui/disclosure";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Video } from "@/components/video";
import { GITHUB_URL, STATIC_ASSETS_URL, VIDEO_DEMO_URL } from "@/config";
import { routing } from "@/i18n/routing";
import {
  CalculatorIcon,
  Download,
  FileText,
  GlobeIcon,
  Share2,
} from "lucide-react";
import { useTranslations, type Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { type Graph } from "schema-dts";
import { LandingCtaToast } from "./components/landing-cta-toast";
import { LanguageSwitcher } from "./components/language-switcher";
import { ProjectLogoDescription } from "@/components/project-logo-description";

// statically generate the pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function AboutPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params;

  // Enables static rendering to prevent an error: https://nextjs.org/docs/messages/dynamic-server-error
  setRequestLocale(locale);

  const t = useTranslations("About");
  const tNewsletter = useTranslations("About.newsletter");

  const newsletterTitle = tNewsletter("title");
  const newsletterDescription = tNewsletter("description");
  const newsletterSubscribe = tNewsletter("subscribe");
  const newsletterPlaceholder = tNewsletter("placeholder");
  const newsletterSuccessMessage = tNewsletter("success");
  const newsletterErrorMessage = tNewsletter("error");
  const newsletterEmailLanguageInfo = tNewsletter("emailLanguageInfo");

  return (
    <TooltipProvider>
      <script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD),
        }}
      />
      <LandingCtaToast />
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header locale={locale} />
        <main>
          <HeroSection />
          <FeaturesSection />
          <FaqSection />
          <SubscribeSection />
          <CtaSection />
        </main>
        <Footer
          links={
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  {t("buttons.app")}
                </Link>
              </li>
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
                  href="#faq"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  {t("footer.links.changelog")}
                </Link>
              </li>
              <li>
                <Link
                  href="https://pdfinvoicegenerator.userjot.com/?cursor=1&order=top&limit=10"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  {t("buttons.shareFeedback")}
                </Link>
              </li>
              <li>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  {t("footer.links.github")}
                </Link>
              </li>
            </ul>
          }
          translations={{
            footerDescription: t("footer.description"),
            footerCreatedBy: t("footer.createdBy"),
            product: t("footer.product"),

            newsletterTitle: newsletterTitle,
            newsletterDescription: newsletterDescription,
            newsletterSubscribe: newsletterSubscribe,
            newsletterPlaceholder: newsletterPlaceholder,
            newsletterSuccessMessage: newsletterSuccessMessage,
            newsletterErrorMessage: newsletterErrorMessage,
            newsletterEmailLanguageInfo: newsletterEmailLanguageInfo,
          }}
        />
      </div>
    </TooltipProvider>
  );
}

function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("About.buttons");
  const tFooter = useTranslations("About.footer.links");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex items-center justify-center">
        <div className="container h-auto px-3 py-2 sm:h-16 sm:py-0">
          <div className="flex h-full flex-row flex-wrap items-center justify-between gap-2">
            <div className="w-[53%] sm:w-auto">
              <Logo />
            </div>
            <div className="flex items-center sm:mt-0 sm:gap-2">
              <Button
                _variant="ghost"
                className="hidden lg:inline-flex"
                asChild
              >
                <Link href="/changelog">{tFooter("changelog")}</Link>
              </Button>
              <LanguageSwitcher
                locale={locale}
                buttonText={t("switchLanguage")}
              />
              {/* <BlackGoToAppButton className="px-3 sm:px-8" /> */}
              <BlackGoToAppButton className="px-3 sm:px-8">
                {t("goToApp")}
              </BlackGoToAppButton>
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
      className="relative flex w-full items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50 py-10 md:py-16 lg:py-24"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-50/40 blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-6">
          {/* Left column (text) */}
          <div className="flex flex-col justify-center space-y-5 md:space-y-6">
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>

              <p className="text-balance text-base text-slate-600 sm:text-lg md:max-w-[500px] md:text-xl">
                {t("hero.description")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <BlackGoToAppButton className="px-10 py-6 text-lg">
                {t("buttons.goToApp")}
              </BlackGoToAppButton>

              <Button
                _size="lg"
                _variant="outline"
                className="group relative overflow-hidden border-slate-200 px-10 py-6 text-lg shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md"
                asChild
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 h-6 w-6 transition-transform group-hover:scale-110" />
                  {t("buttons.viewOnGithub")}
                </Link>
              </Button>
            </div>
            <CtaTextDesktop text={t("hero.noSignup")} />
          </div>

          {/* Right column (video) */}
          <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
            {/* Mac OS Frame around the video */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:rounded-2xl md:shadow-xl">
              {/* Browser chrome bar */}
              <div className="h-8 w-full rounded-t-xl bg-gradient-to-b from-[#F3F3F3] to-[#E9E9E9] px-4 shadow-sm md:h-12 md:rounded-t-2xl">
                <div className="flex h-full items-center">
                  <div className="flex space-x-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] md:h-3 md:w-3"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E] md:h-3 md:w-3"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-[#28C840] md:h-3 md:w-3"></div>
                  </div>
                </div>
              </div>
              {/* Video container */}
              <div className="w-full">
                <Video
                  src={VIDEO_DEMO_URL}
                  fallbackImg={`${STATIC_ASSETS_URL}/easy-invoice-video-placeholder.webp`}
                  testId="hero-about-page-video"
                />
              </div>
            </div>
          </div>

          <CtaTextMobile text={t("hero.noSignup")} />
        </div>
      </div>
    </section>
  );
}

// should be hidden on desktop
function CtaTextMobile({
  text = "No sign-up required. 100% free and open-source.",
}: {
  text: string;
}) {
  return (
    <div
      className="mx-auto flex max-w-fit cursor-pointer items-center justify-center gap-x-2 text-pretty rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition-all hover:scale-105 lg:hidden"
      data-testid="cta-text-mobile"
    >
      <span className="" role="img" aria-label="checkmark">
        ✅
      </span>
      <span>{text}</span>
    </div>
  );
}

// should be hidden on mobile
function CtaTextDesktop({
  text = "No sign-up required. 100% free and open-source.",
}: {
  text: string;
}) {
  return (
    <div
      className="mx-auto hidden max-w-fit cursor-pointer items-center justify-center gap-x-2 text-pretty rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition-all hover:scale-105 sm:mx-0 lg:flex"
      data-testid="cta-text-desktop"
    >
      <span className="" role="img" aria-label="checkmark">
        ✅
      </span>
      <span>{text}</span>
    </div>
  );
}

function FeaturesSection() {
  const t = useTranslations("About");

  const FEATURES_CARDS = [
    {
      translationKey: "livePreview",
      icon: <FileText className="h-10 w-10 text-slate-700" />,
    },
    {
      translationKey: "shareableLinks",
      icon: <Share2 className="h-10 w-10 text-slate-700" />,
    },
    {
      translationKey: "instantDownload",
      icon: <Download className="h-10 w-10 text-slate-700" />,
    },
    {
      translationKey: "multiLanguage",
      icon: <GlobeIcon className="h-10 w-10 text-slate-700" />,
    },
    {
      translationKey: "vatSupport",
      icon: <CalculatorIcon className="h-10 w-10 text-slate-700" />,
    },
    {
      translationKey: "openSource",
      icon: <GithubIcon className="h-10 w-10 text-slate-700" />,
    },
  ] as const satisfies {
    translationKey: string;
    icon: React.ReactNode;
  }[];

  return (
    <section
      id="features"
      className="flex w-full items-center justify-center bg-slate-50 py-4 lg:py-8 xl:py-16"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div
              className="mb-10 inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-900 shadow-sm transition-colors"
              data-testid="features-badge"
            >
              {t("features.badge")}
            </div>

            <h2 className="text-3xl font-bold tracking-tighter text-slate-900 md:text-4xl/tight">
              {t("features.title")}
            </h2>
            <p className="max-w-[900px] text-slate-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("features.description")}
            </p>
          </div>
          <div
            className="inline-flex items-center rounded-md border border-amber-200 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900 shadow-sm transition-colors"
            data-testid="features-coming-soon"
          >
            {t("features.comingSoon")}
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 pt-10 md:grid-cols-2 md:gap-10 lg:grid-cols-3">
          {FEATURES_CARDS.map((feature) => {
            const title = t(`features.items.${feature.translationKey}.title`);
            const description = t(
              `features.items.${feature.translationKey}.description`
            );

            return (
              <div
                key={feature.translationKey}
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

function FaqSection() {
  const t = useTranslations("FAQ");

  const FAQ_ITEMS = [
    {
      translationKey: "whatIs",
    },
    {
      translationKey: "isFree",
    },
    {
      translationKey: "accountNeeded",
    },
    {
      translationKey: "customization",
    },
    {
      translationKey: "dataSecurity",
    },
    {
      translationKey: "sharing",
    },
  ] as const satisfies {
    translationKey: string;
  }[];

  return (
    <section
      id="faq"
      className="flex w-full items-center justify-center bg-white py-12 md:py-20"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="mb-10 inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-900 shadow-sm transition-colors">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tighter text-slate-900 md:text-4xl/tight">
              {t("title")}
            </h2>
            <p className="max-w-[900px] text-slate-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("description")}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <DisclosureGroup allowsMultipleExpanded>
            {FAQ_ITEMS.map((item) => {
              const question = t(`items.${item.translationKey}.question`);
              const answer = t(`items.${item.translationKey}.answer`);

              return (
                <Disclosure key={item.translationKey} id={item.translationKey}>
                  <DisclosureTrigger>{question}</DisclosureTrigger>
                  <DisclosurePanel>{answer}</DisclosurePanel>
                </Disclosure>
              );
            })}
          </DisclosureGroup>
        </div>
      </div>
    </section>
  );
}

function SubscribeSection() {
  const tNewsletter = useTranslations("About.newsletter");

  const newsletterTitle = tNewsletter("title");
  const newsletterDescription = tNewsletter("description");
  const newsletterSubscribe = tNewsletter("subscribe");
  const newsletterPlaceholder = tNewsletter("placeholder");
  const newsletterSuccessMessage = tNewsletter("success");
  const newsletterErrorMessage = tNewsletter("error");
  const newsletterEmailLanguageInfo = tNewsletter("emailLanguageInfo");

  return (
    <section
      id="newsletter"
      className="flex w-full items-center justify-center bg-white py-12 md:py-24"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-slate-900 md:text-4xl/tight">
              {tNewsletter("title")}
            </h2>
            <p className="max-w-[600px] text-slate-600 lg:text-base/relaxed xl:text-xl/relaxed">
              {tNewsletter("description")}
            </p>
          </div>
          <div className="w-full max-w-md">
            <SubscribeInput
              translations={{
                title: newsletterTitle,
                description: newsletterDescription,
                subscribe: newsletterSubscribe,
                placeholder: newsletterPlaceholder,
                success: newsletterSuccessMessage,
                error: newsletterErrorMessage,
                emailLanguageInfo: newsletterEmailLanguageInfo,
              }}
            />
          </div>
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
          <div className="flex w-full flex-col items-center justify-center gap-6">
            <div className="flex w-full flex-col justify-center gap-2 md:flex-row">
              <GoToAppButton className="border-slate-600 bg-white px-10 py-6 text-lg text-slate-950 hover:bg-white/90">
                {t("buttons.goToApp")}
              </GoToAppButton>
              <Button
                _size="lg"
                className="group border border-slate-700 bg-slate-700 px-10 py-6 text-lg text-white transition-all duration-300 hover:bg-slate-600/80"
                asChild
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 h-6 w-6 fill-slate-100 transition-transform duration-300 group-hover:scale-110 group-hover:fill-slate-950" />
                  {t("buttons.starOnGithub")}
                </Link>
              </Button>
            </div>
          </div>
          <p className="animate-pulse text-sm text-slate-400">
            {t("cta.noSignup")}
          </p>
        </div>
      </div>
    </section>
  );
}

function Logo() {
  const t = useTranslations("About");

  return (
    <div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ProjectLogo className="h-7 w-7 flex-shrink-0 sm:h-8 sm:w-8" />
        <ProjectLogoDescription>{t("tagline")}</ProjectLogoDescription>
      </div>
    </div>
  );
}

const JSON_LD: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://easyinvoicepdf.com/en/about",
      url: "https://easyinvoicepdf.com/en/about",
      name: "About | Free Invoice Generator – Live Preview, No Sign-Up",
      description:
        "EasyInvoicePDF is a free, open-source tool to create professional invoices with real-time PDF preview, no sign-up required.",
      mainEntity: {
        "@id": "https://easyinvoicepdf.com/en/about",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://easyinvoicepdf.com/en/about#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is EasyInvoicePDF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EasyInvoicePDF is a free, open-source tool that helps you create professional invoices instantly. It features a live preview, customizable templates, and supports multiple languages and currencies.",
          },
        },
        {
          "@type": "Question",
          name: "Is it really free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, EasyInvoicePDF is completely free to use. The entire project is open-source and available on GitHub.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need to create an account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No, you don't need to create an account or sign up. You can start creating invoices immediately without any registration process.",
          },
        },
        {
          "@type": "Question",
          name: "Can I customize the invoice template?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you can customize various aspects of your invoice including company details, currency, and language. More customization options are being added regularly.",
          },
        },
        {
          "@type": "Question",
          name: "Is my data secure?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Your privacy is important to us. All invoice data is processed entirely in your browser - we don't store any of your information on our servers. You can even use the tool offline once loaded.",
          },
        },
        {
          "@type": "Question",
          name: "Can I share invoices with others?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you can generate shareable links for your invoices that others can view and download. These links are secure and only accessible to people you share them with.",
          },
        },
      ],
    },
  ],
};
