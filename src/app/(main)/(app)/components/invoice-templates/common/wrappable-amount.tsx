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
   * The cell's own style, exactly what the surrounding `<Text>` used to carry. The font
   * size, family, weight and colour are inherited by the pieces; the margins stay on this
   * box, where they did the same job before.
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
 */
export function WrappableAmount({ chunks, style }: WrappableAmountProps) {
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
