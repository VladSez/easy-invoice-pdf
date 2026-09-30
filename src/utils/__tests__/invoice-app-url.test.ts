import { describe, expect, it } from "vitest";

import {
  buildInvoiceAppUrl,
  getTemplateFromUrl,
  isUrlForTemplate,
  STRIPE_TEMPLATE_PATHNAME,
} from "../invoice-app-url";

describe("getTemplateFromUrl", () => {
  it("reads the Stripe template from its route, whatever the query says", () => {
    expect(
      getTemplateFromUrl({
        pathname: STRIPE_TEMPLATE_PATHNAME,
        searchParams: new URLSearchParams("template=default"),
      }),
    ).toBe("stripe");
  });

  it("reads ?template= on the root route", () => {
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=default"),
      }),
    ).toBe("default");

    // legacy links, in case one arrives without going through the redirect
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=stripe"),
      }),
    ).toBe("stripe");
  });

  it("returns null when the URL has no (valid) template", () => {
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams(),
      }),
    ).toBeNull();

    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=unknown"),
      }),
    ).toBeNull();
  });
});

describe("buildInvoiceAppUrl", () => {
  it("keeps ?template=default on the root route", () => {
    expect(buildInvoiceAppUrl({ template: "default" })).toBe(
      "/?template=default",
    );
  });

  it("puts the Stripe template on its own route without ?template=", () => {
    expect(buildInvoiceAppUrl({ template: "stripe" })).toBe(
      STRIPE_TEMPLATE_PATHNAME,
    );

    expect(
      buildInvoiceAppUrl({
        template: "stripe",
        searchParams: new URLSearchParams("template=stripe&data=abc"),
      }),
    ).toBe(`${STRIPE_TEMPLATE_PATHNAME}?data=abc`);
  });

  it("keeps the other params and their order", () => {
    expect(
      buildInvoiceAppUrl({
        template: "default",
        searchParams: new URLSearchParams("template=stripe&data=abc&utm=x"),
      }),
    ).toBe("/?template=default&data=abc&utm=x");

    expect(
      buildInvoiceAppUrl({
        template: "default",
        searchParams: new URLSearchParams("data=abc"),
      }),
    ).toBe("/?data=abc&template=default");
  });

  it("does not mutate the params it is given", () => {
    const searchParams = new URLSearchParams("template=stripe&data=abc");

    buildInvoiceAppUrl({ template: "stripe", searchParams });

    expect(searchParams.toString()).toBe("template=stripe&data=abc");
  });
});

describe("isUrlForTemplate", () => {
  it("accepts the canonical URL of each template, whatever the other params", () => {
    expect(
      isUrlForTemplate({
        template: "default",
        pathname: "/",
        searchParams: new URLSearchParams("template=default&data=abc"),
      }),
    ).toBe(true);

    expect(
      isUrlForTemplate({
        template: "stripe",
        pathname: STRIPE_TEMPLATE_PATHNAME,
        searchParams: new URLSearchParams("data=abc"),
      }),
    ).toBe(true);
  });

  it("rejects the wrong route", () => {
    expect(
      isUrlForTemplate({
        template: "stripe",
        pathname: "/",
        searchParams: new URLSearchParams(),
      }),
    ).toBe(false);

    expect(
      isUrlForTemplate({
        template: "default",
        pathname: STRIPE_TEMPLATE_PATHNAME,
        searchParams: new URLSearchParams("template=default"),
      }),
    ).toBe(false);
  });

  it("rejects a missing, wrong or redundant ?template=", () => {
    expect(
      isUrlForTemplate({
        template: "default",
        pathname: "/",
        searchParams: new URLSearchParams(),
      }),
    ).toBe(false);

    expect(
      isUrlForTemplate({
        template: "default",
        pathname: "/",
        searchParams: new URLSearchParams("template=stripe"),
      }),
    ).toBe(false);

    expect(
      isUrlForTemplate({
        template: "stripe",
        pathname: STRIPE_TEMPLATE_PATHNAME,
        searchParams: new URLSearchParams("template=stripe"),
      }),
    ).toBe(false);
  });
});
