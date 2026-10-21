import { Text, View } from "@react-pdf/renderer/lib/react-pdf.browser";
import type { ComponentProps } from "react";

type ViewStyle = ComponentProps<typeof View>["style"];

interface WrappableAmountProps {
  /**
   * The amount, already formatted and cut at its thousands boundaries -- see
   * `formatAmountChunks` and `formatCurrencyChunks`.
   */
  chunks: string[];
  /**
   * The cell's own style, exactly what the surrounding `<Text>` used to carry. On a split
   * amount it dresses the box the pieces sit in -- the font size, family, weight and colour
   * are inherited by them, and the margins do the same job on the box that they did on the
   * `<Text>` before.
   */
  style?: ViewStyle;
}

/**
 * An amount in a table cell, right-aligned, which moves its last thousands group onto a
 * second line rather than running over the column next to it.
 *
 * A number has no spaces to break at: `1,000,000,000.00` is one unbreakable word, so a
 * `<Text>` too narrow for it simply paints past its cell and over the neighbouring column.
 * The default template used to get away with this because it grouped every amount with a
 * plain space, which react-pdf breaks at happily; grouping the way the number format asks
 * -- `1,000,000,000.00`, `1.000.000.000,00`, or a no-break space for `international` -- took
 * that away and the overflow showed up.
 *
 * Handing react-pdf the pieces as separate `<Text>` children of one `<Text>` does create a
 * break, but it treats the break as hyphenation and paints a hyphen into the middle of the
 * number (`1,000,000,-`). Laying them out as flex items instead gives the same break with no
 * hyphen, and a number that fits sits on one line where a plain `<Text>` put it.
 *
 * The cost is that a grouped amount reaches the PDF as one text run per thousands group,
 * even on the rows where it never comes close to wrapping, so extracting or searching the
 * file finds `1,` `000,` `000.00` rather than `1,000,000.00`. There is no way around it
 * inside one `<Text>`: `@react-pdf/textkit` splits a line into words on `/([ ]+)/g` -- a
 * plain U+0020 and nothing else -- and turns every other break it is offered into a
 * hyphenation penalty, which is the hyphen above. A zero-width space, a soft hyphen and a
 * no-break space all fail that way. The single-piece case below is the part that can be
 * given back: an amount under a thousand has no boundary to break at in the first place.
 */
export function WrappableAmount({ chunks, style }: WrappableAmountProps) {
  // nothing to lay out, and a lone `<Text>` keeps the amount a single run in the PDF
  if (chunks.length <= 1) {
    return <Text style={style}>{chunks.join("")}</Text>;
  }

  return (
    <View
      style={[
        { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end" },
        style,
      ]}
    >
      {chunks.map((chunk, index) => {
        return <Text key={index}>{chunk}</Text>;
      })}
    </View>
  );
}
