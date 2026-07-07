import { PROD_WEBSITE_URL, HOW_IT_WORKS_VIDEOS } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";

const PAGE_TITLE = "How EasyInvoicePDF Works | Video Tutorials";

const PAGE_DESCRIPTION =
  "Watch step-by-step video tutorials on creating invoices, saving seller and buyer details, and generating weekly invoices with EasyInvoicePDF.";

export function buildHowItWorksJsonLd(baseUrl = PROD_WEBSITE_URL): Graph {
  const pageUrl = `${baseUrl}/how-it-works`;

  const videoItems = HOW_IT_WORKS_VIDEOS.map((video, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    item: {
      "@type": "VideoObject" as const,
      name: video.title,
      description: video.description,
      embedUrl: video.embedUrl,
      contentUrl: video.watchUrl,
      url: `${pageUrl}#${video.id}`,
      publisher: {
        "@type": "Organization" as const,
        name: "EasyInvoicePDF",
        url: baseUrl,
      },
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageWebPageId(pageUrl),
        url: pageUrl,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        breadcrumb: {
          "@id": pageBreadcrumbId(pageUrl),
        },
        mainEntity: {
          "@type": "ItemList",
          "@id": `${pageUrl}#tutorials`,
          name: "EasyInvoicePDF video tutorials",
          itemListElement: videoItems,
        },
      },
      buildBreadcrumbList(pageUrl, [
        { name: "Start Invoicing", item: `${baseUrl}/` },
        { name: "How it works" },
      ]),
    ],
  };
}
