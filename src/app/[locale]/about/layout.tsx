import { hasLocale, type Locale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import type EnMessages from "../../../../messages/en.json";
import { APP_URL } from "@/config";

// Add metadata to make sure search engines can index the page
export const generateMetadata = async ({
  params,
}: {
  params: { locale: Locale };
}): Promise<Metadata> => {
  try {
    // Load the messages for the requested locale
    const messages = await import(
      `../../../../messages/${params.locale}.json`
    ).then((module: { default: typeof EnMessages }) => module.default);

    return {
      title: messages.Metadata.about.title,
      description: messages.Metadata.about.description,
      keywords: messages.Metadata.about.keywords,
      metadataBase: new URL(APP_URL),
      alternates: {
        canonical: `/${params.locale}/about`,
        languages: {
          en: `/en/about`,
          pl: `/pl/about`,
          de: `/de/about`,
          es: `/es/about`,
          pt: `/pt/about`,
          ru: `/ru/about`,
          uk: `/uk/about`,
          fr: `/fr/about`,
          it: `/it/about`,
          nl: `/nl/about`,
        } satisfies Record<Locale, string>,
      },
      openGraph: {
        title: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        locale: params.locale,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
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
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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

  // Enable static rendering
  setRequestLocale(locale);

  // return children;
  return children;
}
