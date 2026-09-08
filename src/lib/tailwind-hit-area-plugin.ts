import plugin from "tailwindcss/plugin";
import type { CSSRuleObject } from "tailwindcss/types/config";

/**
 * `hit-area-*` utilities: grow an element's touch target without touching the layout.
 *
 * A small control surrounded by padding leaves a dead zone — the tap looks like it landed
 * on the button but hits the container instead. Growing the control itself (more padding,
 * a taller box) moves everything around it, so the hit area is grown with an absolutely
 * positioned, invisible `::before` that spills outside the element's own box.
 *
 * ```tsx
 * <button className="hit-area-2" />          // 8px on every side
 * <button className="hit-area-y-1.5" />      // 6px top and bottom
 * <button className="hit-area-l-4" />        // 16px on the left only
 * <button className="hit-area-[21px]" />     // arbitrary values work too
 * <button className="hit-area-2 hit-area-debug" />  // paint the zone while developing
 * ```
 *
 * The utilities compose: each one only writes the custom properties for the sides it
 * names, and the shared `::before` reads all four with a `0px` fallback.
 *
 * Ported to Tailwind v3 from Kian Bazarjani's v4 `@utility` version,
 * https://bazza.dev/craft/2026/hit-area
 */

type HitAreaSide = "t" | "r" | "b" | "l";

const ALL_SIDES = [
  "t",
  "r",
  "b",
  "l",
] as const satisfies readonly HitAreaSide[];

const HIT_AREA_PSEUDO_ELEMENT = {
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "var(--hit-area-t, 0px)",
    right: "var(--hit-area-r, 0px)",
    bottom: "var(--hit-area-b, 0px)",
    left: "var(--hit-area-l, 0px)",
    // `inherit` rather than `auto`: a disabled control sets `pointer-events: none`, and
    // its hit area has to go dead with it
    pointerEvents: "inherit",
  },
} satisfies CSSRuleObject;

/**
 * Builds the callback Tailwind hands a matched value, e.g. `4` (from the spacing scale)
 * or `21px` (arbitrary). Offsets are negative so the pseudo-element grows outwards.
 */
function hitAreaUtility(sides: readonly HitAreaSide[]) {
  return (value: string): CSSRuleObject => {
    const offsets: CSSRuleObject = {};

    for (const side of sides) {
      offsets[`--hit-area-${side}`] = `calc(${value} * -1)`;
    }

    return { ...offsets, ...HIT_AREA_PSEUDO_ELEMENT };
  };
}

export const hitAreaPlugin = plugin(
  ({ matchUtilities, addUtilities, theme }) => {
    matchUtilities(
      {
        "hit-area": hitAreaUtility(ALL_SIDES),
        "hit-area-x": hitAreaUtility(["l", "r"]),
        "hit-area-y": hitAreaUtility(["t", "b"]),
        "hit-area-t": hitAreaUtility(["t"]),
        "hit-area-r": hitAreaUtility(["r"]),
        "hit-area-b": hitAreaUtility(["b"]),
        "hit-area-l": hitAreaUtility(["l"]),
      },
      { values: theme("spacing") },
    );

    // Development aid: makes the invisible zone visible. Registered after the utilities
    // above so it wins the `::before` cascade and can paint over them.
    addUtilities({
      ".hit-area-debug": {
        ...HIT_AREA_PSEUDO_ELEMENT,
        "&::before": {
          ...HIT_AREA_PSEUDO_ELEMENT["&::before"],
          outline: "1px dashed rgb(59 130 246)", // blue-500
          backgroundColor: "rgb(59 130 246 / 0.1)",
        },
        // turns green under the pointer, so adjacent zones can be told apart
        "&:hover::before": {
          outline: "1px dashed rgb(34 197 94)", // green-500
          backgroundColor: "rgb(34 197 94 / 0.1)",
        },
      },
    });
  },
);
