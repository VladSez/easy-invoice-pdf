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
import type { InvoiceData, SupportedNumberFormatLocale } from "@/app/schema";
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

vi.mock("@/lib/umami-analytics-track-event", () => {
  return {
    umamiTrackEvent: vi.fn(),
  };
});

vi.mock("@/hooks/use-media-query", () => {
  return {
    useIsDesktop: () => {
      return true;
    },
  };
});

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

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
}

function InvoiceItemsTestHarness({
  itemCount,
  append,
  onRemove = vi.fn(),
  itemNames,
  numberFormatLocale = "en",
  template = "default",
}: InvoiceItemsTestHarnessProps) {
  const invoiceData = useMemo(() => {
    return {
      ...getInitialInvoiceData(),
      items: Array.from({ length: itemCount }, (_, index) => {
        return {
          ...MOCK_INVOICE_ITEM_DATA,
          name: itemNames?.[index] ?? MOCK_INVOICE_ITEM_DATA.name,
        };
      }),
    };
  }, [itemCount, itemNames]);

  const { control, getValues } = useForm<InvoiceData>({
    defaultValues: invoiceData,
  });

  // A real field array, so confirming a delete actually drops the item and re-indexes the
  // ones after it, the way `useFieldArray` does in the form.
  const {
    fields,
    append: appendField,
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
        errors={{}}
        currency="EUR"
        language="en"
        template={template}
        taxLabelText="VAT"
        numberFormatLocale={numberFormatLocale}
        getValues={getValues}
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
      typeOfGTU: "",
      typeOfGTUFieldIsVisible: true,
    });
    expect(umamiTrackEvent).toHaveBeenCalledWith("add_invoice_item");
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
    expect(umamiTrackEvent).not.toHaveBeenCalled();
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

  it("has no delete button for the first item, which cannot be removed", () => {
    renderInvoiceItems({ itemCount: 2 });

    expect(
      screen.queryByRole("button", { name: "Delete Invoice Item 1" }),
    ).not.toBeInTheDocument();
    expect(getDeleteItemButton(2)).toBeInTheDocument();
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

  it("gives every item but the first its own delete button", () => {
    renderInvoiceItems({ itemCount: ITEM_COUNT, itemNames: ITEM_NAMES });

    expect(getItemFieldsets()).toHaveLength(ITEM_COUNT);
    expect(
      screen.queryByRole("button", { name: "Delete Invoice Item 1" }),
    ).not.toBeInTheDocument();

    for (const itemNumber of [2, 3, 4]) {
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

  it("only offers the 'Show in PDF' column switches on the first item", () => {
    renderInvoiceItems({ itemCount: ITEM_COUNT, itemNames: ITEM_NAMES });

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

/** Previews print grouping spaces as no-break ones, so compare with plain spaces. */
function getPreviewText(pattern: RegExp) {
  return screen.getByText(pattern).textContent?.replaceAll("\u00A0", " ");
}

describe("InvoiceItems net price preview", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["en", "default", "12,345.67 EUR"],
    ["de", "default", "12.345,67 EUR"],
    ["pl", "default", "12 345,67 EUR"],
    ["international", "default", "12 345.67 EUR"],
    ["en", "stripe", "€12,345.67"],
    ["de", "stripe", "12.345,67 €"],
  ] as const)(
    "writes the preview in the '%s' number format for the '%s' template",
    async (numberFormatLocale, template, expectedPreview) => {
      const user = userEvent.setup();

      renderInvoiceItems({ itemCount: 1, numberFormatLocale, template });

      const netPriceInput = screen.getByRole("spinbutton", {
        name: /^Net Price/,
      });
      await user.clear(netPriceInput);
      await user.type(netPriceInput, "12345.67");

      expect(getPreviewText(/^Preview: .*12/)).toContain(
        `Preview: ${expectedPreview} (`,
      );
    },
  );
});

describe("InvoiceItems amount preview", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["en", "1,234.5"],
    ["de", "1.234,5"],
    ["pl", "1 234,5"],
    ["international", "1 234.5"],
  ] as const)(
    "writes the preview in the '%s' number format",
    async (numberFormatLocale, expectedPreview) => {
      const user = userEvent.setup();

      renderInvoiceItems({ itemCount: 1, numberFormatLocale });

      const amountInput = screen.getByRole("spinbutton", {
        name: /^Amount/,
      });
      await user.clear(amountInput);
      await user.type(amountInput, "1234.5");

      expect(getPreviewText(/^Preview: 1\D234/)).toBe(
        `Preview: ${expectedPreview}`,
      );
    },
  );
});

describe("InvoiceItems read-only amounts", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["en", { netAmount: "201.00", vatAmount: "46.23", preTaxAmount: "247.23" }],
    ["de", { netAmount: "201,00", vatAmount: "46,23", preTaxAmount: "247,23" }],
  ] as const)(
    "writes the calculated amounts in the '%s' number format",
    (numberFormatLocale, expectedAmounts) => {
      renderInvoiceItems({ itemCount: 1, numberFormatLocale });

      expect(screen.getByRole("textbox", { name: "Net Amount" })).toHaveValue(
        expectedAmounts.netAmount,
      );
      expect(screen.getByRole("textbox", { name: "VAT Amount" })).toHaveValue(
        expectedAmounts.vatAmount,
      );
      expect(
        screen.getByRole("textbox", { name: "Pre-tax Amount" }),
      ).toHaveValue(expectedAmounts.preTaxAmount);
    },
  );
});
