import { UserAgentDeviceContextProvider } from "@/contexts/device-context";

/**
 * Layout of the invoice generator itself (`/` and `/stripe-template`).
 *
 * Device detection runs in the browser (`UserAgentDeviceContextProvider`), not from the
 * request headers: reading `headers()` here made both routes render per request, and
 * they have nothing else that needs the request -- the invoice lives in `localStorage`
 * or `?data=`, both read on the client. Keeping this layout free of dynamic APIs is what
 * lets the app be prerendered and served from the CDN.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <UserAgentDeviceContextProvider>{children}</UserAgentDeviceContextProvider>
  );
}
