import { describe, expect, it } from "vitest";

import { buildHomeJsonLdGraph } from "../../../app/(app)/home-json-ld";
import { JSON_LD_IDS } from "../json-ld-ids";

describe("buildHomeJsonLdGraph", () => {
  it("includes full WebSite, WebApplication, and WebPage linked by @id", () => {
    const graph = buildHomeJsonLdGraph();
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };

    expect(parsed["@graph"]).toHaveLength(3);
    expect(parsed["@graph"][0]).toMatchObject({
      "@type": "WebSite",
      "@id": JSON_LD_IDS.website,
      publisher: { "@id": JSON_LD_IDS.person },
    });
    expect(parsed["@graph"][1]).toMatchObject({
      "@type": "WebApplication",
      "@id": JSON_LD_IDS.app,
      offers: { price: "0", priceCurrency: "EUR" },
    });
    expect(parsed["@graph"][2]).toMatchObject({
      "@type": "WebPage",
      "@id": "https://easyinvoicepdf.com/#webpage",
      isPartOf: { "@id": JSON_LD_IDS.website },
      mainEntity: { "@id": JSON_LD_IDS.app },
    });
  });
});
