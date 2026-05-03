import { hasLocale, type Locale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type EnMessages from "../../../../messages/en.json";
import { APP_URL, STATIC_ASSETS_URL, TWITTER_CREATOR } from "@/config";
import { AboutJsonLd } from "./about-json-ld";

const OPEN_GRAPH_LOCALE_BY_LOCALE = {
  en: "en_US",
  pl: "pl_PL",
  de: "de_DE",
  es: "es_ES",
  pt: "pt_PT",
  ru: "ru_RU",
  uk: "uk_UA",
  fr: "fr_FR",
  it: "it_IT",
  nl: "nl_NL",
} as const satisfies Record<Locale, string>;

// Add metadata to make sure search engines can index the page
export async function generateMetadata({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  try {
    // Load the messages for the requested locale
    const messages = await import(
      `../../../../messages/${params.locale}.json`
    ).then((module: { default: typeof EnMessages }) => module.default);

    return {
      title: messages.Metadata.about.title,
      description: messages.Metadata.about.description,
      keywords: messages.Metadata.about.keywords,
      alternates: {
        canonical: `${APP_URL}/${params.locale}/about`,
        languages: {
          // @ts-expect-error - x-default is not a valid locale
          "x-default": `${APP_URL}/en/about`,
          en: `${APP_URL}/en/about`,
          pl: `${APP_URL}/pl/about`,
          de: `${APP_URL}/de/about`,
          es: `${APP_URL}/es/about`,
          pt: `${APP_URL}/pt/about`,
          ru: `${APP_URL}/ru/about`,
          uk: `${APP_URL}/uk/about`,
          fr: `${APP_URL}/fr/about`,
          it: `${APP_URL}/it/about`,
          nl: `${APP_URL}/nl/about`,
        } satisfies Record<Locale, string>,
      },
      openGraph: {
        title: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        siteName: messages.Metadata.about.siteName,
        locale: OPEN_GRAPH_LOCALE_BY_LOCALE[params.locale],
        alternateLocale: Object.values(OPEN_GRAPH_LOCALE_BY_LOCALE),
        type: "website",
        url: `${APP_URL}/${params.locale}/about`,
        images: [
          {
            url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: "EasyInvoicePDF.com - Free Invoice PDF Generator",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        creator: TWITTER_CREATOR,
        images: [
          {
            url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: "EasyInvoicePDF.com - Free Invoice PDF Generator",
          },
        ],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);

    throw error;
  }
}

export default async function AboutLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  // Ensure that the incoming `locale` is valid
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering to prevent an error: https://nextjs.org/docs/messages/dynamic-server-error
  setRequestLocale(locale);

  return (
    <>
      {/** render the JSON-LD script tag (for SEO) for the about page */}
      <AboutJsonLd locale={locale} />
      {children}
    </>
  );
}
