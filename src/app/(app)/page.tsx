import type { Metadata } from "next";
import { AppPageClient } from "./page.client";

// we generate metadata here, because we need access to searchParams (in layout we don't have it)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const hasShareableData = Boolean(searchParams?.data);
  const isProd = process.env.VERCEL_ENV === "production";

  const defaultRobotsConfig = {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };

  // Only allow indexing on production and when there's no shareable data
  const shouldIndex = isProd && !hasShareableData;

  return {
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        }
      : defaultRobotsConfig,
    alternates: {
      canonical: "/",
    },
  };
}

export default function AppPage() {
  return <AppPageClient />;
}
