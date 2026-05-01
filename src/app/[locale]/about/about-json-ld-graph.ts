import { APP_URL } from "@/config";
import type { Locale } from "next-intl";
import type Messages from "../../../../messages/en.json";
import type { Graph } from "schema-dts";

const FAQ_ITEM_KEYS = [
  "whatIs",
  "isFree",
  "accountNeeded",
  "customization",
  "dataSecurity",
  "sharing",
] as const;

type FaqItemKey = (typeof FAQ_ITEM_KEYS)[number];

/**
 * Builds a JSON-LD graph for the about page with schema.org structured data.
 * Includes WebPage and FAQPage schemas with FAQ questions and answers.
 *
 * @param messages - Translated message content containing FAQ items and metadata
 * @param locale - The current locale (e.g., 'en', 'pl')
 * @param baseUrl - Base URL for constructing page URLs (defaults to APP_URL)
 * @returns A Graph object containing WebPage and FAQPage schema definitions
 */
export function buildAboutJsonLdGraph(
  messages: typeof Messages,
  locale: Locale,
  baseUrl: string = APP_URL,
): Graph {
  const pageUrl = `${baseUrl}/${locale}/about`;
  const faqUrl = `${pageUrl}#faq`;

  const faqEntities = FAQ_ITEM_KEYS.map((key: FaqItemKey) => {
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
        "@id": pageUrl,
        url: pageUrl,
        name: messages.Metadata.about.title,
        description: messages.Metadata.about.description,
        mainEntity: {
          "@id": pageUrl,
        },
      },
      {
        "@type": "FAQPage",
        "@id": faqUrl,
        mainEntity: faqEntities,
      },
    ],
  };
}
