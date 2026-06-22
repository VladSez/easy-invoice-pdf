import { PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageFaqId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";

import type { SeoLandingDefinition } from "./seo-landing-definitions";

export function buildSeoLandingJsonLd(
  definition: SeoLandingDefinition,
  baseUrl = PROD_WEBSITE_URL,
): Graph {
  const pageUrl = `${baseUrl}/${definition.slug}` as const;
  const faqUrl = pageFaqId(pageUrl);

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
        "@id": pageWebPageId(pageUrl),
        url: pageUrl,
        name: definition.metadata.title,
        description: definition.metadata.description,
        inLanguage: "en",
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
        { name: "Home", item: `${baseUrl}/` },
        { name: definition.metadata.title },
      ]),
    ],
  };
}
