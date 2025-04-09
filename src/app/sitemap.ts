import { APP_URL } from "@/config";
import { type MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "./schema";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().split("T")[0];

  return SUPPORTED_LANGUAGES.map((locale) => {
    return {
      url: `${APP_URL}/${locale}/about`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    };
  });
}
