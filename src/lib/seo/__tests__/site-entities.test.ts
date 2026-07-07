import { describe, expect, it } from "vitest";

import { buildBreadcrumbList } from "../breadcrumb";
import { JSON_LD_IDS } from "../json-ld-ids";
import {
  buildFullWebSite,
  buildOrganization,
  buildPerson,
  buildSiteNavigationList,
  buildSiteWideJsonLdGraph,
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

  it("should link publisher to organization in buildFullWebSite", () => {
    expect(buildFullWebSite()).toMatchObject({
      "@id": JSON_LD_IDS.website,
      publisher: { "@id": JSON_LD_IDS.organization },
    });
  });

  it("should build organization with stable @id", () => {
    expect(buildOrganization()).toMatchObject({
      "@type": "Organization",
      "@id": JSON_LD_IDS.organization,
      name: "EasyInvoicePDF",
    });
  });

  it("should use real name without role suffix for buildPerson", () => {
    const person = buildPerson();
    expect(person.name).toBe("Vlad Sazonau");
    expect(person.name).not.toContain("Founder");
    expect(person.sameAs).toHaveLength(4);
  });

  it("should include offers.price 0 and Start Invoicing action in buildWebApplication", () => {
    const app = buildWebApplication();
    expect(app.offers).toMatchObject({
      price: "0",
      priceCurrency: "EUR",
    });
    expect(app).not.toHaveProperty("aggregateRating");
    expect(app.creator).toMatchObject({ "@id": JSON_LD_IDS.organization });
    expect(app.potentialAction).toMatchObject({
      name: "Start Invoicing",
      target: "https://easyinvoicepdf.com/?template=default",
    });
  });

  it("should expose primary site navigation links", () => {
    const navigation = buildSiteNavigationList();
    expect(navigation.itemListElement).toEqual(
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
  });

  it("should emit only slim WebSite in site-wide graph", () => {
    const graph = buildSiteWideJsonLdGraph();
    expect(graph["@graph"]).toHaveLength(1);
    expect(graph["@graph"][0]).toMatchObject({
      "@type": "WebSite",
      "@id": JSON_LD_IDS.website,
    });
  });
});

describe("buildBreadcrumbList", () => {
  it("should build ordered crumbs with optional last item URL", () => {
    const breadcrumb = buildBreadcrumbList("https://easyinvoicepdf.com/foo", [
      { name: "Start Invoicing", item: "https://easyinvoicepdf.com/" },
      { name: "Foo" },
    ]);

    expect(breadcrumb).toMatchObject({
      "@type": "BreadcrumbList",
      "@id": "https://easyinvoicepdf.com/foo#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Start Invoicing",
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
