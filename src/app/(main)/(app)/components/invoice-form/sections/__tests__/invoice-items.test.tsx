// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo } from "react";
import {
  type Control,
  type UseFieldArrayAppend,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import type * as InvoiceSchema from "@/app/schema";
import type {
  InvoiceData,
  InvoiceItemData,
  SupportedNumberFormatLocale,
} from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import "@testing-library/jest-dom/vitest";

const { MOCK_MAX_INVOICE_ITEMS } = vi.hoisted(() => {
  return {
    MOCK_MAX_INVOICE_ITEMS: 5,
  };
});

vi.mock("@/app/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof InvoiceSchema>();

  return {
    ...actual,
    MAX_INVOICE_ITEMS: MOCK_MAX_INVOICE_ITEMS,
  };
});

vi.mock("@/lib/analytics/track-event", () => {
  return {
    trackEvent: vi.fn(),
  };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: () => {
      return true;
    },
  };
});

import { trackEvent } from "@/lib/analytics/track-event";

import { InvoiceItems } from "../invoice-items";

interface InvoiceItemsTestHarnessProps {
  itemCount: number;
  append?: UseFieldArrayAppend<InvoiceData, "items">;
  onRemove?: (index: number) => void;
  /** Overrides the name of the item at each given index. */
  itemNames?: Record<number, string>;
  /** The invoice's resolved number format, `en` unless a test picks another one. */
  numberFormatLocale?: SupportedNumberFormatLocale;
  /** The invoice's template, `default` unless a test picks another one. */
  template?: InvoiceData["template"];
  /** Overrides applied to every item, e.g. to start with a discount. */
  itemOverrides?: Partial<InvoiceItemData>;
}

function InvoiceItemsTestHarness({
  itemCount,
  append,
  onRemove = vi.fn(),
  itemNames,
  numberFormatLocale = "en",
  template = "default",
  itemOverrides,
}: InvoiceItemsTestHarnessProps) {
  const invoiceData = useMemo(() => {
    return {
      ...getInitialInvoiceData(),
      items: Array.from({ length: itemCount }, (_, index) => {
        return {
          ...MOCK_INVOICE_ITEM_DATA,
          ...itemOverrides,
          name: itemNames?.[index] ?? MOCK_INVOICE_ITEM_DATA.name,
        };
      }),
    };
  }, [itemCount, itemNames, itemOverrides]);

  const { control, getValues, setValue } = useForm<InvoiceData>({
    defaultValues: invoiceData,
  });

  // A real field array, so confirming a delete actually drops the item and re-indexes the
  // ones after it, the way `useFieldArray` does in the form.
  const {
    fields,
    append: appendField,
    insert,
    remove,
  } = useFieldArray({ control, name: "items" });

  return (
    <TooltipProvider delayDuration={0}>
      <InvoiceItems
        control={control as Control<InvoiceData>}
        fields={fields}
        handleRemoveInvoiceItem={(index) => {
          onRemove(index);
          remove(index);
        }}
        append={append ?? appendField}
        insert={insert}
        errors={{}}
        currency="EUR"
        template={template}
        taxLabelText="VAT"
        numberFormatLocale={numberFormatLocale}
        language="en"
        getValues={getValues}
        setValue={setValue}
      />
    </TooltipProvider>
  );
}

function renderInvoiceItems(props: InvoiceItemsTestHarnessProps) {
  return render(<InvoiceItemsTestHarness {...props} />);
}

function getAddInvoiceItemButton() {
  return screen.getByRole("button", { name: "Add invoice item" });
}

function getDeleteItemButton(itemNumber: number) {
  return screen.getByRole("button", {
    name: `Delete Invoice Item ${itemNumber}`,
  });
}

function getDialog() {
  return screen.getByRole("alertdialog");
}

function getItemFieldsets() {
  return screen.getAllByRole("group", { name: /^Item \d+$/ });
}

