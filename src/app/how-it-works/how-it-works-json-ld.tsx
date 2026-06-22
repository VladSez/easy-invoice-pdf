import { buildHowItWorksJsonLd } from "./build-how-it-works-json-ld";
import { JsonLdScript } from "@/lib/seo/render-json-ld";

export function HowItWorksJsonLd() {
  return (
    <JsonLdScript id="json-ld-how-it-works" data={buildHowItWorksJsonLd()} />
  );
}
