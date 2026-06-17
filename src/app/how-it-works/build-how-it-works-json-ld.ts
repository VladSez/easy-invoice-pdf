import { APP_URL, HOW_IT_WORKS_VIDEOS } from "@/config";
import type { Graph } from "schema-dts";

export function buildHowItWorksJsonLd(baseUrl = APP_URL): Graph {
  const pageUrl = `${baseUrl}/how-it-works` as const;

  const videoItems = HOW_IT_WORKS_VIDEOS.map((video, index) => ({
    "@type": "ListItem" as const,
    position: index + 1,
    item: {
      "@type": "VideoObject" as const,
      name: video.title,
      description: video.description,
      embedUrl: video.embedUrl,
      contentUrl: video.watchUrl,
      url: `${pageUrl}#${video.id}`,
      publisher: {
        "@type": "Organization" as const,
        name: "EasyInvoicePDF",
        url: baseUrl,
      },
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: "How EasyInvoicePDF Works | Video Tutorials",
        description:
          "Watch step-by-step video tutorials on creating invoices, saving seller and buyer details, and generating weekly invoices with EasyInvoicePDF.",
        mainEntity: {
          "@type": "ItemList",
          "@id": `${pageUrl}#tutorials`,
          name: "EasyInvoicePDF video tutorials",
          itemListElement: videoItems,
        },
      },
    ],
  };
}
