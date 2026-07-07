import { PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { JsonLdScript } from "@/lib/seo/render-json-ld";
import { JSON_LD_IDS } from "@/lib/seo/json-ld-ids";
import {
  buildFullWebSite,
  buildOrganization,
  buildSiteNavigationList,
  buildWebApplication,
  HOME_PAGE_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo/site-entities";

export function buildHomeJsonLdGraph(): Graph {
  const pageUrl = `${PROD_WEBSITE_URL}/`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildFullWebSite(),
      buildOrganization(),
      buildWebApplication(),
      buildSiteNavigationList(),
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: SITE_NAME,
        description: HOME_PAGE_DESCRIPTION,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        mainEntity: {
          "@id": JSON_LD_IDS.app,
        },
        hasPart: {
          "@id": JSON_LD_IDS.siteNavigation,
        },
      },
    ],
  };
}

export function HomeJsonLd() {
  return <JsonLdScript id="json-ld-home" data={buildHomeJsonLdGraph()} />;
}
