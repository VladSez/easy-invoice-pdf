import { describe, expect, it } from "vitest";

import { HOW_IT_WORKS_VIDEOS } from "@/config";

import { buildHowItWorksJsonLd } from "./build-how-it-works-json-ld";

describe("buildHowItWorksJsonLd", () => {
  it("includes Google's required video rich-result fields for every tutorial", () => {
    const serializedGraph = JSON.stringify(buildHowItWorksJsonLd());
    const graph = JSON.parse(serializedGraph) as {
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
            duration?: string;
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
      expect(item.duration).toMatch(/^PT(\d+M)?\d+S$/);
    });
  });

  it("writes durations as ISO 8601", () => {
    const graph = buildHowItWorksJsonLd() as unknown as {
      "@graph": Array<Record<string, unknown>>;
    };
    const webPage = graph["@graph"].find((node) => {
      return node["@type"] === "WebPage";
    }) as {
      mainEntity: { itemListElement: Array<{ item: { duration: string } }> };
    };
    const durations = webPage.mainEntity.itemListElement.map(({ item }) => {
      return item.duration;
    });

    // 70s overview and 19s tax tutorial: a minute part, and none under a minute
    expect(durations[0]).toBe("PT1M10S");
    expect(durations[4]).toBe("PT19S");
  });
});
