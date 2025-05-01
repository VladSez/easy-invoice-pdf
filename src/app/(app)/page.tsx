import type { Metadata } from "next";
import { AppPageClient } from "./page.client";

// we generate metadata here, because we need access to searchParams (in layout we don't have it)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  const hasShareableData = Boolean(searchParams?.data);

  // we want to index this page ONLY if there is no shareable data in the URL
  return {
    robots: hasShareableData
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
    alternates: {
      // preferred version of the page
      canonical: `/`,
    },
  };
}

export default function AppPage() {
  return <AppPageClient />;
}
