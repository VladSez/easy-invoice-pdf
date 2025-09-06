import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";
import { getChangelogEntries } from "./changelog/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const changelogEntries = await getChangelogEntries();

  const sitemapEntries: MetadataRoute.Sitemap = [
    // Main app page (non-shared version)
    {
      url: `${APP_URL}`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    // About pages in all languages
    ...SUPPORTED_LANGUAGES.map((locale) => ({
      url: `${APP_URL}/${locale}/about`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    // Changelog page
    {
      url: `${APP_URL}/changelog`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    // Changelog entries
    ...changelogEntries.map((entry) => ({
      url: `${APP_URL}/changelog/${entry.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  return sitemapEntries;
}
