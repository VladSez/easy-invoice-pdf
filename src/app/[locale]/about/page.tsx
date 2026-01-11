import { GithubIcon } from "@/components/etc/github-logo";
import { ProjectLogo } from "@/components/etc/project-logo";
import { Footer } from "@/components/footer";
import {
  BlackGoToAppButton,
  GoToAppButton,
} from "@/components/go-to-app-button-cta";
import { Button } from "@/components/ui/button";

import { BlackAnimatedGoToAppBtn } from "@/components/animated-go-to-app-btn";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Video } from "@/components/video";
import { GITHUB_URL, IMAGEKIT_CDN_URL, VIDEO_DEMO_URL } from "@/config";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useTranslations, type Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { type Graph } from "schema-dts";
import { LanguageSwitcher } from "./components/language-switcher";

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
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header locale={locale} />
        <main>
          <HeroSection />
          <FeaturesSection />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer
          links={
            <ul className="space-y-2">
              <li>
                <Link
                  href="/?template=default"
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
              <Button variant="ghost" className="hidden lg:inline-flex" asChild>
                <Link href="/changelog">{tFooter("changelog")}</Link>
              </Button>
              <LanguageSwitcher
                locale={locale}
                buttonText={t("switchLanguage")}
              />

              <BlackAnimatedGoToAppBtn>{t("goToApp")}</BlackAnimatedGoToAppBtn>
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
        <div className="grid gap-6 md:gap-8 lg:gap-12 xl:grid-cols-2 xl:gap-6">
          {/* Left column start (text and CTA buttons) */}
          <div className="flex flex-col justify-center space-y-5 md:space-y-6">
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-balance text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl xl:text-left">
                {t("hero.title")}
              </h1>

              <div className="flex justify-center xl:justify-start">
                <p className="text-pretty px-4 text-center text-base text-slate-600 md:max-w-[500px] md:text-lg lg:px-0 xl:text-left xl:text-lg">
                  {t.rich("hero.description", {
                    span: (chunks) => (
                      <span className="bg-yellow-300 px-0.5 font-bold text-slate-900 dark:bg-yellow-600">
                        {chunks}
                      </span>
                    ),
                  })}
                </p>
              </div>
            </div>

            {/* CTA Buttons (Go to app and View on GitHub) */}
            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row sm:flex-wrap xl:justify-start">
              <BlackGoToAppButton className="w-full px-10 py-6 text-lg lg:w-[270px] lg:max-w-[270px]">
                <span className="text-clip">{t("buttons.startInvoicing")}</span>
              </BlackGoToAppButton>

              <Button
                size="lg"
                variant="outline"
                className="group relative w-full overflow-hidden border-slate-200 px-10 py-6 text-lg shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md lg:w-[270px] lg:max-w-[270px]"
                asChild
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 h-6 w-6 transition-transform group-hover:scale-110" />
                  <span className="text-clip">{t("buttons.viewOnGithub")}</span>
                </Link>
              </Button>
            </div>
          </div>
          {/* Left column end */}

          {/* Right column start (video) */}
          <div className="relative mx-auto w-full max-w-[950px] xl:mx-0">
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
              <div className="relative aspect-video w-full">
                <Video
                  src={VIDEO_DEMO_URL}
                  fallbackImg={`${IMAGEKIT_CDN_URL}/easy-invoice-demo-2026-fallback.png`}
                  testId="hero-about-page-video"
                />
              </div>
            </div>
          </div>
          {/* Right column end */}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations("About");

  const FEATURES_CARDS = [
    {
      translationKey: "livePreview",
      videoSrc: `${IMAGEKIT_CDN_URL}/live-preview.mp4?updatedAt=1764511439140`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/live-preview-fallback.png?updatedAt=1764511421437`,
    },
    {
      translationKey: "instantDownload",
      videoSrc: `${IMAGEKIT_CDN_URL}/instand-download.mp4`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/instant-download-fallback.png`,
    },
    {
      translationKey: "shareableLinks",
      videoSrc: `${IMAGEKIT_CDN_URL}/share-invoice.mp4`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/share-invoice-fallback.png`,
    },
    {
      translationKey: "taxSupport",
      videoSrc: `${IMAGEKIT_CDN_URL}/tax-custom.mp4`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/tax-custom-fallback.png`,
    },
    {
      translationKey: "multiLanguage",
      videoSrc: `${IMAGEKIT_CDN_URL}/multi-lang.mp4?updatedAt=1764535032761`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/multi-lang-fallback.png?updatedAt=1764535032761`,
    },
    {
      translationKey: "openSource",
      videoSrc: `${IMAGEKIT_CDN_URL}/open-source.mp4`,
      videoFallbackImg: `${IMAGEKIT_CDN_URL}/open-source-fallback.png`,
    },
  ] as const satisfies {
    translationKey: string;
    videoSrc: string;
    videoFallbackImg: string;
  }[];

  return (
    <section
      id="features"
      className="mt-6 flex w-full items-center justify-center bg-slate-50 py-4 lg:py-8 xl:mt-16 xl:py-16"
    >
      <div className="container">
        {/* Features section title and description */}
        <div className="flex flex-col items-center justify-center space-y-8 px-4 text-center md:px-6">
          <div className="space-y-5">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {t("features.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-pretty text-base text-slate-600 sm:text-lg md:text-xl">
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

        {/* Features cards */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-6 pt-10 md:gap-10">
          {FEATURES_CARDS.map((feature, index) => {
            const title = t(`features.items.${feature.translationKey}.title`);
            const description = t(
              `features.items.${feature.translationKey}.description`,
            );
            const isEven = index % 2 === 0;

            return (
              <div
                key={feature.translationKey}
                className={cn(
                  `flex h-full w-full flex-col items-start gap-6 rounded-xl border-[0.5px] border-slate-200 bg-white shadow-sm md:items-center md:rounded-2xl`,
                  isEven ? "xl:flex-row" : "xl:flex-row-reverse", // swap the video and text content for even index
                )}
              >
                <div className="mb-[-5px] flex-1 px-8 pt-6 xl:mb-0 xl:py-4">
                  <h3 className="text-balance pb-4 text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">
                    {title}
                  </h3>
                  <p className="text-pretty text-base leading-relaxed text-slate-600 sm:text-lg sm:leading-7">
                    {description}
                  </p>
                </div>

                <div className="relative w-full max-w-[800px] px-2 pb-3 lg:p-0 xl:mx-0">
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
                    <div className="relative aspect-[16.6/8.9] h-full w-full lg:aspect-[16.99/9.1]">
                      <Video
                        src={feature.videoSrc}
                        fallbackImg={feature.videoFallbackImg}
                        testId={`${feature.translationKey}-demo-video`}
                      />
                    </div>
                  </div>
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
          <div className="space-y-5">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-[700px] text-pretty text-base text-slate-600 sm:text-lg md:text-xl">
              {t("description")}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="space-y-2">
            {FAQ_ITEMS.map((item) => {
              const question = t(`items.${item.translationKey}.question`);
              const answer = t(`items.${item.translationKey}.answer`);

              return (
                <details
                  key={item.translationKey}
                  className="group cursor-pointer border-b border-slate-200 bg-white transition-all duration-200 hover:border-slate-200"
                >
                  <summary className="flex select-none items-center justify-between gap-2 py-3 text-left">
                    <span className="text-base font-medium text-slate-900">
                      {question}
                    </span>
                    <ChevronDown
                      className="ml-auto size-6 shrink-0 rounded-full p-1 text-slate-600 transition-all duration-200 hover:bg-gray-200 hover:text-slate-900 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="overflow-hidden">
                    <div className="pb-4 pr-4">
                      <p className="cursor-default text-pretty text-sm leading-relaxed text-slate-600">
                        {answer}
                      </p>
                    </div>
                  </div>
                </details>
              );
            })}
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
        <div className="flex flex-col items-center justify-center space-y-7 text-center">
          <div className="flex flex-col items-center justify-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter text-white md:text-5xl/tight">
              {t("cta.title")}
            </h2>
            <p className="max-w-[600px] text-slate-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {t("cta.description")}
            </p>
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-6">
            <div className="flex w-full flex-col justify-center gap-2 md:flex-row">
              <GoToAppButton className="w-full border-slate-600 bg-white px-10 py-6 text-lg text-slate-950 hover:bg-white/90 lg:w-[300px] lg:max-w-[300px]">
                <span className="text-clip">{t("buttons.goToApp")}</span>
              </GoToAppButton>
              <Button
                size="lg"
                className="group w-full border border-slate-700 bg-slate-700 px-10 py-6 text-lg text-white transition-all duration-300 hover:bg-slate-600/80 lg:w-[300px] lg:max-w-[300px]"
                asChild
              >
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GithubIcon className="mr-2 size-6 fill-slate-100 transition-transform duration-300 group-hover:scale-110 group-hover:fill-slate-200" />
                  <span className="text-clip">{t("buttons.starOnGithub")}</span>
                </Link>
              </Button>
            </div>
            <p className="animate-pulse text-sm text-slate-400">
              {t("cta.noSignup")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Logo() {
  // const t = useTranslations("About");

  return (
    <div>
      {/* <div className="flex items-center gap-1">
        <ProjectLogo className="size-7 flex-shrink-0 sm:size-8" />
        <div className="flex flex-col">
          <h1 className="text-balance text-xl font-bold text-slate-800 lg:text-2xl">
            <a
              href="https://dub.sh/easy-invoice?ref=about-page"
              target="_blank"
              rel="noopener noreferrer"
            >
              EasyInvoicePDF
            </a>
          </h1>
        </div> */}
      {/* <ProjectLogoDescription>{t("tagline")}</ProjectLogoDescription> */}
      {/* </div> */}
      <div className="flex items-center">
        <ProjectLogo className="size-7 flex-shrink-0 sm:size-8" />
        <p className="text-balance text-center text-xl font-bold text-slate-800 sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left">
          <a
            href="https://easyinvoicepdf.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            EasyInvoicePDF
          </a>
        </p>
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
            text: "Your privacy is important to us. All invoice data is processed entirely in your browser - we don't store any of your information on our servers.",
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
