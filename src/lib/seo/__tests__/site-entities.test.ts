import { describe, expect, it } from "vitest";

import { buildBreadcrumbList } from "../breadcrumb";
import { JSON_LD_IDS } from "../json-ld-ids";
import {
  buildFullWebSite,
  buildPerson,
  buildSlimWebSite,
  buildWebApplication,
} from "../site-entities";

describe("site-entities", () => {
  it("should use stable website @id for buildSlimWebSite", () => {
    expect(buildSlimWebSite()).toMatchObject({
      "@type": "WebSite",
      "@id": JSON_LD_IDS.website,
      url: "https://easyinvoicepdf.com/",
    });
  });

  it("should link publisher to person in buildFullWebSite", () => {
    expect(buildFullWebSite()).toMatchObject({
      "@id": JSON_LD_IDS.website,
      publisher: { "@id": JSON_LD_IDS.person },
    });
  });

  it("should use real name without role suffix for buildPerson", () => {
    const person = buildPerson();
    expect(person.name).toBe("Vlad Sazonau");
    expect(person.name).not.toContain("Founder");
    expect(person.sameAs).toHaveLength(4);
  });

  it("should include offers.price 0 and no aggregateRating in buildWebApplication", () => {
    const app = buildWebApplication();
    expect(app.offers).toMatchObject({
      price: "0",
      priceCurrency: "EUR",
    });
    expect(app).not.toHaveProperty("aggregateRating");
    expect(app.creator).toMatchObject({ "@id": JSON_LD_IDS.person });
  });
});

describe("buildBreadcrumbList", () => {
  it("should build ordered crumbs with optional last item URL", () => {
    const breadcrumb = buildBreadcrumbList("https://easyinvoicepdf.com/foo", [
      { name: "Home", item: "https://easyinvoicepdf.com/" },
      { name: "Foo" },
    ]);

    expect(breadcrumb).toMatchObject({
      "@type": "BreadcrumbList",
      "@id": "https://easyinvoicepdf.com/foo#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://easyinvoicepdf.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Foo",
        },
      ],
    });
  });
});
