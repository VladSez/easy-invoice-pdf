import { useId, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useDebouncedCallback } from "use-debounce";

import { DEFAULT_STRIPE_TOP_LINE_COLOR } from "@/app/schema";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface StripeTopLineColorPickerProps {
  /** The invoice's color, or `undefined` while it still uses the template's default. */
  value: string | undefined;
  /** Called with a lowercase `#rrggbb` color, or `undefined` to go back to the default. */
  onChange: (color: string | undefined) => void;
  hasError?: boolean;
}

export function StripeTopLineColorPicker({
  value,
  onChange,
  hasError = false,
}: StripeTopLineColorPickerProps) {
  const panelId = useId();
  const committedColor = value ?? DEFAULT_STRIPE_TOP_LINE_COLOR;

  // Dragging across the picker or typing a hex value fires on every move or key, and each
  // write would re-validate the form and queue another PDF render. The swatch, caption and
  // picker follow this draft straight away; the form only hears about it once things settle.
  const [color, setColor] = useState(committedColor);
  const [lastCommittedColor, setLastCommittedColor] = useState(committedColor);

  // a color that changes from outside the picker (a shared link, a template switch) wins
  // over the draft
  if (committedColor !== lastCommittedColor) {
    setLastCommittedColor(committedColor);
    setColor(committedColor);
  }

  const debouncedOnChange = useDebouncedCallback(
    onChange,
    COLOR_PICKER_DEBOUNCE_MS,
  );

  /** Presets and reset are single clicks, so they go to the form at once. */
  function commitColorNow(newColor: string | undefined) {
    debouncedOnChange.cancel();
    setColor(newColor ?? DEFAULT_STRIPE_TOP_LINE_COLOR);
    onChange(newColor);
  }

  function commitColorLater(newColor: string) {
    setColor(newColor);
    debouncedOnChange(newColor);
  }
  const preset = PRESET_COLORS.find((presetColor) => {
    return presetColor.hex === color;
  });

  const isDefaultColor = color === DEFAULT_STRIPE_TOP_LINE_COLOR;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Label id={`${panelId}-label`}>Top line color</Label>
        {isDefaultColor ? null : (
          <button
            type="button"
            className="text-xs text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
            onClick={() => {
              commitColorNow(undefined);
            }}
          >
            Reset to default
          </button>
        )}
      </div>

      <div
        role="group"
        aria-labelledby={`${panelId}-label`}
        className="flex flex-wrap items-center gap-2.5"
      >
        {PRESET_COLORS.map((presetColor) => {
          const isSelected = presetColor.hex === color;

          return (
            <button
              key={presetColor.hex}
              type="button"
              aria-label={presetColor.name}
              aria-pressed={isSelected}
              title={presetColor.name}
              className={cn(
                "size-7 rounded-full border border-black/10 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2",
                isSelected ? "ring-2 ring-offset-2" : "",
              )}
              style={{
                backgroundColor: presetColor.hex,
                // the ring takes the swatch's own color, which reads as "this one" better
                // than a neutral outline does
                ["--tw-ring-color" as string]: isSelected
                  ? presetColor.hex
                  : undefined,
              }}
              onClick={() => {
                commitColorNow(
                  presetColor.hex === DEFAULT_STRIPE_TOP_LINE_COLOR
                    ? undefined
                    : presetColor.hex,
                );
              }}
            />
          );
        })}

        <span aria-hidden className="h-5 w-px bg-zinc-200" />

        {/* the picker stays out of the way until asked for; Radix wires up aria-expanded,
            focus trapping and closing on Escape or an outside click */}
        <Popover
          onOpenChange={(isOpen) => {
            // closing the picker commits whatever is still waiting
            if (!isOpen) {
              debouncedOnChange.flush();
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Custom color"
              title="Custom color"
              className={cn(
                "size-7 rounded-full border border-black/10 bg-[conic-gradient(#f43f5e,#fbbf24,#10b981,#2563eb,#635bff,#f43f5e)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2",
                // a color none of the presets match came from here, so this is the one marked
                preset ? "" : "ring-2 ring-zinc-400 ring-offset-2",
              )}
            />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-64 space-y-3 p-3"
            aria-label="Custom top line color"
          >
            <HexColorPicker
              color={color}
              style={{ width: "100%", height: 160 }}
              onChange={(newColor) => {
                commitColorLater(newColor.toLowerCase());
              }}
            />
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-9 shrink-0 rounded-md border border-black/10"
                style={{ backgroundColor: color }}
              />
              <div className="relative flex-1">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-400"
                >
                  #
                </span>
                <HexColorField
                  id={`${panelId}-hex`}
                  color={color}
                  onColorChange={commitColorLater}
                  hasError={hasError}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <p className="mt-1.5 text-xs text-zinc-700/90">
        {preset ? preset.name : "Custom"} ·{" "}
        <span className="font-mono uppercase">{color}</span>
      </p>
    </div>
  );
}

interface HexColorFieldProps {
  id: string;
  /** The color the picker shows, as a lowercase `#rrggbb`. */
  color: string;
  /** Called with a lowercase `#rrggbb` color once the typed text spells one. */
  onColorChange: (color: string) => void;
  hasError: boolean;
}

/**
 * The hex text box under the picker.
 *
 * It keeps its own text while focused, so what is typed is never rewritten under the
 * caret: half-typed values such as `FBB` (on the way from `FBBF24` to something else)
 * stay as typed instead of being read as a shorthand and expanded. A color is only
 * handed over once six digits are in, and a shorthand only on blur.
 */
function HexColorField({
  id,
  color,
  onColorChange,
  hasError,
}: HexColorFieldProps) {
  const [draftText, setDraftText] = useState<string | null>(null);
  const colorText = color.slice(1).toUpperCase();

  return (
    <input
      id={id}
      aria-label="Hex color"
      type="text"
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      maxLength={7}
      value={draftText ?? colorText}
      onFocus={() => {
        setDraftText(colorText);
      }}
      onChange={(event) => {
        const text = event.target.value
          .replace(/^#/, "")
          // oxlint-disable-next-line unicorn/prefer-string-replace-all -- `String#replaceAll` is Safari 13.1; `.browserslistrc` targets Safari 12, and SWC lowers syntax but never polyfills a built-in
          .replace(/[^\da-f]/gi, "")
          .slice(0, 6)
          .toUpperCase();

        setDraftText(text);

        if (text.length === 6) {
          onColorChange(`#${text.toLowerCase()}`);
        }
      }}
      onBlur={() => {
        const normalizedColor = draftText ? normalizeHexColor(draftText) : null;

        if (normalizedColor && normalizedColor !== color) {
          onColorChange(normalizedColor);
        }

        // anything that does not spell a color snaps back to the one on screen
        setDraftText(null);
      }}
      className={cn(
        "border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent py-1 pl-6 pr-3 font-mono text-sm uppercase shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1",
        hasError ? "border-red-500" : "",
      )}
    />
  );
}

/**
 * Accepts six digits and the three-digit shorthand (`fa0`), which the schema does not, so
 * it is spelled out to the six digits it does.
 */
function normalizeHexColor(color: string) {
  const digits = color.replace(/^#/, "").toLowerCase();

  if (/^[\da-f]{6}$/.test(digits)) {
    return `#${digits}`;
  }

  if (/^[\da-f]{3}$/.test(digits)) {
    const [red, green, blue] = [0, 1, 2].map((index) => {
      return digits.charAt(index);
    });

    return `#${red}${red}${green}${green}${blue}${blue}`;
  }

  return null;
}

/** How long the picker waits after the last drag or keystroke before writing to the form. */
const COLOR_PICKER_DEBOUNCE_MS = 250;

const PRESET_COLORS = [
  { name: "Amber (default)", hex: DEFAULT_STRIPE_TOP_LINE_COLOR },
  { name: "Indigo", hex: "#635bff" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Graphite", hex: "#111827" },
] as const satisfies readonly { name: string; hex: string }[];
