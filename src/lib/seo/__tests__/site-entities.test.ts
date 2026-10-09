import { describe, expect, it } from "vitest";

import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";

import { buildBreadcrumbList } from "../breadcrumb";
import { JSON_LD_IDS } from "../json-ld-ids";
import {
  buildFullWebSite,
  buildOrganization,
  buildPerson,
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

  it("names the site by its brand alone, with other spellings as alternates", () => {
    // Google reads the site name from WebSite.name and falls back to a guess when it
    // holds a title-style tagline
    const webSite = buildFullWebSite();
    expect(webSite.name).toBe("EasyInvoicePDF");
    expect(buildSlimWebSite().name).toBe(webSite.name);
    expect(webSite.alternateName).not.toContain(webSite.name);
  });

  it("gives the organization a logo of at least 112×112", () => {
    const { logo } = buildOrganization();
    expect(logo.url).toMatch(/^https:\/\//);
    expect(Number(logo.width)).toBeGreaterThanOrEqual(112);
    expect(Number(logo.height)).toBeGreaterThanOrEqual(112);
  });

  it("states the real language and currency counts in the feature list", () => {
    expect(buildWebApplication().featureList).toContain(
      `Invoices in ${SUPPORTED_INVOICE_PDF_LANGUAGES.length} languages and ${SUPPORTED_CURRENCIES.length} currencies`,
    );
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
      target: "https://easyinvoicepdf.com/",
    });
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
    const breadcrumb = buildBreadcrumbList({
      pageUrl: "https://easyinvoicepdf.com/foo",
      items: [
        { name: "Start Invoicing", item: "https://easyinvoicepdf.com/" },
        { name: "Foo" },
      ],
    });

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
