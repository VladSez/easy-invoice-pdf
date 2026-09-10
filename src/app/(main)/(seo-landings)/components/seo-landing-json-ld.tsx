import { JsonLdScript } from "@/lib/seo/render-json-ld";

import { buildSeoLandingJsonLd } from "../build-seo-landing-json-ld";
import type { SeoLandingDefinition } from "../seo-landing-definitions";

interface SeoLandingJsonLdProps {
  definition: SeoLandingDefinition;
}

export function SeoLandingJsonLd({ definition }: SeoLandingJsonLdProps) {
  const graph = buildSeoLandingJsonLd(definition);

  return (
    <JsonLdScript id={`json-ld-seo-landing-${definition.slug}`} data={graph} />
  );
}
