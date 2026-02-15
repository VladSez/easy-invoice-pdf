"use server";

import { env } from "@/env";

import { cache } from "react";

/**
 * Fetches the current star count for the GitHub repository.
 *
 * This function is cached using React's `cache()` to prevent duplicate requests
 * during the same render cycle. The data is revalidated every 60 seconds.
 *
 */
export const fetchGithubStars = cache(async (): Promise<number> => {
  try {
    const res = await fetch(
      "https://api.github.com/repos/VladSez/easy-invoice-pdf",
      {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        },
        next: { revalidate: 60 }, // 1 minute in seconds
      },
    );

    if (!res.ok) {
      return 0;
    }

    const data = (await res.json()) as { stargazers_count?: number };

    return data?.stargazers_count || 0;
  } catch (error) {
    console.error("Failed to fetch GitHub stars:", error);
    return 0;
  }
});
