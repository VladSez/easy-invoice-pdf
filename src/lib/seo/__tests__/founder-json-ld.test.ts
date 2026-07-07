import { describe, expect, it } from "vitest";

import { buildFounderJsonLdGraph } from "../../../app/founder/build-founder-json-ld";
import { JSON_LD_IDS } from "../json-ld-ids";

describe("buildFounderJsonLdGraph", () => {
  it("includes Person entity and ProfilePage with mainEntity pointing to person", () => {
    const graph = buildFounderJsonLdGraph();
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };

    expect(parsed["@graph"][0]).toMatchObject({
      "@type": "Person",
      "@id": JSON_LD_IDS.person,
      name: "Vlad Sazonau",
    });

    expect(parsed["@graph"][1]).toMatchObject({
      "@type": "ProfilePage",
      "@id": "https://easyinvoicepdf.com/founder#webpage",
      isPartOf: { "@id": JSON_LD_IDS.website },
      mainEntity: { "@id": JSON_LD_IDS.person },
    });
  });
});
