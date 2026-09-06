import type { Metadata, Viewport } from "next";

import {
  RootDocument,
  rootMetadata,
  rootViewport,
} from "@/app/(components)/root-document";
import { routing } from "@/i18n/routing";

export const viewport: Viewport = rootViewport;

export const metadata: Metadata = rootMetadata;

/**
 * Root layout of the unprefixed routes (`/`, `/changelog`, `/tos`, ...), which are
 * only served in the default locale. The localized pages have their own root
 * layout in `src/app/[locale]/layout.tsx`.
 */
export default function MainRootLayout({ children }: LayoutProps<"/">) {
  return <RootDocument lang={routing.defaultLocale}>{children}</RootDocument>;
}
