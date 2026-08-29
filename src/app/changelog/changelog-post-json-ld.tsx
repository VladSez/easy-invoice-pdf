import { JsonLdScript } from "@/lib/seo/render-json-ld";

import { buildChangelogPostJsonLdGraph } from "./build-changelog-json-ld";
import type { ChangelogEntry } from "./utils";

interface ChangelogPostJsonLdProps {
  entry: ChangelogEntry;
}

export function ChangelogPostJsonLd({ entry }: ChangelogPostJsonLdProps) {
  const graph = buildChangelogPostJsonLdGraph(entry);

  return <JsonLdScript id={`json-ld-changelog-${entry.slug}`} data={graph} />;
}
