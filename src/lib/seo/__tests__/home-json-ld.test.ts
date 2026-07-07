import { describe, expect, it } from "vitest";

import { buildHomeJsonLdGraph } from "../../../app/(app)/home-json-ld";
import { JSON_LD_IDS } from "../json-ld-ids";

describe("buildHomeJsonLdGraph", () => {
  it("includes full WebSite, Organization, WebApplication, site nav, and WebPage linked by @id", () => {
    const graph = buildHomeJsonLdGraph();
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };

    expect(parsed["@graph"]).toHaveLength(5);

    const webSite = parsed["@graph"].find(
      (node) => node["@type"] === "WebSite",
    );
    const organization = parsed["@graph"].find(
      (node) => node["@type"] === "Organization",
    );
    const webApplication = parsed["@graph"].find(
      (node) => node["@type"] === "WebApplication",
    );
    const siteNavigation = parsed["@graph"].find(
      (node) => node["@type"] === "ItemList",
    );
    const webPage = parsed["@graph"].find(
      (node) => node["@type"] === "WebPage",
    );

    expect(webSite).toMatchObject({
      "@id": JSON_LD_IDS.website,
      publisher: { "@id": JSON_LD_IDS.organization },
    });

    expect(organization).toMatchObject({
      "@id": JSON_LD_IDS.organization,
      name: "EasyInvoicePDF",
    });

    expect(webApplication).toMatchObject({
      "@id": JSON_LD_IDS.app,
      offers: { price: "0", priceCurrency: "EUR" },
      creator: { "@id": JSON_LD_IDS.organization },
      potentialAction: {
        "@type": "UseAction",
        name: "Start Invoicing",
        target: "https://easyinvoicepdf.com/?template=default",
      },
    });

    expect(siteNavigation).toMatchObject({
      "@id": JSON_LD_IDS.siteNavigation,
    });

    expect(siteNavigation?.itemListElement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Start Invoicing",
          item: "https://easyinvoicepdf.com/?template=default",
        }),
        expect.objectContaining({
          name: "About",
          item: "https://easyinvoicepdf.com/en/about",
        }),
      ]),
    );

    expect(webPage).toMatchObject({
      "@id": "https://easyinvoicepdf.com/#webpage",
      isPartOf: { "@id": JSON_LD_IDS.website },
      mainEntity: { "@id": JSON_LD_IDS.app },
      hasPart: { "@id": JSON_LD_IDS.siteNavigation },
    });
  });
});
