import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";

import {
  RootDocument,
  rootMetadata,
  rootViewport,
} from "@/app/(components)/root-document";
import { routing } from "@/i18n/routing";

export const viewport: Viewport = rootViewport;

export const metadata: Metadata = rootMetadata;

// statically generate the pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => {
    return { locale };
  });
}

/**
 * Root layout of the localized routes.
 *
 * It must be a *root* layout (nothing above it) so that `locale` is a root param:
 * `src/i18n/request.ts` reads it through `next/root-params`, which is what lets
 * every Server Component below call `useLocale()`/`getTranslations()` without
 * `setRequestLocale()`. Unknown values (`/xx/about`) resolve to the default locale
 * here; the `about` layout is what turns them into a 404.
 */
export default async function LocaleRootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return <RootDocument lang={locale}>{children}</RootDocument>;
}
