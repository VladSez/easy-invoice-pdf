import { SUPPORTED_TEMPLATES, type SupportedTemplates } from "@/app/schema";

/**
 * The Stripe template has its own route, so it is prerendered with its own title,
 * canonical URL and OG image. The default template lives at `/` and keeps the
 * `?template=default` param it has always had.
 *
 * Legacy `/?template=stripe` links are permanently redirected here (`next.config.mjs`).
 */
export const STRIPE_TEMPLATE_PATHNAME = "/stripe-template";

interface GetTemplateFromUrlParams {
  /** The current pathname, e.g. `usePathname()`. */
  pathname: string;
  /** The current query string. */
  searchParams: Pick<URLSearchParams, "get">;
}

/**
 * Reads the invoice template the URL asks for.
 *
 * The route wins over the query: `/stripe-template` is always the Stripe template. On `/`
 * the `?template=` param decides, and without one the URL expresses no preference.
 *
 * @returns The requested template, or `null` when the URL does not ask for one.
 */
export function getTemplateFromUrl({
  pathname,
  searchParams,
}: GetTemplateFromUrlParams): SupportedTemplates | null {
  if (pathname === STRIPE_TEMPLATE_PATHNAME) {
    return "stripe";
  }

  const templateParam = searchParams.get("template");

  return (
    SUPPORTED_TEMPLATES.find((template) => {
      return template === templateParam;
    }) ?? null
  );
}

interface IsUrlForTemplateParams extends GetTemplateFromUrlParams {
  /** The template the URL should open. */
  template: SupportedTemplates;
  searchParams: Pick<URLSearchParams, "get" | "has">;
}

/**
 * Whether the URL is already in the canonical shape `buildInvoiceAppUrl` produces for
 * `template` -- the right route, and `?template=` only (and exactly) where it belongs.
 * Other params are not looked at.
 *
 * @returns `true` when nothing about the template needs rewriting.
 */
export function isUrlForTemplate({
  template,
  pathname,
  searchParams,
}: IsUrlForTemplateParams): boolean {
  if (template === "stripe") {
    return (
      pathname === STRIPE_TEMPLATE_PATHNAME && !searchParams.has("template")
    );
  }

  return pathname === "/" && searchParams.get("template") === template;
}

interface BuildInvoiceAppUrlParams {
  /** The template the URL should open. */
  template: SupportedTemplates;
  /** Query params to keep (`?data=`, utm tags, ...). Not mutated. */
  searchParams?: URLSearchParams;
}

/**
 * Builds the root-relative URL of the invoice app for a template, e.g.
 * `/?template=default&data=...` or `/stripe-template?data=...`.
 *
 * `?template=` is only kept on `/`: on `/stripe-template` the route already says it.
 *
 * @returns The pathname plus query string.
 */
export function buildInvoiceAppUrl({
  template,
  searchParams,
}: BuildInvoiceAppUrlParams): string {
  const params = new URLSearchParams(searchParams);

  if (template === "stripe") {
    params.delete("template");
  } else {
    params.set("template", template);
  }

  const pathname = template === "stripe" ? STRIPE_TEMPLATE_PATHNAME : "/";
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}
