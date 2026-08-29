import { describe, expect, it } from "vitest";

import { HOW_IT_WORKS_VIDEOS } from "@/config";

import { buildHowItWorksJsonLd } from "./build-how-it-works-json-ld";

describe("buildHowItWorksJsonLd", () => {
  it("includes Google's required video rich-result fields for every tutorial", () => {
    const graph = JSON.parse(JSON.stringify(buildHowItWorksJsonLd())) as {
      "@graph": Array<Record<string, unknown>>;
    };

    const webPage = graph["@graph"].find((node) => {
      return node["@type"] === "WebPage";
    }) as {
      mainEntity: {
        itemListElement: Array<{
          item: {
            uploadDate?: string;
            thumbnailUrl?: string;
          };
        }>;
      };
    };

    expect(webPage.mainEntity.itemListElement).toHaveLength(
      HOW_IT_WORKS_VIDEOS.length,
    );

    webPage.mainEntity.itemListElement.forEach(({ item }, index) => {
      expect(item.uploadDate).toBe(HOW_IT_WORKS_VIDEOS[index].uploadDate);
      expect(item.thumbnailUrl).toBe(HOW_IT_WORKS_VIDEOS[index].thumbnailUrl);
    });
  });
});
