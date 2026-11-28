import { cn } from "@/lib/utils";

/*
 * Building blocks for the small drawings on `SeoContentFeatureCard`s: gray bars that
 * stand in for text, and white pills for short words. Decorative only; the card's text
 * says the same.
 */

/** A gray bar standing in for a line of text. Pass `className` for width and shade. */
export function SketchBar({ className }: SketchBarProps) {
  return (
    <span className={cn("block h-1.5 rounded-sm bg-slate-200", className)} />
  );
}

/** Short words as white pills that wrap, e.g. "Invoice" in several languages. */
export function SketchPills({ words, className }: SketchPillsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((word) => {
        return (
          <span
            key={word}
            className={cn(
              "inline-flex h-[26px] items-center rounded-full border border-gray-200 bg-white px-2.5 text-xs font-medium text-slate-900",
              className,
            )}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

/** "Invoice" in a few of the PDF languages, for the languages card. */
export function LanguagesSketch() {
  return <SketchPills words={INVOICE_IN_OTHER_LANGUAGES} />;
}

const INVOICE_IN_OTHER_LANGUAGES = [
  "Invoice",
  "Faktura",
  "Rechnung",
  "Factura",
] as const;

interface SketchBarProps {
  className?: string;
}

interface SketchPillsProps {
  words: readonly string[];
  /** Extra classes for each pill, e.g. a monospace font for amounts. */
  className?: string;
}
