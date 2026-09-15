import type { Graph } from "schema-dts";

import { GITHUB_URL, PROD_WEBSITE_URL } from "@/config";
import { buildBreadcrumbList } from "@/lib/seo/breadcrumb";
import {
  JSON_LD_IDS,
  pageBreadcrumbId,
  pageFaqId,
  pageSoftwareAppId,
  pageWebPageId,
} from "@/lib/seo/json-ld-ids";

import type { SeoLandingDefinition } from "./seo-landing-definitions";

function buildLandingSoftwareApplication(
  pageUrl: string,
  definition: SeoLandingDefinition,
) {
  return {
    "@type": "SoftwareApplication" as const,
    "@id": pageSoftwareAppId(pageUrl),
    url: pageUrl,
    name: definition.metadata.title,
    description: definition.metadata.description,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "EUR",
    },
    creator: {
      "@id": JSON_LD_IDS.organization,
    },
    sameAs: [GITHUB_URL],
  };
}

/**
 * The hero demo as a `VideoObject`.
 *
 * A clip inside a YouTube iframe is invisible to anything reading the page, so the
 * fields Google requires for video rich results (`name`, `description`, `thumbnailUrl`,
 * `uploadDate`) are declared here instead.
 *
 * `embedUrl` carries the clip on its own. Its alternative, `contentUrl`, wants the video
 * file's actual content bytes and comes with an explicit "don't link to the page where
 * the video lives" — so a `watch?v=` URL is the one thing it must not be, and YouTube
 * offers nothing else to put there. Google asks for either one, not both.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/video
 */
function buildLandingVideo(
  pageUrl: string,
  heroVideo: NonNullable<SeoLandingDefinition["hero"]["heroVideo"]>,
) {
  return {
    "@type": "VideoObject" as const,
    name: heroVideo.title,
    description: heroVideo.description,
    thumbnailUrl: heroVideo.thumbnailUrl,
    uploadDate: heroVideo.uploadDate,
    embedUrl: heroVideo.embedUrl,
    isPartOf: {
      "@id": pageWebPageId(pageUrl),
    },
  };
}

export function buildSeoLandingJsonLd(
  definition: SeoLandingDefinition,
  baseUrl = PROD_WEBSITE_URL,
): Graph {
  const pageUrl = `${baseUrl}/${definition.slug}` as const;
  const faqUrl = pageFaqId(pageUrl);
  const isOpenSourceLanding =
    definition.slug === "open-source-invoice-generator";

  const faqEntities = definition.faq.map((item) => {
    return {
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: item.answer,
      },
    };
  });

  const webPage = {
    "@type": "WebPage" as const,
    "@id": pageWebPageId(pageUrl),
    url: pageUrl,
    name: definition.metadata.title,
    description: definition.metadata.description,
    inLanguage: "en",
    isPartOf: {
      "@id": JSON_LD_IDS.website,
    },
    breadcrumb: {
      "@id": pageBreadcrumbId(pageUrl),
    },
    mainEntity: {
      "@id": isOpenSourceLanding ? pageSoftwareAppId(pageUrl) : faqUrl,
    },
  };

  const faqPage = {
    "@type": "FAQPage" as const,
    "@id": faqUrl,
    mainEntity: faqEntities,
  };

  const breadcrumb = buildBreadcrumbList(pageUrl, [
    { name: "Start Invoicing", item: `${baseUrl}/` },
    { name: definition.metadata.title },
  ]);

  const heroVideo = definition.hero.heroVideo;

  const graph = [
    webPage,
    ...(isOpenSourceLanding
      ? [buildLandingSoftwareApplication(pageUrl, definition)]
      : []),
    faqPage,
    ...(heroVideo ? [buildLandingVideo(pageUrl, heroVideo)] : []),
    breadcrumb,
  ];

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
