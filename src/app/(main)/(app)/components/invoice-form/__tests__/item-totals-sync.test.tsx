// @vitest-environment happy-dom

import { act, cleanup, render } from "@testing-library/react";
import { useCallback, useEffect, type RefObject } from "react";
import {
  type UseFormReturn,
  type UseFormSetValue,
  useForm,
} from "react-hook-form";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import type { InvoiceData, InvoiceItemData } from "@/app/schema";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import "@testing-library/jest-dom/vitest";

import { ItemTotalsSync } from "../item-totals-sync";

afterEach(() => {
  cleanup();
});

describe("ItemTotalsSync", () => {
  it("renders nothing", () => {
    const { container } = renderItemTotalsSync({
      items: [createItem()],
      total: 247.23,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("recalculates stale item amounts and the invoice total on mount", () => {
    const { formRef } = renderItemTotalsSync({
      items: [
        createItem({
          amount: 3,
          netPrice: 100,
          vat: 23,
          netAmount: 0,
          vatAmount: 0,
          preTaxAmount: 0,
        }),
      ],
      total: 0,
    });

    const { getValues } = getForm(formRef);

    expect(getValues("items.0")).toMatchObject({
      netAmount: 300,
      vatAmount: 69,
      preTaxAmount: 369,
    });
    expect(getValues("total")).toBe(369);
  });

  it("recalculates the edited item and sums every item into the total", () => {
    const { formRef } = renderItemTotalsSync({
      items: [createItem(), createItem()],
      total: 494.46,
    });

    const { getValues, setValue } = getForm(formRef);

    // 2 x 50 = 100 net, 23% VAT = 23, 123 pre-tax
    act(() => {
      setValue("items.1.netPrice", 50);
    });

    expect(getValues("items.1")).toMatchObject({
      netAmount: 100,
      vatAmount: 23,
      preTaxAmount: 123,
    });
    expect(getValues("items.0.preTaxAmount")).toBe(247.23);
    expect(getValues("total")).toBe(370.23);
  });

  it("writes the total with validation when it changes", () => {
    const { formRef, setValueSpy } = renderItemTotalsSync({
      items: [createItem()],
      total: 247.23,
    });

    setValueSpy.mockClear();

    act(() => {
      getForm(formRef).setValue("items.0.amount", 4);
    });

    expect(setValueSpy).toHaveBeenCalledWith("total", 494.46, {
      shouldValidate: true,
    });
  });

  /**
   * The re-render fix: a validating `setValue("total")` publishes new `formState.errors`,
   * which re-renders all of `InvoiceForm`. Edits that don't move the total -- a "Show in
   * PDF" switch, the item name -- must not write it at all.
   */
  it.each([
    { field: "amountFieldIsVisible", value: false },
    { field: "vatFieldIsVisible", value: false },
    { field: "name", value: "Renamed product" },
  ] as const)(
    "does not write the total when $field changes and the total stays the same",
    ({ field, value }) => {
      const { formRef, setValueSpy } = renderItemTotalsSync({
        items: [createItem()],
        total: 247.23,
      });

      setValueSpy.mockClear();

      act(() => {
        getForm(formRef).setValue(`items.0.${field}`, value);
      });

      expect(setValueSpy).not.toHaveBeenCalledWith(
        "total",
        expect.anything(),
        expect.anything(),
      );
      expect(getForm(formRef).getValues("total")).toBe(247.23);
    },
  );

  it.each([
    { case: "an amount cleared mid-edit", field: "amount", value: "" },
    { case: "a VAT rate above the allowed range", field: "vat", value: 500 },
  ] as const)(
    "leaves the totals alone while an item holds $case",
    ({ field, value }) => {
      const { formRef, setValueSpy } = renderItemTotalsSync({
        items: [createItem()],
        total: 247.23,
      });

      setValueSpy.mockClear();

      act(() => {
        getForm(formRef).setValue(`items.0.${field}`, value);
      });

      expect(setValueSpy).not.toHaveBeenCalled();
      expect(getForm(formRef).getValues("items.0")).toMatchObject({
        netAmount: 201,
        vatAmount: 46.23,
        preTaxAmount: 247.23,
      });
      expect(getForm(formRef).getValues("total")).toBe(247.23);
    },
  );
});

interface RenderItemTotalsSyncParams {
  items: InvoiceItemData[];
  total: number;
}

function renderItemTotalsSync({ items, total }: RenderItemTotalsSyncParams) {
  const formRef: RefObject<UseFormReturn<InvoiceData> | null> = {
    current: null,
  };
  const setValueSpy = vi.fn();

  const result = render(
    <ItemTotalsSyncTestHarness
      defaultValues={{ ...getInitialInvoiceData(), items, total }}
      formRef={formRef}
      setValueSpy={setValueSpy}
    />,
  );

  return { ...result, formRef, setValueSpy };
}

interface ItemTotalsSyncTestHarnessProps {
  defaultValues: InvoiceData;
  /** Filled in with the form, so tests can edit values and read them back. */
  formRef: RefObject<UseFormReturn<InvoiceData> | null>;
  /** Called with every `setValue` the component makes, before it reaches the form. */
  setValueSpy: Mock;
}

function ItemTotalsSyncTestHarness({
  defaultValues,
  formRef,
  setValueSpy,
}: ItemTotalsSyncTestHarnessProps) {
  const form = useForm<InvoiceData>({ defaultValues });

  // `render` wraps mount in `act`, so this has run by the time it returns
  useEffect(() => {
    formRef.current = form;
  }, [form, formRef]);

  const { setValue: formSetValue } = form;

  // Stable like the real `setValue`, since it is an effect dependency.
  const setValue = useCallback(
    (...args: Parameters<UseFormSetValue<InvoiceData>>) => {
      setValueSpy(...args);
      formSetValue(...args);
    },
    [formSetValue, setValueSpy],
  ) as UseFormSetValue<InvoiceData>;

  return (
    <ItemTotalsSync
      control={form.control}
      getValues={form.getValues}
      setValue={setValue}
    />
  );
}

function getForm(
  formRef: RefObject<UseFormReturn<InvoiceData> | null>,
): UseFormReturn<InvoiceData> {
  if (!formRef.current) {
    throw new Error("The test harness has not rendered the form yet");
  }

  return formRef.current;
}

function createItem(overrides: Partial<InvoiceItemData> = {}): InvoiceItemData {
  return { ...MOCK_INVOICE_ITEM_DATA, ...overrides };
}
