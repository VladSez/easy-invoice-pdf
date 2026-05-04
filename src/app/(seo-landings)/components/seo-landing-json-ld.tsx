import { buildSeoLandingJsonLd } from "../build-seo-landing-json-ld";
import type { SeoLandingDefinition } from "../seo-landing-definitions";

interface SeoLandingJsonLdProps {
  definition: SeoLandingDefinition;
}

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
