import type { Locale } from "next-intl";

import { JsonLdScript } from "@/lib/seo/render-json-ld";

import type Messages from "../../../../messages/en.json";
import { buildAboutJsonLdGraph } from "./about-json-ld-graph";

/**
 * Renders a JSON-LD script tag for the about page with structured schema.org data.
 * Loads locale-specific messages and builds a graph containing WebPage and FAQPage schemas.
 *
 * @param locale - The current locale (e.g., 'en', 'pl')
 * @returns A script element containing JSON-LD structured data
 */
export async function AboutJsonLd({ locale }: { locale: Locale }) {
  const messages = await import(`../../../../messages/${locale}.json`).then(
    (module: { default: typeof Messages }) => {
      return module.default;
    },
  );

  const graph = buildAboutJsonLdGraph(messages, locale);

  return <JsonLdScript id="json-ld-about" data={graph} />;
}
