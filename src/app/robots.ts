import { type MetadataRoute } from "next";

import { APP_URL } from "@/config";
import { STRIPE_TEMPLATE_PATHNAME } from "@/utils/invoice-app-url";

import { SUPPORTED_I18N_LOCALES } from "./schema";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          // Allow main app page (now at /)
          "/",
          // Allow about pages in all languages
          ...SUPPORTED_I18N_LOCALES.map((locale) => {
            return `/${locale}/about`;
          }),
          // Allow template parameter URLs
          "/?template=*",
          // Allow the Stripe template variant of the app
          STRIPE_TEMPLATE_PATHNAME,
          // Allow changelog pages
          "/changelog",
          "/changelog/*",
          // Allow how it works page
          "/how-it-works",
          // Allow terms of service page
          "/tos",
          // Allow founder page
          "/founder",
          // SEO landing pages
          "/invoice-generator-no-login",
          "/open-source-invoice-generator",
          "/stripe-invoice-alternative",
          "/invoice-template-pdf",
        ],
        disallow: [
          // Disallow shared invoice URLs, like /?data=*
          "/?*data=*",
          "/?template=*&data=*",
          "/?data=*&template=*",
          `${STRIPE_TEMPLATE_PATHNAME}?*data=*`,
          // Disallow subscription confirmation pages with and without tokens
          "/confirm-subscription",
          "/confirm-subscription?*",
          // Disallow favicon and other icon files from being indexed
          "/favicon.ico",
          "/*.ico$",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
