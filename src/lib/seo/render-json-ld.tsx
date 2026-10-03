import type { Graph, WithContext, Thing } from "schema-dts";

interface JsonLdScriptProps {
  /** Unique id for the script tag (for deduping and SSR stability). */
  id: string;
  /** JSON-LD object: a schema.org graph or a context-wrapped thing. */
  data: Graph | WithContext<Thing>;
}

/**
 * Render JSON-LD as <script type="application/ld+json"> for SEO.
 *
 * The graphs carry copy from MDX front matter and landing definitions, and
 * `JSON.stringify` leaves `<` alone: a `</script>` anywhere in that text would close the
 * tag early, dropping the rest of the graph and letting the remainder run as HTML.
 * {@link serializeJsonLd} writes `<` as its JSON escape instead, which parses back to the
 * same data. This is the escaping Next.js recommends for JSON-LD.
 */
export function JsonLdScript({ id, data }: JsonLdScriptProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

/**
 * The JSON escape for `<`: a backslash, then `u003c`.
 *
 * Built from the backslash's code point because `oxfmt` rewrites unicode escapes in
 * string and template literals (`String.raw` included, and even in comments) into the
 * character itself, which silently turned this escape back into a plain `<`.
 */
export const ESCAPED_LESS_THAN = `${String.fromCodePoint(0x5c)}u003c`;

/** `JSON.stringify`, with every `<` written as its JSON escape so the output can't end the tag. */
export function serializeJsonLd(data: Graph | WithContext<Thing>) {
  return JSON.stringify(data).replaceAll("<", ESCAPED_LESS_THAN);
}
