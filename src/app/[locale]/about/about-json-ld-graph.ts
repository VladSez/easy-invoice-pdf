import { PROD_WEBSITE_URL } from "@/config";
import type { Locale } from "next-intl";
import type Messages from "../../../../messages/en.json";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageFaqId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";

import { ABOUT_FAQ_ITEM_KEYS } from "./about-faq-item-keys";

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

function toSchemaLanguage(locale: Locale) {
  return OPEN_GRAPH_LOCALE_BY_LOCALE[locale].replace("_", "-");
}

/**
 * Builds a JSON-LD graph for the about page with schema.org structured data.
 * Includes WebPage, FAQPage, and BreadcrumbList schemas.
 */
export function buildAboutJsonLdGraph(
  messages: typeof Messages,
  locale: Locale,
  baseUrl: string = PROD_WEBSITE_URL,
): Graph {
  const pageUrl = `${baseUrl}/${locale}/about`;
  const faqUrl = pageFaqId(pageUrl);
  const homeLabel = "Home";
  const aboutLabel = messages.Metadata.about.title;

  const faqEntities = ABOUT_FAQ_ITEM_KEYS.map((key) => {
    const item = messages.FAQ.items[key];

    if (!item) {
      throw new Error(`FAQ item ${key} not found in /messages/${locale}.json`);
    }

    return {
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: item.answer,
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageWebPageId(pageUrl),
        url: pageUrl,
        name: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        inLanguage: toSchemaLanguage(locale),
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        breadcrumb: {
          "@id": pageBreadcrumbId(pageUrl),
        },
        mainEntity: {
          "@id": faqUrl,
        },
      },
      {
        "@type": "FAQPage",
        "@id": faqUrl,
        mainEntity: faqEntities,
      },
      buildBreadcrumbList(pageUrl, [
        { name: homeLabel, item: `${baseUrl}/` },
        { name: aboutLabel },
      ]),
    ],
  };
}