describe("InvoiceItems max invoice items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("enables the add button when below the item limit", () => {
    renderInvoiceItems({ itemCount: MOCK_MAX_INVOICE_ITEMS - 1 });

    expect(getAddInvoiceItemButton()).toBeEnabled();
  });

  it("disables the add button when the item limit is reached", () => {
    renderInvoiceItems({ itemCount: MOCK_MAX_INVOICE_ITEMS });

    expect(getAddInvoiceItemButton()).toBeDisabled();
  });

  it("appends a new item with default values when below the limit", async () => {
    const user = userEvent.setup();
    const append = vi.fn();

    renderInvoiceItems({
      itemCount: MOCK_MAX_INVOICE_ITEMS - 1,
      append,
    });

    await user.click(getAddInvoiceItemButton());

    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith({
      invoiceItemNumberIsVisible: true,
      name: "",
      nameFieldIsVisible: true,
      amount: 1,
      amountFieldIsVisible: true,
      unit: "",
      unitFieldIsVisible: true,
      netPrice: 0,
      netPriceFieldIsVisible: true,
      vat: "NP",
      vatFieldIsVisible: true,
      netAmount: 0,
      netAmountFieldIsVisible: true,
      vatAmount: 0,
      vatAmountFieldIsVisible: true,
      preTaxAmount: 0,
      preTaxAmountFieldIsVisible: true,
      discountType: "percentage",
      discountValue: 0,
      discountLabel: "",
      discountAmount: 0,
      typeOfGTU: "",
      typeOfGTUFieldIsVisible: true,
    });
    expect(trackEvent).toHaveBeenCalledWith({ event: "add_invoice_item" });
  });

  it("does not append when the item limit is reached", async () => {
    const user = userEvent.setup();
    const append = vi.fn();

    renderInvoiceItems({
      itemCount: MOCK_MAX_INVOICE_ITEMS,
      append,
    });

    await user.click(getAddInvoiceItemButton());

    expect(append).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("shows the max items tooltip when the limit is reached", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: MOCK_MAX_INVOICE_ITEMS });

    await user.hover(getAddInvoiceItemButton());

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      `Invoices support at most ${MOCK_MAX_INVOICE_ITEMS} line items`,
    );
  });

  it("shows the default add-item tooltip when below the limit", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.hover(getAddInvoiceItemButton());

    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Add a new line item with name, quantity, price and tax details",
    );
  });

  it("renders one fieldset per invoice item", () => {
    renderInvoiceItems({ itemCount: 2 });

    const fieldsets = screen.getAllByRole("group", { name: /Item \d+/ });

    expect(fieldsets).toHaveLength(2);
    expect(within(fieldsets[0]).getByText("Item 1")).toBeInTheDocument();
    expect(within(fieldsets[1]).getByText("Item 2")).toBeInTheDocument();
  });
});

