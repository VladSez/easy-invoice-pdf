import type { BreadcrumbList } from "schema-dts";

import { pageBreadcrumbId } from "./json-ld-ids";

interface BreadcrumbItem {
  name: string;
  /** Omit for the current page (last crumb). */
  item?: string;
}

export function buildBreadcrumbList(
  pageUrl: string,
  items: BreadcrumbItem[],
): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    "@id": pageBreadcrumbId(pageUrl),
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}
