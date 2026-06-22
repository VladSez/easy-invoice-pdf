import type { ChangelogEntry } from "./utils";
import { buildChangelogPostJsonLdGraph } from "./build-changelog-json-ld";
import { JsonLdScript } from "@/lib/seo/render-json-ld";

interface ChangelogPostJsonLdProps {
  entry: ChangelogEntry;
}

export function ChangelogPostJsonLd({ entry }: ChangelogPostJsonLdProps) {
  const graph = buildChangelogPostJsonLdGraph(entry);

  return <JsonLdScript id={`json-ld-changelog-${entry.slug}`} data={graph} />;
}
