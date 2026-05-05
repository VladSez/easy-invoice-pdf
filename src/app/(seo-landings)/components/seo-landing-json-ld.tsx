import { buildSeoLandingJsonLd } from "../build-seo-landing-json-ld";
import type { SeoLandingDefinition } from "../seo-landing-definitions";

interface SeoLandingJsonLdProps {
  definition: SeoLandingDefinition;
}

/**
 * Renders JSON-LD structured data for SEO landing pages.
 * Injects schema markup into the document head for better search engine understanding.
 *
 * @param {SeoLandingJsonLdProps} props - Component props
 * @param {SeoLandingDefinition} props.definition - SEO landing page definition containing schema data
 */
export function SeoLandingJsonLd({ definition }: SeoLandingJsonLdProps) {
  const graph = buildSeoLandingJsonLd(definition);

  return (
    <script
      id={`json-ld-seo-landing-${definition.slug}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
