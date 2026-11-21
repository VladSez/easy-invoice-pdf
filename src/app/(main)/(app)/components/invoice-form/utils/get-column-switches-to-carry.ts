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

interface GetColumnSwitchesToCarryOptions {
  /** The invoice's items, in order, before the removal. */
  items: InvoiceItemData[];
  /** Position of the item being removed. */
  index: number;
}

/**
 * The PDF column switches to hand on when an item is removed. They live on the first item,
 * so removing it passes them to the item that becomes first, and the PDF keeps the columns
 * the user chose. Null when nothing needs carrying: a later item, or the last one left.
 *
 * Only the switches, not a rebuilt list: the caller removes the one row with the field
 * array's `remove`, which keeps the other cards' keys, and so their open editors.
 */
export function getColumnSwitchesToCarry({
  items,
  index,
}: GetColumnSwitchesToCarryOptions): Pick<
  InvoiceItemData,
  ItemPdfVisibilityFlag
> | null {
  const [removedFirst, nextFirst] = items;

  if (index !== 0 || !removedFirst || !nextFirst) return null;

  return Object.fromEntries(
    ITEM_PDF_VISIBILITY_FLAG_KEYS.map((key) => {
      return [key, removedFirst[key]];
    }),
  ) as Pick<InvoiceItemData, ItemPdfVisibilityFlag>;
}
