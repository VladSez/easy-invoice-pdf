import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

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

const UPDATE_DATE_LABELS = {
  en: "Last updated",
  pl: "Ostatnia aktualizacja",
  de: "Zuletzt aktualisiert",
  es: "Última actualización",
  pt: "Última atualização",
  ru: "Последнее обновление",
  uk: "Останнє оновлення",
  fr: "Dernière mise à jour",
  it: "Ultimo aggiornamento",
  nl: "Laatst bijgewerkt",
} as const;

const UPDATE_DATE_SCHEMA = z
  .string()
  .date()
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

function readPublicFile(path: string) {
  return readFileSync(resolve(process.cwd(), "public", path), "utf8");
}

/**
 * Extracts the update date from the markdown content, using a localized label
 * inferred from the path location (e.g., "en", "pl", etc). Returns the date as a
 * string in YYYY-MM-DD format, or null if not found.
 *
 * @param content - The markdown file content.
 * @param path - The file path, used to infer the locale.
 * @returns The update date string if present, otherwise null.
 *
 * @example
 * const md = "> Last updated: 2024-03-14\n\nOther content";
 * extractUpdateDate(md, "en/about.md"); // "2024-03-14"
 *
 * @example
 * const md = "> Ostatnia aktualizacja: 2024-02-29\nContent...";
 * extractUpdateDate(md, "pl/about.md"); // "2024-02-29"
 *
 * @example
 * extractUpdateDate("> Published: 2024-01-01", "en/about.md"); // null
 */
function extractUpdateDate(content: string, path: string) {
  const pathLocale = path.split("/")[0];
  const locale = pathLocale in UPDATE_DATE_LABELS ? pathLocale : "en";
  const label = UPDATE_DATE_LABELS[locale as keyof typeof UPDATE_DATE_LABELS];

  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = new RegExp(
    `^>\\s*${escapedLabel}\\s*:\\s*(\\S+)\\s*$`,
    "m",
  ).exec(content);

  return match?.[1] ?? null;
}

describe("LLM-facing Markdown pages", () => {
  it.each(MARKDOWN_PATHS)("publishes %s with useful source context", (path) => {
    const content = readPublicFile(path);

    expect(content).toMatch(/^# EasyInvoicePDF|^# .*EasyInvoicePDF/m);
    expect(content).toContain("https://easyinvoicepdf.com/");

    const updateDate = extractUpdateDate(content, path);
    expect(
      updateDate,
      "expected a localized Last updated value",
    ).not.toBeNull();

    const updatedAt = UPDATE_DATE_SCHEMA.safeParse(updateDate);
    expect(
      updatedAt.success,
      `expected a valid YYYY-MM-DD calendar date, got ${updateDate}`,
    ).toBe(true);
    if (!updatedAt.success) return;

    expect(updatedAt.data.getTime()).toBeLessThanOrEqual(Date.now());

    expect(content.length).toBeGreaterThan(1_000);
  });

  it("rejects content without the localized update date field", () => {
    const content = "> Published: 2026-08-02";

    expect(extractUpdateDate(content, "en/about.md")).toBeNull();
  });

  it("rejects impossible calendar dates", () => {
    expect(UPDATE_DATE_SCHEMA.safeParse("2026-02-31").success).toBe(false);
  });

  it("lists every Markdown page in llms.txt", () => {
    const llmsTxt = readPublicFile("llms.txt");

    const linkedPaths = [
      ...llmsTxt.matchAll(/https:\/\/easyinvoicepdf\.com\/(\S+?\.md)/g),
    ].map((match) => match[1]);

    expect(new Set(linkedPaths)).toEqual(new Set(MARKDOWN_PATHS));
  });
});
