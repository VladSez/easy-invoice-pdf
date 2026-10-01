import type { SupportedTemplates } from "@/app/schema";

/**
 * The `<h1>` of each invoice app route, shown as the tagline under the EasyInvoicePDF logo.
 *
 * The brand name above it is a `<p>`: an h1 of "EasyInvoicePDF" told search engines
 * nothing the domain didn't, while the tagline names what the page is. Rendered by both
 * the loading skeleton (the only header in the prerendered HTML, since the editor renders
 * on the client) and the editor's own header, which replaces it -- so the page always has
 * exactly one h1.
 *
 * Kept outside the "use client" header module so the server-rendered skeleton can import
 * the strings themselves rather than client references.
 */
export const APP_PAGE_HEADING = {
  default: "Free & Open-Source Invoice Generator",
  stripe: "Free Stripe Invoice Template",
} as const satisfies Record<SupportedTemplates, string>;
