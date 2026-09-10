import { DeviceContextProvider } from "@/contexts/device-context";
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
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const {
    isDesktop: isDesktopServer,
    isAndroid,
    isMobile,
    inAppInfo,
  } = await checkDeviceUserAgent();

  return (
    <DeviceContextProvider
      isDesktop={isDesktopServer}
      isAndroid={isAndroid}
      isMobile={isMobile}
      inAppInfo={inAppInfo}
    >
      {children}
    </DeviceContextProvider>
  );
}