describe("InvoiceItems delete confirmation dialog", () => {
  // The dialog's own copy, truncation and focus behaviour is covered directly in
  // `sections/components/__tests__/delete-invoice-item-dialog.test.tsx`. What is left here is
  // the wiring: that the trash buttons open it for the right item, name it from the *form*
  // rather than from a debounced copy of the data, and hand the right index back on confirm.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render the dialog until an item's delete button is pressed", () => {
    renderInvoiceItems({ itemCount: 2 });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("offers no delete button while the invoice has a single item", () => {
    renderInvoiceItems({ itemCount: 1 });

    expect(
      screen.queryByRole("button", { name: "Delete Invoice Item 1" }),
    ).not.toBeInTheDocument();
  });

  it("lets the first item be deleted once there is another one", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({ itemCount: 2, onRemove });

    await user.click(getDeleteItemButton(1));
    await user.click(screen.getByRole("button", { name: "Delete Item 1" }));

    expect(onRemove).toHaveBeenCalledExactlyOnceWith(0);
  });

  it("names the item the user is deleting, reading the name from the form", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 2, itemNames: { 1: "Consulting" } });

    // Rename the item, then delete it straight away: the dialog has to pick up the edit that
    // is still sitting in the form rather than the name the invoice data was created with.
    const itemNameInput = screen.getByLabelText("Name", {
      selector: "#itemName1",
    });
    await user.clear(itemNameInput);
    await user.type(itemNameInput, "Renamed just now");

    await user.click(getDeleteItemButton(2));

    expect(getDialog()).toHaveTextContent('"Renamed just now"');
  });

  it("passes the pressed item's index to the remove handler", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({ itemCount: 3, onRemove });

    await user.click(getDeleteItemButton(3));
    await user.click(screen.getByRole("button", { name: "Delete Item 3" }));

    expect(onRemove).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("does not remove anything when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({ itemCount: 2, onRemove });

    await user.click(getDeleteItemButton(2));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe("InvoiceItems with several invoice items", () => {
  /** Distinct names, so a test can tell which item the UI actually acted on. */
  const ITEM_NAMES = {
    0: "Design work",
    1: "Backend work",
    2: "QA work",
    3: "Docs work",
  };

  const ITEM_COUNT = 4;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("gives every item its own delete button", () => {
    renderInvoiceItems({ itemCount: ITEM_COUNT, itemNames: ITEM_NAMES });

    expect(getItemFieldsets()).toHaveLength(ITEM_COUNT);

    for (const itemNumber of [1, 2, 3, 4]) {
      expect(getDeleteItemButton(itemNumber)).toBeInTheDocument();
    }
  });

  it.each([
    [2, "Backend work"],
    [3, "QA work"],
    [4, "Docs work"],
  ])(
    "opens the dialog for item %i and names it %s",
    async (itemNumber, expectedName) => {
      const user = userEvent.setup();

      renderInvoiceItems({ itemCount: ITEM_COUNT, itemNames: ITEM_NAMES });

      await user.click(getDeleteItemButton(itemNumber));

      const dialog = getDialog();

      expect(
        within(dialog).getByRole("heading", {
          name: `Delete Item ${itemNumber}?`,
        }),
      ).toBeInTheDocument();
      expect(dialog).toHaveTextContent(`"${expectedName}"`);
    },
  );

  it("removes a middle item and renumbers the ones after it", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({
      itemCount: ITEM_COUNT,
      itemNames: ITEM_NAMES,
      onRemove,
    });

    await user.click(getDeleteItemButton(2));
    await user.click(screen.getByRole("button", { name: "Delete Item 2" }));

    expect(onRemove).toHaveBeenCalledExactlyOnceWith(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    // Three items remain, numbered without a gap
    expect(getItemFieldsets()).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Delete Invoice Item 4" }),
    ).not.toBeInTheDocument();

    // ...and what used to be item 3 has slid into position 2, name and all
    await user.click(getDeleteItemButton(2));

    expect(getDialog()).toHaveTextContent('"QA work"');
  });

  it("removes the last item without disturbing the ones before it", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({
      itemCount: ITEM_COUNT,
      itemNames: ITEM_NAMES,
      onRemove,
    });

    await user.click(getDeleteItemButton(ITEM_COUNT));
    await user.click(
      screen.getByRole("button", { name: `Delete Item ${ITEM_COUNT}` }),
    );

    expect(onRemove).toHaveBeenCalledExactlyOnceWith(ITEM_COUNT - 1);
    expect(getItemFieldsets()).toHaveLength(3);

    await user.click(getDeleteItemButton(3));

    expect(getDialog()).toHaveTextContent('"QA work"');
  });

  it("keeps every item when the dialog is cancelled", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({
      itemCount: ITEM_COUNT,
      itemNames: ITEM_NAMES,
      onRemove,
    });

    await user.click(getDeleteItemButton(3));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(getItemFieldsets()).toHaveLength(ITEM_COUNT);
  });

  it("deletes repeatedly, targeting the right item each time", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    renderInvoiceItems({
      itemCount: ITEM_COUNT,
      itemNames: ITEM_NAMES,
      onRemove,
    });

    // Delete "Backend work" (item 2), then "QA work" which takes its place
    await user.click(getDeleteItemButton(2));
    await user.click(screen.getByRole("button", { name: "Delete Item 2" }));

    await user.click(getDeleteItemButton(2));
    expect(getDialog()).toHaveTextContent('"QA work"');
    await user.click(screen.getByRole("button", { name: "Delete Item 2" }));

    expect(onRemove).toHaveBeenNthCalledWith(1, 1);
    expect(onRemove).toHaveBeenNthCalledWith(2, 1);
    expect(getItemFieldsets()).toHaveLength(2);

    // "Design work" and "Docs work" are what survive
    await user.click(getDeleteItemButton(2));

    expect(getDialog()).toHaveTextContent('"Docs work"');
  });

  // Type of GTU is the exception: its card can be open on any item, so each open card
  // carries the (shared) column switch. These items have no code, so their cards are shut.
  it("only offers the 'Show in PDF' column switches on the first item", () => {
    renderInvoiceItems({
      itemCount: ITEM_COUNT,
      itemNames: ITEM_NAMES,
      itemOverrides: { typeOfGTU: "" },
    });

    const fieldsets = getItemFieldsets();

    expect(
      within(fieldsets[0]).getAllByRole("switch", {
        name: /Show the .* Column/,
      }).length,
    ).toBeGreaterThan(0);

    for (const fieldset of fieldsets.slice(1)) {
      expect(
        within(fieldset).queryByRole("switch", { name: /Show the .* Column/ }),
      ).not.toBeInTheDocument();
    }
  });
});

