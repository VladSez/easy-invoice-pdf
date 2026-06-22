import { PROD_WEBSITE_URL } from "@/config";

/**
 * Determine indexing-related flags from request search parameters and environment.
 *
 * @param searchParams - Query params from request URL.
 * @returns Object with:
 *   hasShareableData: Whether query contains 'data' parameter (shareable invoice).
 *   isProd: True if running on canonical production deployment.
 *   shouldIndex: True if page should be indexed (prod, no share data).
 */
export function computeIndexingFlags(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const hasShareableData = Boolean(searchParams?.data);

  const isProd =
    process.env.VERCEL_ENV === "production" &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` === PROD_WEBSITE_URL;
  const shouldIndex = isProd && !hasShareableData;

  return { hasShareableData, isProd, shouldIndex };
}
