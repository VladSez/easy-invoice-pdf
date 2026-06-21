import { describe, expect, it } from "vitest";

import {
  buildChangelogIndexJsonLdGraph,
  buildChangelogPostJsonLdGraph,
} from "../../../app/changelog/build-changelog-json-ld";
import { JSON_LD_IDS } from "../json-ld-ids";

describe("buildChangelogIndexJsonLdGraph", () => {
  it("includes CollectionPage, Blog, and BreadcrumbList", () => {
    const graph = buildChangelogIndexJsonLdGraph("2026-01-15");
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const nodes = parsed["@graph"];

    expect(nodes[0]).toMatchObject({
      "@type": "CollectionPage",
      "@id": "https://easyinvoicepdf.com/changelog#webpage",
      isPartOf: { "@id": JSON_LD_IDS.website },
      about: { "@id": JSON_LD_IDS.person },
    });

    expect(nodes[1]).toMatchObject({
      "@type": "Blog",
      "@id": JSON_LD_IDS.blog,
      dateModified: "2026-01-15",
      publisher: { "@id": JSON_LD_IDS.person },
    });

    expect(nodes[2]).toMatchObject({
      "@type": "BreadcrumbList",
      "@id": "https://easyinvoicepdf.com/changelog#breadcrumb",
    });
  });
});

describe("buildChangelogPostJsonLdGraph", () => {
  it("links BlogPosting to blog and person", () => {
    const graph = buildChangelogPostJsonLdGraph({
      slug: "test-release",
      metadata: {
        title: "Test Release",
        description: "A test changelog entry.",
        date: "2026-02-01",
        version: "1.0.0",
      },
      Component: () => null,
    });

    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const blogPosting = parsed["@graph"][1];

    expect(blogPosting).toMatchObject({
      "@type": "BlogPosting",
      "@id": "https://easyinvoicepdf.com/changelog/test-release#blogposting",
      headline: "Test Release",
      datePublished: "2026-02-01",
      author: { "@id": JSON_LD_IDS.person },
      publisher: { "@id": JSON_LD_IDS.person },
      isPartOf: { "@id": JSON_LD_IDS.blog },
    });

    expect(blogPosting).not.toHaveProperty("aggregateRating");
  });
});
