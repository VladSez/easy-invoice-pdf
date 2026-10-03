import type { BreadcrumbList } from "schema-dts";

import { pageBreadcrumbId } from "./json-ld-ids";

interface BreadcrumbItem {
  name: string;
  /** Omit for the current page (last crumb). */
  item?: string;
}

interface BuildBreadcrumbListParams {
  /** Absolute URL of the page the trail belongs to; its `#breadcrumb` is the node's `@id`. */
  pageUrl: string;
  /** The crumbs, from the site root down to the current page. */
  items: BreadcrumbItem[];
}

export function buildBreadcrumbList({
  pageUrl,
  items,
}: BuildBreadcrumbListParams): BreadcrumbList {
  return {
    "@type": "BreadcrumbList",
    "@id": pageBreadcrumbId(pageUrl),
    itemListElement: items.map((crumb, index) => {
      return {
        "@type": "ListItem" as const,
        position: index + 1,
        name: crumb.name,
        ...(crumb.item ? { item: crumb.item } : {}),
      };
    }),
  };
}
