import { PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";
import { OG_IMAGE_URL } from "@/lib/seo/site-entities";

import { formatChangelogDate, type ChangelogEntry } from "./utils";

const CHANGELOG_INDEX_URL = `${PROD_WEBSITE_URL}/changelog`;

const CHANGELOG_INDEX_TITLE =
  "Changelog | EasyInvoicePDF - Free Invoice PDF Generator";

const CHANGELOG_INDEX_DESCRIPTION =
  "Explore the latest updates, new features, and improvements to EasyInvoicePDF.com - the free, open-source invoice generator.";

export function buildChangelogIndexJsonLdGraph(
  latestDateModified: string | null,
): Graph {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": pageWebPageId(CHANGELOG_INDEX_URL),
        url: CHANGELOG_INDEX_URL,
        name: CHANGELOG_INDEX_TITLE,
        description: CHANGELOG_INDEX_DESCRIPTION,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        breadcrumb: {
          "@id": pageBreadcrumbId(CHANGELOG_INDEX_URL),
        },
        about: {
          "@id": JSON_LD_IDS.person,
        },
      },
      {
        "@type": "Blog",
        "@id": JSON_LD_IDS.blog,
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        mainEntityOfPage: {
          "@id": pageWebPageId(CHANGELOG_INDEX_URL),
        },
        name: "EasyInvoicePDF Changelog",
        description: CHANGELOG_INDEX_DESCRIPTION,
        inLanguage: "en",
        ...(latestDateModified ? { dateModified: latestDateModified } : {}),
        publisher: {
          "@id": JSON_LD_IDS.person,
        },
      },
      buildBreadcrumbList(CHANGELOG_INDEX_URL, [
        { name: "Home", item: `${PROD_WEBSITE_URL}/` },
        { name: "Changelog" },
      ]),
    ],
  };
}

export function buildChangelogPostJsonLdGraph(entry: ChangelogEntry): Graph {
  const pageUrl = `${PROD_WEBSITE_URL}/changelog/${entry.slug}`;
  const title =
    entry.metadata.title ||
    `Update ${formatChangelogDate(entry.metadata.date)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageWebPageId(pageUrl),
        url: pageUrl,
        name: title,
        description: entry.metadata.description,
        inLanguage: "en",
        isPartOf: {
          "@id": JSON_LD_IDS.website,
        },
        breadcrumb: {
          "@id": pageBreadcrumbId(pageUrl),
        },
      },
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#blogposting`,
        url: pageUrl,
        headline: title,
        description: entry.metadata.description,
        datePublished: entry.metadata.date,
        dateModified: entry.metadata.date,
        mainEntityOfPage: {
          "@id": pageWebPageId(pageUrl),
        },
        isPartOf: {
          "@id": JSON_LD_IDS.blog,
        },
        author: {
          "@id": JSON_LD_IDS.person,
        },
        publisher: {
          "@id": JSON_LD_IDS.person,
        },
        image: {
          "@type": "ImageObject",
          url: OG_IMAGE_URL,
        },
      },
      buildBreadcrumbList(pageUrl, [
        { name: "Home", item: `${PROD_WEBSITE_URL}/` },
        { name: "Changelog", item: CHANGELOG_INDEX_URL },
        { name: title },
      ]),
    ],
  };
}
