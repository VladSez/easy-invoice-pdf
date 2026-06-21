import type { Graph, WithContext, Thing } from "schema-dts";

interface JsonLdScriptProps {
  id: string;
  data: Graph | WithContext<Thing>;
}

/**
 * Render JSON-LD as <script type="application/ld+json"> for SEO.
 *
 * @param {Object} props
 * @param {string} props.id - Unique id for script tag (for deduping/SSR stability).
 * @param {Graph | WithContext<Thing>} props.data - JSON-LD object (schema.org graph or context-wrapped thing).
 */
export function JsonLdScript({ id, data }: JsonLdScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