/** Money is written with no-break grouping spaces, so compare with plain spaces. */
function getAmountText(testId: string) {
  return screen.getByTestId(testId).textContent?.replaceAll("\u00A0", " ");
}

describe("InvoiceItems unit price preview", () => {
  afterEach(() => {
    cleanup();
  });

  it("writes the price as the PDF does, and in words, under the field", () => {
    renderInvoiceItems({ itemCount: 1, itemOverrides: { netPrice: 12_345.5 } });

    const preview = screen.getByText(/^Preview:/);

    expect(preview).toHaveTextContent(/12,345\.50 EUR/);
    expect(preview).toHaveTextContent(/EUR 50\/100\)$/);
  });

  it("follows the invoice's number format", () => {
    renderInvoiceItems({
      itemCount: 1,
      numberFormatLocale: "de",
      itemOverrides: { netPrice: 12_345.5 },
    });

    expect(screen.getByText(/^Preview:/)).toHaveTextContent(/12\.345,50 EUR/);
  });
});

describe("InvoiceItems duplicate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("puts a copy of the item right after it", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({
      itemCount: 2,
      itemNames: { 0: "Design work", 1: "Backend work" },
    });

    await user.click(
      screen.getByRole("button", { name: "Duplicate Invoice Item 1" }),
    );

    const names = screen
      .getAllByRole("textbox", { name: "Name" })
      .map((input) => {
        return (input as HTMLTextAreaElement).value;
      });

    expect(names).toEqual(["Design work", "Design work", "Backend work"]);
    expect(trackEvent).toHaveBeenCalledWith({
      event: "duplicate_invoice_item",
    });
  });

  it("cannot duplicate once the item limit is reached", () => {
    renderInvoiceItems({ itemCount: MOCK_MAX_INVOICE_ITEMS });

    expect(
      screen.getByRole("button", { name: "Duplicate Invoice Item 1" }),
    ).toBeDisabled();
  });
});

describe("InvoiceItems quantity and unit", () => {
  afterEach(() => {
    cleanup();
  });

  it("steps the quantity by one and keeps a typed fraction", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    const quantity = screen.getByRole("spinbutton", { name: "Qty" });

    await user.click(
      screen.getByRole("button", { name: "Increase quantity of item 1" }),
    );
    expect(quantity).toHaveValue(3);

    await user.clear(quantity);
    await user.type(quantity, "1.5");
    await user.click(
      screen.getByRole("button", { name: "Increase quantity of item 1" }),
    );
    expect(quantity).toHaveValue(2.5);
  });

  it("does not step the quantity below zero", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1, itemOverrides: { amount: 1 } });

    const decrease = screen.getByRole("button", {
      name: "Decrease quantity of item 1",
    });

    await user.click(decrease);

    expect(screen.getByRole("spinbutton", { name: "Qty" })).toHaveValue(0);
    expect(decrease).toBeDisabled();
  });

  it("fills in the unit from a chip and marks the chip picked", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    expect(screen.getByRole("button", { name: "pcs" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "days" }));

    expect(screen.getByRole("textbox", { name: "Unit" })).toHaveValue("days");
    expect(screen.getByRole("button", { name: "days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "pcs" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows a % suffix only while the tax rate is a number", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    const rate = screen.getByRole("textbox", { name: "VAT rate" });

    expect(within(screen.getByTestId("itemVat0")).getByText("%")).toBeVisible();

    await user.clear(rate);
    await user.type(rate, "NP");

    expect(
      within(screen.getByTestId("itemVat0")).queryByText("%"),
    ).not.toBeInTheDocument();
  });
});

