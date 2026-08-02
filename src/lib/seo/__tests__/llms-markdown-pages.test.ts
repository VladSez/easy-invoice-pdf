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
    expect(content).toContain("2026-08-02");
    expect(content.length).toBeGreaterThan(1_000);
  });

  it("lists every Markdown page in llms.txt", () => {
    const llmsTxt = readPublicFile("llms.txt");

    for (const path of MARKDOWN_PATHS) {
      expect(llmsTxt).toContain(`https://easyinvoicepdf.com/${path}`);
    }
  });
});
