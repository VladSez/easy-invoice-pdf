"use server";

import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

/**
 * Check the device type based on the user agent
 * @warning **Should only be used on server side**
 */
export const checkDeviceUserAgent = async () => {
  if (typeof process === "undefined") {
    throw new Error(
      "[Server method] you are importing a server-only module outside of server"
    );
  }

  const { get } = headers();
  const ua = get("user-agent");

  const parser = new UAParser(ua || "");

  const device = parser.getDevice();
  const os = parser.getOS();

  // Detect tablets specifically
  const isTablet =
    device.type === "tablet" ||
    // iPad on iOS 13+ reports as desktop
    (os.name === "iOS" && !ua?.includes("iPhone") && !ua?.includes("iPod"));

  // Detect mobile phones
  const isMobile = device.type === "mobile";

  // Desktop is when it's neither tablet nor mobile
  const isDesktop = !isTablet && !isMobile;

  return { isDesktop };
};
