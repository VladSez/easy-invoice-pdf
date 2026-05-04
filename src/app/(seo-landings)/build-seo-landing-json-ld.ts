import { APP_URL } from "@/config";
import type { Graph } from "schema-dts";

import type { SeoLandingDefinition } from "./seo-landing-definitions";

export function buildSeoLandingJsonLd(
  definition: SeoLandingDefinition,
  baseUrl = APP_URL,
): Graph {
  const pageUrl = `${baseUrl}/${definition.slug}` as const;
  const faqUrl = `${pageUrl}#faq` as const;

  const faqEntities = definition.faq.map((item) => ({
    "@type": "Question" as const,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: definition.metadata.title,
        description: definition.metadata.description,
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
