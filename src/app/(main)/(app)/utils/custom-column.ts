import type { InvoiceData } from "@/app/schema";

/**
 * The custom columns the PDF prints, in order: the original one first (its name is
 * `customColumnLabel`, its values each item's `typeOfGTU`, as it began as the Polish Type
 * of GTU), then the ones in `extraCustomColumns`.
 *
 * A column prints when its switch is on and it has something to show: a name or a value
 * on some item. Adding a column in the form turns the switch on before anything is typed,
 * so without the content check the PDF would gain an empty column the moment the pill is
 * clicked.
 */
export function getCustomColumnsInPdf(
  invoiceData: Pick<
    InvoiceData,
    "items" | "customColumnLabel" | "extraCustomColumns"
  >,
) {
  const { items } = invoiceData;

  const firstColumn: CustomColumnInPdf = {
    position: 0,
    label: invoiceData.customColumnLabel?.trim() ?? "",
    values: items.map((item) => {
      return item.typeOfGTU?.trim() ?? "";
    }),
  };

  const isFirstColumnSwitchedOn = Boolean(items[0]?.typeOfGTUFieldIsVisible);

  const extraColumns = (invoiceData.extraCustomColumns ?? []).map(
    (column, extraIndex): CustomColumnInPdf & { isSwitchedOn: boolean } => {
      return {
        position: extraIndex + 1,
        label: column.label?.trim() ?? "",
        values: items.map((item) => {
          return item.extraCustomColumnValues?.[extraIndex]?.trim() ?? "";
        }),
        isSwitchedOn: column.isVisible,
      };
    },
  );

  const columns = [
    { ...firstColumn, isSwitchedOn: isFirstColumnSwitchedOn },
    ...extraColumns,
  ];

  return columns
    .filter((column) => {
      const hasValue = column.values.some(Boolean);

      return column.isSwitchedOn && (Boolean(column.label) || hasValue);
    })
    .map(({ isSwitchedOn: _isSwitchedOn, ...column }) => {
      return column;
    });
}

interface CustomColumnInPdf {
  /** Where the column sits among all custom columns; 0 is the original one. */
  position: number;
  /** The column's name, trimmed; "" while it has none. */
  label: string;
  /** Each item's value in the column, trimmed, in item order. */
  values: string[];
}
