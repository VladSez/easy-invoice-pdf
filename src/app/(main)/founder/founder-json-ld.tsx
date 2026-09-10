import { JsonLdScript } from "@/lib/seo/render-json-ld";

import { buildFounderJsonLdGraph } from "./build-founder-json-ld";

export function FounderJsonLd() {
  return <JsonLdScript id="json-ld-founder" data={buildFounderJsonLdGraph()} />;
}
