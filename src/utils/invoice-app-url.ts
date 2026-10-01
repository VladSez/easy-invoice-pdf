import { SUPPORTED_TEMPLATES, type SupportedTemplates } from "@/app/schema";

/**
 * The Stripe template has its own route, so it is prerendered with its own title,
 * canonical URL and OG image. The default template lives at `/`.
 *
 * A bare `/` also means "the app, with whatever template I used last": a visitor whose
 * saved invoice uses Stripe is moved on to `/stripe-template`. Only `/stripe-template`
 * asks for a template explicitly.
 *
 * Legacy links still work: `/?template=stripe` is permanently redirected here
 * (`next.config.mjs`), and `/?template=default` is honoured once and then dropped from
 * the address bar.
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
 * only a legacy `?template=` param asks for one; a bare `/` expresses no preference.
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

/**
 * The template of the route itself, ignoring any query string: the route a template
 * switch moves away from or to.
 *
 * @param pathname - The current pathname.
 * @returns `stripe` on `/stripe-template`, `default` anywhere else.
 */
export function getRouteTemplate(pathname: string): SupportedTemplates {
  return pathname === STRIPE_TEMPLATE_PATHNAME ? "stripe" : "default";
}

interface IsUrlForTemplateParams extends GetTemplateFromUrlParams {
  /** The template the URL should open. */
  template: SupportedTemplates;
  searchParams: Pick<URLSearchParams, "get" | "has">;
}

/**
 * Whether the URL is already in the canonical shape `buildInvoiceAppUrl` produces for
 * `template` -- the template's route, without a (legacy) `?template=` param. Other
 * params are not looked at.
 *
 * @returns `true` when nothing about the template needs rewriting.
 */
export function isUrlForTemplate({
  template,
  pathname,
  searchParams,
}: IsUrlForTemplateParams): boolean {
  return (
    pathname === TEMPLATE_PATHNAMES[template] && !searchParams.has("template")
  );
}

interface BuildInvoiceAppUrlParams {
  /** The template the URL should open. */
  template: SupportedTemplates;
  /** Query params to keep (`?data=`, utm tags, ...). Not mutated. */
  searchParams?: URLSearchParams;
}

/**
 * Builds the root-relative URL of the invoice app for a template, e.g. `/?data=...` or
 * `/stripe-template?data=...`. A legacy `?template=` param is dropped: the route says
 * which template it is.
 *
 * @returns The pathname plus query string.
 */
export function buildInvoiceAppUrl({
  template,
  searchParams,
}: BuildInvoiceAppUrlParams): string {
  const params = new URLSearchParams(searchParams);
  params.delete("template");

  const pathname = TEMPLATE_PATHNAMES[template];
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

/** The route each template lives at. */
const TEMPLATE_PATHNAMES = {
  default: "/",
  stripe: STRIPE_TEMPLATE_PATHNAME,
} as const satisfies Record<SupportedTemplates, string>;
