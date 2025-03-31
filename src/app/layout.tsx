import { NextIntlClientProvider } from "next-intl";
import { checkDeviceUserAgent } from "@/lib/check-device.server";
import { DeviceContextProvider } from "@/contexts/device-context";

import "./globals.css";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isDesktop: isDesktopServer } = await checkDeviceUserAgent();

  return (
    <html lang="en">
      <body>
        <DeviceContextProvider isDesktop={isDesktopServer}>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </DeviceContextProvider>
      </body>
    </html>
  );
}
