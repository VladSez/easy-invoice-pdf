import { describe, expect, it } from "vitest";

import {
  buildInvoiceAppUrl,
  getRouteTemplate,
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

  it("has no preference on a bare root route", () => {
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("data=abc"),
      }),
    ).toBeNull();

    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=unknown"),
      }),
    ).toBeNull();
  });

  it("honours a legacy ?template= on the root route", () => {
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=default"),
      }),
    ).toBe("default");

    // in case one arrives without going through the redirect
    expect(
      getTemplateFromUrl({
        pathname: "/",
        searchParams: new URLSearchParams("template=stripe"),
      }),
    ).toBe("stripe");
  });
});

describe("getRouteTemplate", () => {
  it("reads the template from the route alone", () => {
    expect(getRouteTemplate(STRIPE_TEMPLATE_PATHNAME)).toBe("stripe");
    expect(getRouteTemplate("/")).toBe("default");
  });
});

describe("buildInvoiceAppUrl", () => {
  it("puts each template on its route, without ?template=", () => {
    expect(buildInvoiceAppUrl({ template: "default" })).toBe("/");
    expect(buildInvoiceAppUrl({ template: "stripe" })).toBe(
      STRIPE_TEMPLATE_PATHNAME,
    );
  });

  it("drops a legacy ?template= and keeps the other params in order", () => {
    expect(
      buildInvoiceAppUrl({
        template: "default",
        searchParams: new URLSearchParams("template=default&data=abc&utm=x"),
      }),
    ).toBe("/?data=abc&utm=x");

    expect(
      buildInvoiceAppUrl({
        template: "stripe",
        searchParams: new URLSearchParams("template=stripe&data=abc"),
      }),
    ).toBe(`${STRIPE_TEMPLATE_PATHNAME}?data=abc`);
  });

  it("does not mutate the params it is given", () => {
    const searchParams = new URLSearchParams("template=stripe&data=abc");

    buildInvoiceAppUrl({ template: "stripe", searchParams });

    expect(searchParams.toString()).toBe("template=stripe&data=abc");
  });
});

describe("isUrlForTemplate", () => {
  it("accepts each template's route, whatever the other params", () => {
    expect(
      isUrlForTemplate({
        template: "default",
        pathname: "/",
        searchParams: new URLSearchParams("data=abc"),
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
        searchParams: new URLSearchParams(),
      }),
    ).toBe(false);
  });

  it("rejects a leftover legacy ?template=", () => {
    expect(
      isUrlForTemplate({
        template: "default",
        pathname: "/",
        searchParams: new URLSearchParams("template=default"),
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
