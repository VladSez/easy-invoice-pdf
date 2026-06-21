import { buildFounderJsonLdGraph } from "./build-founder-json-ld";
import { JsonLdScript } from "@/lib/seo/render-json-ld";

export function FounderJsonLd() {
  return <JsonLdScript id="json-ld-founder" data={buildFounderJsonLdGraph()} />;
}
