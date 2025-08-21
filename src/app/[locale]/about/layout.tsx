import { hasLocale, type Locale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type EnMessages from "../../../../messages/en.json";
import { APP_URL, STATIC_ASSETS_URL } from "@/config";

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
        locale: params.locale,
        type: "website",
        url: `${APP_URL}/${params.locale}/about`,
        images: [
          {
            url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        creator: "@vlad_sazon",
        images: [
          {
            url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
            width: 1200,
            height: 630,
            type: "image/png",
            alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
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

  return children;
}
