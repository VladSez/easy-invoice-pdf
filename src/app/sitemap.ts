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
      url: `${APP_URL}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    // About pages in all languages
    {
      url: `${APP_URL}/en/about`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 1,
      alternates: {
        languages: {
          "x-default": `${APP_URL}/en/about`,
          ...Object.fromEntries(
            SUPPORTED_LANGUAGES.map((lang) => [
              lang,
              `${APP_URL}/${lang}/about`,
            ]),
          ),
        },
      },
    },
    // Changelog page
    {
      url: `${APP_URL}/changelog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    // Changelog entries
    ...changelogEntries.map((entry) => {
      const lastModified = new Date(entry.metadata.date);

      return {
        url: `${APP_URL}/changelog/${entry.slug}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
    // Terms of Service page
    {
      url: `${APP_URL}/tos`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Founder page
    {
      url: `${APP_URL}/founder`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return sitemapEntries;
}
