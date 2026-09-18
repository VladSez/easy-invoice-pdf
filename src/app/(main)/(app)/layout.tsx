import { ClerkProvider } from "@clerk/nextjs";

import { clerkLocalization } from "@/components/auth/clerk-localization";
import { DeviceContextProvider } from "@/contexts/device-context";
import { sendInvoiceFlag } from "@/flags";
import { checkDeviceUserAgent } from "@/lib/check-device.server";

/**
 * Layout of the invoice generator itself (`/`).
 *
 * Server-side device detection lives here rather than in the shared root document
 * (`src/app/(components)/root-document.tsx`): `checkDeviceUserAgent()` reads
 * `headers()`, and from the root that made *every* route request-bound — which is
 * why the marketing pages all needed `export const dynamic = "force-static"` to stay
 * prerendered. `useDeviceContext()` is only consumed under this route group, and `/`
 * is rendered per request anyway (`page.tsx` reads `searchParams`), so nothing is
 * lost by scoping the header read to it.
 *
 * Clerk is mounted here too, and only when there is something to authenticate.
 * Most people who open the invoice editor never sign in — the product works
 * without an account — so mounting the provider unconditionally would fetch and
 * run Clerk's script for all of them. It is gated on the same flag as the feature
 * itself, and sits here rather than in the root layout so the statically rendered
 * SEO pages never load Clerk at all.
 *
 * Reading the flag here is free: this group holds a single route, `/`, which is
 * already server-rendered on demand. The layout and the page it wraps render in
 * the same pass against the same evaluation, so the provider cannot be missing
 * while the Send UI is showing.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [
    { isDesktop: isDesktopServer, isAndroid, isMobile, inAppInfo },
    isSendInvoiceEnabled,
  ] = await Promise.all([checkDeviceUserAgent(), sendInvoiceFlag()]);

  return (
    <DeviceContextProvider
      isDesktop={isDesktopServer}
      isAndroid={isAndroid}
      isMobile={isMobile}
      inAppInfo={inAppInfo}
    >
      {isSendInvoiceEnabled ? (
        <ClerkProvider localization={clerkLocalization}>
          {children}
        </ClerkProvider>
      ) : (
        children
      )}
    </DeviceContextProvider>
  );
}
