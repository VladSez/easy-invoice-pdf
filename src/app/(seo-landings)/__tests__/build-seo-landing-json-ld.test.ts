import { describe, expect, it } from "vitest";

import { buildSeoLandingJsonLd } from "../build-seo-landing-json-ld";
import { SEO_LANDING_DEFINITIONS } from "../seo-landing-definitions";
import { JSON_LD_IDS } from "@/lib/seo/json-ld-ids";

describe("buildSeoLandingJsonLd", () => {
  it("links no-login page mainEntity to FAQPage with account and pricing questions first", () => {
    const definition = SEO_LANDING_DEFINITIONS["invoice-generator-no-login"];
    const graph = buildSeoLandingJsonLd(definition);
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const webPage = parsed["@graph"][0];
    const faqPage = parsed["@graph"][1] as {
      mainEntity: Array<{ name: string }>;
    };

    expect(webPage).toMatchObject({
      "@type": "WebPage",
      "@id": "https://easyinvoicepdf.com/invoice-generator-no-login#webpage",
      name: "Invoice Generator With No Login or Signup Required",
      mainEntity: {
        "@id": "https://easyinvoicepdf.com/invoice-generator-no-login#faq",
      },
    });

    expect(faqPage).toMatchObject({
      "@type": "FAQPage",
      "@id": "https://easyinvoicepdf.com/invoice-generator-no-login#faq",
    });
    expect(faqPage.mainEntity[0]?.name).toBe("Do I need to create an account?");
    expect(faqPage.mainEntity[1]?.name).toBe("Is it really free?");
  });

  it("adds SoftwareApplication mainEntity for open-source landing", () => {
    const definition = SEO_LANDING_DEFINITIONS["open-source-invoice-generator"];
    const graph = buildSeoLandingJsonLd(definition);
    const parsed = JSON.parse(JSON.stringify(graph)) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const webPage = parsed["@graph"][0];
    const softwareApp = parsed["@graph"][1];
    const faqPage = parsed["@graph"][2];

    expect(webPage).toMatchObject({
      "@type": "WebPage",
      mainEntity: {
        "@id":
          "https://easyinvoicepdf.com/open-source-invoice-generator#software",
      },
    });

    expect(softwareApp).toMatchObject({
      "@type": "SoftwareApplication",
      "@id":
        "https://easyinvoicepdf.com/open-source-invoice-generator#software",
      name: "Open Source Invoice Generator (Free, No Signup) | EasyInvoicePDF",
      offers: {
        price: "0",
        priceCurrency: "EUR",
      },
      creator: { "@id": JSON_LD_IDS.organization },
    });
    expect(softwareApp).not.toHaveProperty("aggregateRating");

    expect(faqPage).toMatchObject({
      "@type": "FAQPage",
      "@id": "https://easyinvoicepdf.com/open-source-invoice-generator#faq",
    });
  });
});
