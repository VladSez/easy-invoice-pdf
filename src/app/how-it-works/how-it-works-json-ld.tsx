import { buildHowItWorksJsonLd } from "./build-how-it-works-json-ld";

export function HowItWorksJsonLd() {
  const graph = buildHowItWorksJsonLd();

  return (
    <script
      id="json-ld-how-it-works"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
