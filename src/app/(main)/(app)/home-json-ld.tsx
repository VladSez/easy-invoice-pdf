import type { Graph } from "schema-dts";

import { PROD_WEBSITE_URL } from "@/config";
import { JSON_LD_IDS, pageWebPageId } from "@/lib/seo/json-ld-ids";
import { JsonLdScript } from "@/lib/seo/render-json-ld";
import {
  buildFullWebSite,
  buildOrganization,
  buildWebApplication,
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
} from "@/lib/seo/site-entities";

/** The page a `WebPage` node describes: the invoice app at one of its routes. */
export interface InvoiceAppWebPage {
  /** Absolute production URL of the route, e.g. `https://easyinvoicepdf.com/`. */
  url: string;
  name: string;
  /** The route's meta description. */
  description: string;
}

/** The home page, `/`: the invoice app on the default template. */
export const HOME_WEB_PAGE = {
  url: `${PROD_WEBSITE_URL}/`,
  name: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
} as const satisfies InvoiceAppWebPage;

/**
 * Builds the JSON-LD graph of an invoice app route: the site-wide entities plus a
 * `WebPage` for the route itself, so `/` and `/stripe-template` each describe their own URL.
 *
 * @param webPage - The route the graph is rendered on. Defaults to the home page.
 * @returns The schema.org graph.
 */
export function buildHomeJsonLdGraph(
  webPage: InvoiceAppWebPage = HOME_WEB_PAGE,
): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildFullWebSite(),
      buildOrganization(),
      buildWebApplication(),
      {
        "@type": "WebPage",
        "@id": pageWebPageId(webPage.url),
        url: webPage.url,
        name: webPage.name,
        description: webPage.description,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        mainEntity: {
          "@id": JSON_LD_IDS.app,
        },
      },
    ],
  };
}

export function HomeJsonLd({
  webPage = HOME_WEB_PAGE,
}: {
  /** The route this is rendered on. Defaults to the home page. */
  webPage?: InvoiceAppWebPage;
}) {
  return (
    <JsonLdScript id="json-ld-home" data={buildHomeJsonLdGraph(webPage)} />
  );
}
