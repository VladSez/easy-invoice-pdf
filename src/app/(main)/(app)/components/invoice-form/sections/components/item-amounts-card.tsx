import { type Control, useWatch } from "react-hook-form";

import { PdfColumnSwitch } from "@/app/(main)/(app)/components/invoice-form/sections/components/pdf-column-switch";
import { formatAmount } from "@/app/(main)/(app)/utils/format-amount";
import { formatMoneyForTemplate } from "@/app/(main)/(app)/utils/format-money-for-template";
import { getItemAmountBeforeDiscount } from "@/app/(main)/(app)/utils/item-discount";
import type {
  InvoiceData,
  InvoiceItemData,
  SupportedCurrencies,
  SupportedNumberFormatLocale,
} from "@/app/schema";
import { cn } from "@/lib/utils";

/**
 * The calculated end of an item: what the discount took off, then the net, tax and
 * pre-tax amounts. Read-only text rather than disabled inputs, since nobody types here.
 * A column left out of the PDF keeps its value, greyed.
 */
export function ItemAmountsCard({
  control,
  index,
  currency,
  template,
  numberFormatLocale,
  taxLabelText,
  showColumnSwitches,
  hiddenColumns,
}: ItemAmountsCardProps) {
  const [
    discountType,
    discountValue,
    discountAmount,
    discountLabel,
    netAmount,
    vatAmount,
    preTaxAmount,
  ] = useWatch({
    control,
    name: [
      `items.${index}.discountType`,
      `items.${index}.discountValue`,
      `items.${index}.discountAmount`,
      `items.${index}.discountLabel`,
      `items.${index}.netAmount`,
      `items.${index}.vatAmount`,
      `items.${index}.preTaxAmount`,
    ],
  });

  const formatMoney = (value: number) => {
    return formatMoneyForTemplate({
      amount: value,
      currency,
      numberFormatLocale,
      template,
    });
  };

  // from the amounts `ItemTotalsSync` last wrote, not the live qty and price: while either
  // is invalid (a cleared price) the sync holds the old amounts, and a subtotal from the
  // live fields would show beside a discount from that older calculation
  const subtotal = getItemAmountBeforeDiscount({ netAmount, discountAmount });

  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back strings at runtime, the schema types say number
  const discountNumber = Number(discountValue) || 0;

  // named as the PDF names it: the item's own label, or "Discount", plus the rate when
  // it is a percentage. A fixed discount's amount is already on the right.
  const discountName = discountLabel?.trim() || "Discount";

  const discountTitle =
    discountType === "percentage"
      ? `${discountName} ${formatAmount({ amount: discountNumber, numberFormatLocale, minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
      : discountName;

  const columns = [
    {
      key: "net",
      label: "Net amount",
      value: netAmount,
      testId: `itemNetAmount${index}`,
      column: "netAmountFieldIsVisible",
      isHidden: hiddenColumns.netAmount,
      ariaLabel: `Show the 'Net Amount' Column in the PDF for item ${index + 1}`,
      tooltip: 'Show the "Net Amount" Column in the PDF',
    },
    {
      key: "vat",
      label: `${taxLabelText} amount`,
      value: vatAmount,
      testId: `itemVatAmount${index}`,
      column: "vatAmountFieldIsVisible",
      isHidden: hiddenColumns.vatAmount,
      ariaLabel: `Show the '${taxLabelText} Amount' Column in the PDF for item ${index + 1}`,
      tooltip: `Show the "${taxLabelText} Amount" Column in the PDF`,
    },
    {
      key: "preTax",
      label: "Pre-tax amount",
      value: preTaxAmount,
      testId: `itemPreTaxAmount${index}`,
      column: "preTaxAmountFieldIsVisible",
      isHidden: hiddenColumns.preTaxAmount,
      ariaLabel: `Show the 'Pre-tax Amount' Column in the PDF for item ${index + 1}`,
      tooltip: 'Show the "Pre-tax Amount" Column in the PDF',
    },
  ] as const satisfies ReadonlyArray<{
    key: string;
    label: string;
    value: number;
    testId: string;
    column: Extract<keyof InvoiceItemData, `${string}FieldIsVisible`>;
    isHidden: boolean;
    ariaLabel: string;
    tooltip: string;
  }>;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 tabular-nums">
      {/* tinted in the discount's green, so it reads as an adjustment to the line
          rather than one more total */}
      {discountAmount > 0 ? (
        <div
          className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 px-3 py-2"
          data-testid={`itemDiscountSummary${index}`}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="break-words text-[13px] font-semibold text-emerald-800">
              {discountTitle}
            </span>
            <span className="text-xs text-emerald-700">
              of {formatMoney(subtotal)} subtotal
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-emerald-700">
            −{formatMoney(discountAmount)}
          </span>
        </div>
      ) : null}

      {/* one row per amount: the label over its value, the switch beside both */}
      <dl>
        {columns.map((column, columnIndex) => {
          return (
            <div
              key={column.key}
              className={cn(
                "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2",
                columnIndex > 0 && "border-t border-slate-200",
              )}
            >
              <dt className="text-[13px] text-slate-500">{column.label}</dt>
              <dd
                className={cn(
                  "col-start-1 break-words text-[15px] transition-colors",
                  column.key === "preTax" && "font-semibold",
                  column.isHidden ? "text-slate-500" : "text-slate-950",
                )}
                data-testid={column.testId}
              >
                {formatMoney(column.value)}
              </dd>
              {showColumnSwitches ? (
                <dd className="col-start-2 row-span-2 row-start-1">
                  <PdfColumnSwitch
                    control={control}
                    column={column.column}
                    ariaLabel={column.ariaLabel}
                    tooltip={column.tooltip}
                  />
                </dd>
              ) : null}
            </div>
          );
        })}
      </dl>

      {/* the switches sit on item 1 alone yet act on the whole table, which they don't
          say by themselves */}
      {showColumnSwitches ? (
        <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500">
          Each switch shows or hides that column in the PDF, for every item.
        </p>
      ) : null}
    </div>
  );
}

interface ItemAmountsCardProps {
  control: Control<InvoiceData>;
  /** Position of the item in the `items` field array. */
  index: number;
  currency: SupportedCurrencies;
  template: InvoiceData["template"];
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  taxLabelText: string;
  /** Show the "In PDF" switches: on the first item, for the default template. */
  showColumnSwitches: boolean;
  /** Which amount columns the PDF leaves out, so their values grey. */
  hiddenColumns: {
    netAmount: boolean;
    vatAmount: boolean;
    preTaxAmount: boolean;
  };
}
