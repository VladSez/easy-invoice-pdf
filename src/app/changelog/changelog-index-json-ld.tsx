import { getLatestChangelogSummary } from "./utils";
import { buildChangelogIndexJsonLdGraph } from "./build-changelog-json-ld";
import { JsonLdScript } from "@/lib/seo/render-json-ld";

export async function ChangelogIndexJsonLd() {
  const latest = await getLatestChangelogSummary().catch((error) => {
    console.error(
      "[ChangelogIndexJsonLd] Failed to load latest changelog summary",
      error,
    );
    return null;
  });
  const graph = buildChangelogIndexJsonLdGraph(latest?.date ?? null);

  return <JsonLdScript id="json-ld-changelog-index" data={graph} />;
}
