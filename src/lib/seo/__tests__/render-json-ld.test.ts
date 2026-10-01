import { describe, expect, it } from "vitest";

import { ESCAPED_LESS_THAN, serializeJsonLd } from "../render-json-ld";

describe("serializeJsonLd", () => {
  const graph = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Fixed </script><script>alert(1)</script> in titles",
  } as const;

  it("writes `<` as a backslash escape, not the character", () => {
    // guards the constant itself: the formatter once rewrote it into a plain `<`
    expect(ESCAPED_LESS_THAN).toHaveLength(6);
    expect(ESCAPED_LESS_THAN.codePointAt(0)).toBe(0x5c);
  });

  it("never emits a raw `<`, so the copy cannot close the script tag", () => {
    const serialized = serializeJsonLd(graph);

    expect(serialized).not.toContain("<");
    expect(serialized).toContain(`${ESCAPED_LESS_THAN}/script>`);
  });

  it("parses back to the same data", () => {
    expect(JSON.parse(serializeJsonLd(graph))).toEqual(graph);
  });
});
