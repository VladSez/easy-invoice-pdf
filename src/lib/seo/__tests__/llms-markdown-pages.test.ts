import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MARKDOWN_PATHS = [
  "invoice-generator.md",
  "how-it-works.md",
  "en/about.md",
  "pl/about.md",
  "de/about.md",
  "es/about.md",
  "pt/about.md",
  "ru/about.md",
  "uk/about.md",
  "fr/about.md",
  "it/about.md",
  "nl/about.md",
] as const;

function readPublicFile(path: string) {
  return readFileSync(resolve(process.cwd(), "public", path), "utf8");
}

describe("LLM-facing Markdown pages", () => {
  it.each(MARKDOWN_PATHS)("publishes %s with useful source context", (path) => {
    const content = readPublicFile(path);

    expect(content).toMatch(/^# EasyInvoicePDF|^# .*EasyInvoicePDF/m);
    expect(content).toContain("https://easyinvoicepdf.com/");

    const updatedAtMatch = /\b(\d{4}-\d{2}-\d{2})\b/.exec(content);
    expect(updatedAtMatch, "expected a YYYY-MM-DD update date").not.toBeNull();

    const updatedAt = new Date(`${updatedAtMatch?.[1]}T00:00:00Z`);
    expect(updatedAt.getTime()).not.toBeNaN();
    expect(updatedAt.getTime()).toBeLessThanOrEqual(Date.now());

    expect(content.length).toBeGreaterThan(1_000);
  });

  it("lists every Markdown page in llms.txt", () => {
    const llmsTxt = readPublicFile("llms.txt");

    const linkedPaths = [
      ...llmsTxt.matchAll(/https:\/\/easyinvoicepdf\.com\/(\S+?\.md)/g),
    ].map((match) => match[1]);

    expect(new Set(linkedPaths)).toEqual(new Set(MARKDOWN_PATHS));
  });
});
