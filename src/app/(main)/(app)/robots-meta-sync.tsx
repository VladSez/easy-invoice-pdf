"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ROBOTS_META_CONTENT } from "@/lib/seo/indexing-utils";

/**
 * The meta tags Next.js emits from `Metadata.robots` on this page.
 *
 * `robots` comes from `robots.index`/`robots.follow`, `googlebot` from `robots.googleBot`.
 */
const ROBOTS_META_NAMES = ["robots", "googlebot"] as const;

/**
 * Writes `content` to every robots meta tag in the document.
 *
 * A tag Next.js did not render is created only for restrictive directives -- an absent
 * tag already means "index, follow", so there is nothing to add in the permissive case.
 *
 * @param content - The crawler directives to apply, e.g. `"noindex, nofollow"`.
 */
function applyRobotsMetaContent(content: string) {
  const isRestrictive = content === ROBOTS_META_CONTENT.nonIndexable;

  for (const name of ROBOTS_META_NAMES) {
    const existingMeta = document.querySelector(`meta[name="${name}"]`);

    if (existingMeta) {
      existingMeta.setAttribute("content", content);
      continue;
    }

    if (!isRestrictive) {
      continue;
    }

    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.append(meta);
  }
}

/**
 * Keeps the crawler directives in sync with the `?data=` share param.
 *
 * `generateMetadata` already renders `noindex, nofollow` for any request that arrives with
 * `?data=`, but sharing an invoice adds that param through `window.history.replaceState`
 * (see `replaceUrlQuery` in `page.client.tsx`) -- a deliberate, navigation-free rewrite, so
 * the server never re-renders the metadata and the document keeps whatever directives it
 * was loaded with. On production that is `index, follow`, which would let a crawler that
 * picked the shared link up index someone's invoice data.
 *
 * The tags are patched in place rather than rendered: Next already owns a `meta[name="robots"]`
 * in the document, and a second one would leave crawlers with two conflicting directives.
 *
 * @returns Nothing -- this component only writes to `document.head`.
 */
export function RobotsMetaSync({
  isIndexableEnvironment,
}: {
  /**
   * Whether this deployment is indexable at all -- i.e. the canonical production
   * deployment. Preview deployments are never indexable, with or without `?data=`.
   */
  isIndexableEnvironment: boolean;
}) {
  const searchParams = useSearchParams();
  const hasShareableData = searchParams.get("data") !== null;

  // mirrors what `generateMetadata` would render for the URL currently in the address bar,
  // in both directions -- the app drops `?data=` in place too (a corrupted link, an edit to
  // a shared invoice), and `/` on its own is the canonical page we do want indexed
  const shouldIndex = isIndexableEnvironment && !hasShareableData;

  useEffect(() => {
    applyRobotsMetaContent(
      shouldIndex
        ? ROBOTS_META_CONTENT.indexable
        : ROBOTS_META_CONTENT.nonIndexable,
    );
  }, [shouldIndex]);

  return null;
}
