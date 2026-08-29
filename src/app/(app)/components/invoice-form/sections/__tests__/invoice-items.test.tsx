// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMemo } from "react";
import {
  type Control,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  useForm,
} from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import type * as InvoiceSchema from "@/app/schema";
import type { InvoiceData } from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import "@testing-library/jest-dom/vitest";

const { MOCK_MAX_INVOICE_ITEMS } = vi.hoisted(() => {
  return {
    MOCK_MAX_INVOICE_ITEMS: 3,
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
}

function InvoiceItemsTestHarness({
  itemCount,
  append = vi.fn(),
  onRemove = vi.fn(),
}: InvoiceItemsTestHarnessProps) {
  const invoiceData = useMemo(() => {
    return {
      ...getInitialInvoiceData(),
      items: Array.from({ length: itemCount }, () => {
        return {
          ...MOCK_INVOICE_ITEM_DATA,
        };
      }),
    };
  }, [itemCount]);

  const { control } = useForm<InvoiceData>({
    defaultValues: invoiceData,
  });

  const fields = Array.from({ length: itemCount }, (_, index) => {
    return {
      id: `item-${index}`,
    };
  }) as FieldArrayWithId<InvoiceData, "items">[];

  return (
    <TooltipProvider delayDuration={0}>
      <InvoiceItems
        control={control as Control<InvoiceData>}
        fields={fields}
        handleRemoveInvoiceItem={onRemove}
        append={append}
        errors={{}}
        currency="EUR"
        language="en"
        template="default"
        taxLabelText="VAT"
        invoiceData={invoiceData}
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