describe("InvoiceItems tax settings", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the shared label on the first item only, and names the tax on later rates", () => {
    renderInvoiceItems({ itemCount: 2 });

    const [first, second] = getItemFieldsets();

    expect(
      within(first).getByRole("group", { name: "Tax settings" }),
    ).toBeInTheDocument();
    expect(
      within(first).getByRole("textbox", { name: "Tax label" }),
    ).toHaveValue("VAT");
    expect(within(first).getByText("Rate")).toBeInTheDocument();

    expect(
      within(second).queryByRole("textbox", { name: "Tax label" }),
    ).not.toBeInTheDocument();
    expect(within(second).getByText("VAT rate")).toBeInTheDocument();
    expect(
      within(second).getByRole("textbox", { name: "VAT rate" }),
    ).toBeInTheDocument();
  });

  it("sets the rate from a chip and marks the chip that matches the value", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    const rate = screen.getByRole("textbox", { name: "VAT rate" });

    // the mock item's rate is 23
    expect(screen.getByRole("button", { name: "23%" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "NP" }));

    expect(rate).toHaveValue("NP");
    expect(screen.getByRole("button", { name: "NP" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "23%" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "8%" }));

    expect(rate).toHaveValue("8");
  });

  it("marks a chip for a typed rate too, and none for a rate without a chip", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    const rate = screen.getByRole("textbox", { name: "VAT rate" });

    await user.clear(rate);
    await user.type(rate, "5");

    expect(screen.getByRole("button", { name: "5%" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.type(rate, "0");

    const chips = within(
      screen.getByRole("group", { name: "Common rates for item 1" }),
    ).getAllByRole("button");

    for (const chip of chips) {
      expect(chip).toHaveAttribute("aria-pressed", "false");
    }
  });
});

describe("InvoiceItems calculated amounts", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    [
      "en",
      "default",
      { net: "201.00 EUR", vat: "46.23 EUR", preTax: "247.23 EUR" },
    ],
    [
      "de",
      "default",
      { net: "201,00 EUR", vat: "46,23 EUR", preTax: "247,23 EUR" },
    ],
    ["en", "stripe", { net: "€201.00", vat: "€46.23", preTax: "€247.23" }],
  ] as const)(
    "writes them in the '%s' number format for the '%s' template",
    (numberFormatLocale, template, expected) => {
      renderInvoiceItems({ itemCount: 1, numberFormatLocale, template });

      expect(getAmountText("itemNetAmount0")).toBe(expected.net);
      expect(getAmountText("itemVatAmount0")).toBe(expected.vat);
      expect(getAmountText("itemPreTaxAmount0")).toBe(expected.preTax);
    },
  );

  it("adds a discount line only when the discount takes something off", () => {
    renderInvoiceItems({
      itemCount: 2,
      itemNames: { 0: "No discount", 1: "Discounted" },
    });

    expect(
      screen.queryByTestId("itemDiscountSummary0"),
    ).not.toBeInTheDocument();
    cleanup();

    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: { discountValue: 10, discountAmount: 20.1 },
    });

    expect(getAmountText("itemDiscountSummary0")).toBe(
      "Discount 10%of 201.00 EUR subtotal−20.10 EUR",
    );
  });

  it("names the discount with its PDF label when it has one", () => {
    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: {
        discountValue: 10,
        discountAmount: 20.1,
        discountLabel: "Loyalty discount",
      },
    });

    expect(getAmountText("itemDiscountSummary0")).toBe(
      "Loyalty discount 10%of 201.00 EUR subtotal−20.10 EUR",
    );
  });

  it("writes a fixed-amount discount as money", () => {
    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: {
        discountType: "amount",
        discountValue: 25,
        discountAmount: 25,
      },
    });

    expect(getAmountText("itemDiscountSummary0")).toBe(
      "Discountof 201.00 EUR subtotal−25.00 EUR",
    );
  });
});

/** The custom column's pill on an item: "Custom column" until the column has a name. */
function getCustomColumnPill(name = "Custom column") {
  return screen.getByRole("button", { name });
}

/** The column's shared "In PDF" switch, as an open card on item `itemNumber` shows it. */
function getCustomColumnSwitch(itemNumber = 1) {
  return screen.getByRole("switch", {
    name: `Show the custom column in the PDF for item ${itemNumber}`,
  });
}

