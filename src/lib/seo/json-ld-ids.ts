import { PROD_WEBSITE_URL } from "@/config";

/**
 * Stable @id fragments for JSON-LD cross-linking.
 *
 * Validate after deploy (Rich Results Test):
 * - https://easyinvoicepdf.com/
 * - https://easyinvoicepdf.com/en/about
 * - https://easyinvoicepdf.com/how-it-works
 * - https://easyinvoicepdf.com/changelog
 * - https://easyinvoicepdf.com/changelog/{latest-slug}
 * - https://easyinvoicepdf.com/founder
 * - https://easyinvoicepdf.com/{seo-landing-slug}
 */
export const JSON_LD_BASE = PROD_WEBSITE_URL;

export const JSON_LD_IDS = {
  website: `${JSON_LD_BASE}/#website`,
  person: `${JSON_LD_BASE}/#person`,
  personImage: `${JSON_LD_BASE}/#person-image`,
  websiteImage: `${JSON_LD_BASE}/#website-image`,
  app: `${JSON_LD_BASE}/#app`,
  blog: `${JSON_LD_BASE}/changelog/#blog`,
} as const;

export function pageWebPageId(url: string) {
  return `${url}#webpage`;
}

export function pageBreadcrumbId(url: string) {
  return `${url}#breadcrumb`;
}

export function pageFaqId(url: string) {
  return `${url}#faq`;
}
