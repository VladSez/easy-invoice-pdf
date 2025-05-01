import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().split("T")[0];

  const sitemapEntries: MetadataRoute.Sitemap = [
    // Main app page (non-shared version)
    {
      url: `${APP_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },

    // About pages in all languages
    ...SUPPORTED_LANGUAGES.map((locale) => ({
      url: `${APP_URL}/${locale}/about`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
    })),
  ];

  return sitemapEntries;
}
