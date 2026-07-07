import { GITHUB_URL, PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageFaqId,
  pageSoftwareAppId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";

import type { SeoLandingDefinition } from "./seo-landing-definitions";

function buildLandingSoftwareApplication(
  pageUrl: string,
  definition: SeoLandingDefinition,
) {
  return {
    "@type": "SoftwareApplication" as const,
    "@id": pageSoftwareAppId(pageUrl),
    url: pageUrl,
    name: definition.metadata.title,
    description: definition.metadata.description,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "EUR",
    },
    creator: {
      "@id": JSON_LD_IDS.organization,
    },
    sameAs: [GITHUB_URL],
  };
}

export function buildSeoLandingJsonLd(
  definition: SeoLandingDefinition,
  baseUrl = PROD_WEBSITE_URL,
): Graph {
  const pageUrl = `${baseUrl}/${definition.slug}` as const;
  const faqUrl = pageFaqId(pageUrl);
  const isOpenSourceLanding =
    definition.slug === "open-source-invoice-generator";

  const faqEntities = definition.faq.map((item) => ({
    "@type": "Question" as const,
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: item.answer,
    },
  }));

  const webPage = {
    "@type": "WebPage" as const,
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
      "@id": isOpenSourceLanding ? pageSoftwareAppId(pageUrl) : faqUrl,
    },
  };

  const faqPage = {
    "@type": "FAQPage" as const,
    "@id": faqUrl,
    mainEntity: faqEntities,
  };

  const breadcrumb = buildBreadcrumbList(pageUrl, [
    { name: "Start Invoicing", item: `${baseUrl}/` },
    { name: definition.metadata.title },
  ]);

  const graph = isOpenSourceLanding
    ? [
        webPage,
        buildLandingSoftwareApplication(pageUrl, definition),
        faqPage,
        breadcrumb,
      ]
    : [webPage, faqPage, breadcrumb];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
