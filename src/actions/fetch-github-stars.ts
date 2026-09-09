"use server";

import * as Sentry from "@sentry/nextjs";
import { cache } from "react";

import { env } from "@/env";

/**
 * Fetches the current star count for the GitHub repository.
 *
 * This function is cached using React's `cache()` to prevent duplicate requests
 * during the same render cycle. The data is revalidated every hour.
 *
 * NOTE: `<Header />` renders on nearly every static page, so this `revalidate`
 * becomes the ISR revalidate time for those routes too -- Next.js takes the
 * *minimum* of all fetch revalidates in a route's tree, and a page-level
 * `export const revalidate` cannot raise it above this value. Lowering this
 * number re-renders (and re-bills) every landing page at that cadence.
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
        next: { revalidate: 3600 }, // revalidate every 1 hour (3600 seconds)
      },
    );

    if (!res.ok) {
      Sentry.captureException(
        new Error(
          `[fetchGithubStars] Failed to fetch GitHub stars, status: ${res?.status ?? "Unknown status"}`,
        ),
      );

      return 0;
    }

    const data = (await res.json()) as { stargazers_count?: number };

    return data?.stargazers_count || 0;
  } catch (error) {
    console.error("[fetchGithubStars] Failed to fetch GitHub stars:", error);

    Sentry.captureException(error);

    return 0;
  }
});
