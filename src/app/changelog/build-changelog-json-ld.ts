import { PROD_WEBSITE_URL } from "@/config";
import type { Graph } from "schema-dts";

import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";
import { buildOrganization, OG_IMAGE_URL } from "@/lib/seo/site-entities";

import { formatChangelogDate, type ChangelogEntry } from "./utils";

const CHANGELOG_INDEX_URL = `${PROD_WEBSITE_URL}/changelog`;

export const CHANGELOG_INDEX_TITLE =
  "EasyInvoicePDF Changelog - Latest Features & Updates";

export const CHANGELOG_INDEX_DESCRIPTION =
  "See what's new in EasyInvoicePDF: Stripe templates, QR codes, and ongoing improvements to our free invoice generator.";

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
          "@id": JSON_LD_IDS.organization,
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
          "@id": JSON_LD_IDS.organization,
        },
      },
      buildOrganization(),
      buildBreadcrumbList(CHANGELOG_INDEX_URL, [
        { name: "Start Invoicing", item: `${PROD_WEBSITE_URL}/` },
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
          "@id": JSON_LD_IDS.organization,
        },
        publisher: {
          "@id": JSON_LD_IDS.organization,
        },
        image: {
          "@type": "ImageObject",
          url: OG_IMAGE_URL,
        },
      },
      buildOrganization(),
      buildBreadcrumbList(pageUrl, [
        { name: "Start Invoicing", item: `${PROD_WEBSITE_URL}/` },
        { name: "Changelog", item: CHANGELOG_INDEX_URL },
        { name: title },
      ]),
    ],
  };
}
