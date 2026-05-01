import type Messages from "../../../../messages/en.json";
import type { Locale } from "next-intl";
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
    (module: { default: typeof Messages }) => module.default,
  );

  const graph = buildAboutJsonLdGraph(messages, locale);

  return (
    <script
      id="json-ld-about"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
