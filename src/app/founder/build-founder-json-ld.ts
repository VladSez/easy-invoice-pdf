import { PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";
import { FOUNDER_PAGE_URL } from "@/lib/seo/site-entities";

const FOUNDER_PAGE_TITLE = "Vlad Sazonau | Founder of EasyInvoicePDF";

const FOUNDER_PAGE_DESCRIPTION =
  "Meet Vlad Sazonau, founder of EasyInvoicePDF, the free open-source invoice PDF generator with live preview. Product engineer and design enthusiast with 8+ years building digital products.";

export function buildFounderJsonLdGraph(): Graph {
  const pageUrl = FOUNDER_PAGE_URL;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": pageWebPageId(pageUrl),
        url: pageUrl,
        name: FOUNDER_PAGE_TITLE,
        description: FOUNDER_PAGE_DESCRIPTION,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        breadcrumb: {
          "@id": pageBreadcrumbId(pageUrl),
        },
        mainEntity: {
          "@id": JSON_LD_IDS.person,
        },
      },
      buildBreadcrumbList(pageUrl, [
        { name: "Home", item: `${PROD_WEBSITE_URL}/` },
        { name: "Founder" },
      ]),
    ],
  };
}
