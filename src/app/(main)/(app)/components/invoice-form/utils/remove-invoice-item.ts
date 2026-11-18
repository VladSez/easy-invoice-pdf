import type { InvoiceItemData } from "@/app/schema";

/** A switch stored on every item but read from the first one only: a whole PDF column. */
type ItemPdfVisibilityFlag = Extract<
  keyof InvoiceItemData,
  `${string}IsVisible`
>;

/**
 * Every item-level "In PDF" switch. A `Record` over the flag type, so adding a switch to
 * the item schema fails to compile until it is listed here.
 */
const ITEM_PDF_VISIBILITY_FLAGS = {
  invoiceItemNumberIsVisible: true,
  nameFieldIsVisible: true,
  typeOfGTUFieldIsVisible: true,
  amountFieldIsVisible: true,
  unitFieldIsVisible: true,
  netPriceFieldIsVisible: true,
  vatFieldIsVisible: true,
  netAmountFieldIsVisible: true,
  vatAmountFieldIsVisible: true,
  preTaxAmountFieldIsVisible: true,
} as const satisfies Record<ItemPdfVisibilityFlag, true>;

const ITEM_PDF_VISIBILITY_FLAG_KEYS = Object.keys(
  ITEM_PDF_VISIBILITY_FLAGS,
) as ItemPdfVisibilityFlag[];

interface RemoveInvoiceItemOptions {
  /** The invoice's items, in order. */
  items: InvoiceItemData[];
  /** Position of the item to remove. */
  index: number;
}

/**
 * Removes one item. The PDF column switches live on the first item, so removing it hands
 * them to the item that becomes first, and the PDF keeps the columns the user chose.
 */
export function removeInvoiceItem({
  items,
  index,
}: RemoveInvoiceItemOptions): InvoiceItemData[] {
  const remaining = items.filter((_, i) => {
    return i !== index;
  });

  const [removedFirst] = items;

  const [nextFirst] = remaining;

  if (index !== 0 || !removedFirst || !nextFirst) return remaining;

  const carriedFlags = Object.fromEntries(
    ITEM_PDF_VISIBILITY_FLAG_KEYS.map((key) => {
      return [key, removedFirst[key]];
    }),
  );

  return [{ ...nextFirst, ...carriedFlags }, ...remaining.slice(1)];
}