describe("InvoiceItems custom column", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the column behind a pill while the item has no value", () => {
    renderInvoiceItems({ itemCount: 1, itemOverrides: { typeOfGTU: "" } });

    expect(getCustomColumnPill()).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Column name" }),
    ).not.toBeInTheDocument();
  });

  it("asks for the column's name, focuses it and turns the column on", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: { typeOfGTU: "", typeOfGTUFieldIsVisible: false },
    });

    await user.click(getCustomColumnPill());

    await vi.waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Column name" }),
      ).toHaveFocus();
    });
    expect(screen.getByRole("textbox", { name: "Value" })).toBeInTheDocument();
    expect(getCustomColumnSwitch()).toBeChecked();
    expect(trackEvent).toHaveBeenCalledWith({
      event: "add_item_custom_column",
    });
  });

  it("names the other items' pills after the column, and asks them only for a value", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 2, itemOverrides: { typeOfGTU: "" } });

    const [firstPill] = screen.getAllByRole("button", {
      name: "Custom column",
    });

    await user.click(firstPill);
    await user.type(
      screen.getByRole("textbox", { name: "Column name" }),
      "Project code",
    );

    // item 2's pill now names the column; its card asks only for the value
    await user.click(getCustomColumnPill("Project code"));

    expect(
      screen.getAllByRole("textbox", { name: "Column name" }),
    ).toHaveLength(1);
    await vi.waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Project code" }),
      ).toHaveFocus();
    });
  });

  it('opens an item that already has a value, and keeps "Type of GTU" while the column has no name', () => {
    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: { typeOfGTU: "GTU_01" },
    });

    expect(screen.getByRole("textbox", { name: "Value" })).toHaveValue(
      "GTU_01",
    );
    // an invoice from before columns had names still prints its old header
    expect(
      screen.getByText(/Left empty, it prints .Type of GTU./),
    ).toBeVisible();
  });

  it("removes the last value: the column leaves the PDF and its name is forgotten", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1, itemOverrides: { typeOfGTU: "" } });

    await user.click(getCustomColumnPill());
    await user.type(
      screen.getByRole("textbox", { name: "Column name" }),
      "SKU",
    );
    await user.type(screen.getByRole("textbox", { name: "Value" }), "A-1");
    await user.click(
      screen.getByRole("button", {
        name: "Remove the custom column value from item 1",
      }),
    );

    await vi.waitFor(() => {
      expect(getCustomColumnPill()).toHaveFocus();
    });
    expect(trackEvent).toHaveBeenCalledWith({
      event: "remove_item_custom_column",
    });

    await user.click(getCustomColumnPill());

    expect(screen.getByRole("textbox", { name: "Column name" })).toHaveValue(
      "",
    );
    expect(screen.getByRole("textbox", { name: "Value" })).toHaveValue("");
  });

  it("keeps the column on while another item still has a value", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({
      itemCount: 2,
      itemOverrides: { typeOfGTU: "GTU_01", typeOfGTUFieldIsVisible: true },
    });

    await user.click(
      screen.getByRole("button", {
        name: "Remove the custom column value from item 2",
      }),
    );

    expect(getCustomColumnSwitch()).toBeChecked();
  });

  it("offers the custom column on the Stripe template too", () => {
    renderInvoiceItems({
      itemCount: 1,
      template: "stripe",
      itemOverrides: { typeOfGTU: "" },
    });

    expect(getCustomColumnPill()).toBeInTheDocument();
  });
});

