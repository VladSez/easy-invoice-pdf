import { type Control, useWatch } from "react-hook-form";

import { PdfColumnSwitch } from "@/app/(main)/(app)/components/invoice-form/sections/components/pdf-column-switch";
import { formatAmount } from "@/app/(main)/(app)/utils/format-amount";
import { formatMoneyForTemplate } from "@/app/(main)/(app)/utils/format-money-for-template";
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
    amount,
    netPrice,
    discountType,
    discountValue,
    discountAmount,
    netAmount,
    vatAmount,
    preTaxAmount,
  ] = useWatch({
    control,
    name: [
      `items.${index}.amount`,
      `items.${index}.netPrice`,
      `items.${index}.discountType`,
      `items.${index}.discountValue`,
      `items.${index}.discountAmount`,
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

  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- `<Input type="number">` gives back strings at runtime, the schema types say number
  const subtotal = (Number(amount) || 0) * (Number(netPrice) || 0);

  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- see above
  const discountNumber = Number(discountValue) || 0;

  const discountText =
    discountType === "percentage"
      ? `${formatAmount({ amount: discountNumber, numberFormatLocale, minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
      : formatMoney(discountNumber);

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
    <div className="rounded-lg border border-slate-200 bg-slate-50 tabular-nums">
      {discountAmount > 0 ? (
        <div
          className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-b border-slate-200 px-3 py-2.5 text-[13px]"
          data-testid={`itemDiscountSummary${index}`}
        >
          <span className="text-slate-500">
            Subtotal {formatMoney(subtotal)} · Discount {discountText}
          </span>
          <span className="font-medium text-emerald-700">
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
                  "break-words text-[15px] transition-colors",
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
