/**
 * The paid dashboard lives on its own origin (`app.easyinvoicepdf.com`), never on the free
 * app's, so `/dashboard` here is only a memorable entry point that redirects there.
 *
 * Returns no rules when no dashboard URL is configured, so forks and self-hosted copies
 * keep treating `/dashboard` like any other unknown path.
 *
 * Next.js keeps the query string on redirects, so `/dashboard/invoices?status=draft` lands
 * on `<dashboard>/invoices?status=draft`.
 */
export function getDashboardRedirects(dashboardUrl: string | undefined) {
  if (!dashboardUrl) {
    return [];
  }

  const origin = dashboardUrl.replace(/\/+$/, "");

  return [
    {
      // `:path*` also matches zero segments, so this covers `/dashboard` itself
      source: "/dashboard/:path*",
      destination: `${origin}/:path*`,
      permanent: true,
    },
  ];
}