describe("InvoiceItems discount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the discount collapsed behind a button when the item has none", () => {
    renderInvoiceItems({ itemCount: 1 });

    expect(
      screen.getByRole("button", { name: "Add discount" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Discount value")).not.toBeInTheDocument();
  });

  it("opens the discount fields and focuses the value", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));

    expect(screen.getByLabelText("Discount value")).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Percentage" })).toBeChecked();
    expect(screen.getByLabelText(/^Label in PDF/)).toHaveValue("");
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      event: "add_item_discount",
    });
  });

  it("switches between a percentage and a fixed amount", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));
    await user.click(screen.getByRole("radio", { name: "Fixed amount" }));

    expect(screen.getByRole("radio", { name: "Fixed amount" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Percentage" })).not.toBeChecked();
    expect(trackEvent).toHaveBeenCalledWith({
      event: "change_item_discount_type",
      data: { discount_type: "amount" },
    });
  });

  it("moves between discount types with the arrow keys, as one tab stop", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));

    const percentage = screen.getByRole("radio", { name: "Percentage" });
    const fixedAmount = screen.getByRole("radio", { name: "Fixed amount" });

    expect(percentage).toHaveAttribute("tabindex", "0");
    expect(fixedAmount).toHaveAttribute("tabindex", "-1");

    percentage.focus();
    await user.keyboard("{ArrowRight}");

    expect(fixedAmount).toBeChecked();
    expect(fixedAmount).toHaveFocus();

    // wraps around
    await user.keyboard("{ArrowRight}");

    expect(percentage).toBeChecked();
    expect(percentage).toHaveFocus();
  });

  it("takes both a percentage and a fixed amount as numbers", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));

    expect(screen.getByLabelText("Discount value")).toHaveAttribute(
      "type",
      "number",
    );

    await user.click(screen.getByRole("radio", { name: "Fixed amount" }));

    expect(screen.getByLabelText("Discount value")).toHaveAttribute(
      "type",
      "number",
    );
  });

  it("clears the value when switching between a percentage and a fixed amount", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));
    await user.type(screen.getByLabelText("Discount value"), "10");

    expect(screen.getByLabelText("Discount value")).toHaveValue(10);

    await user.click(screen.getByRole("radio", { name: "Fixed amount" }));

    expect(screen.getByLabelText("Discount value")).toHaveValue(null);

    // picking the type that is already selected keeps the value
    await user.type(screen.getByLabelText("Discount value"), "50");
    await user.click(screen.getByRole("radio", { name: "Fixed amount" }));

    expect(screen.getByLabelText("Discount value")).toHaveValue(50);
    // re-picking the selected type is not a change
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it("explains a percentage and a fixed amount before a value is entered", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1 });

    await user.click(screen.getByRole("button", { name: "Add discount" }));

    expect(
      screen.getByText(
        "Enter a percentage from 0 to 100. It applies to the line total, before tax.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Fixed amount" }));

    expect(
      screen.getByText(
        "Enter an amount up to the line total. It applies once to the whole line, not per unit.",
      ),
    ).toBeInTheDocument();
  });

  it("says there is nothing to discount while the line total is 0", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({ itemCount: 1, itemOverrides: { netPrice: 0 } });

    await user.click(screen.getByRole("button", { name: "Add discount" }));

    expect(
      screen.getByText(
        "The line total (Qty × Unit price) is 0, so there's nothing to discount yet.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Enter a percentage from 0 to 100/),
    ).not.toBeInTheDocument();
  });

  it("starts open for an item that already has a discount", () => {
    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: {
        discountType: "amount",
        discountValue: 50,
        discountLabel: "Charitable donation",
      },
    });

    expect(screen.getByLabelText("Discount value")).toHaveValue(50);
    expect(screen.getByLabelText("Discount value")).not.toHaveFocus();
    expect(screen.getByLabelText(/^Label in PDF/)).toHaveValue(
      "Charitable donation",
    );
    expect(screen.getByRole("radio", { name: "Fixed amount" })).toBeChecked();
  });

  it("clears the discount on remove and hands focus back to the add button", async () => {
    const user = userEvent.setup();

    renderInvoiceItems({
      itemCount: 1,
      itemOverrides: { discountValue: 10, discountLabel: "Loyalty" },
    });

    await user.click(screen.getByRole("button", { name: "Remove discount" }));

    const addButton = await screen.findByRole("button", {
      name: "Add discount",
    });
    await vi.waitFor(() => {
      expect(addButton).toHaveFocus();
    });
    expect(trackEvent).toHaveBeenCalledExactlyOnceWith({
      event: "remove_item_discount",
    });

    // reopening shows the cleared fields, not the removed discount
    await user.click(addButton);

    // the cleared zero shows as the empty placeholder
    expect(screen.getByLabelText("Discount value")).toHaveValue(null);
    expect(screen.getByLabelText(/^Label in PDF/)).toHaveValue("");
  });
});
