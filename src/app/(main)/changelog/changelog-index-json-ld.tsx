import { JsonLdScript } from "@/lib/seo/render-json-ld";

import { buildChangelogIndexJsonLdGraph } from "./build-changelog-json-ld";
import { getChangelogEntries } from "./utils";

export async function ChangelogIndexJsonLd() {
  const [latest] = await getChangelogEntries().catch((error) => {
    console.error(
      "[ChangelogIndexJsonLd] Failed to load changelog entries",
      error,
    );

    return [];
  });

  const graph = buildChangelogIndexJsonLdGraph(latest?.metadata.date ?? null);

  return <JsonLdScript id="json-ld-changelog-index" data={graph} />;
}
