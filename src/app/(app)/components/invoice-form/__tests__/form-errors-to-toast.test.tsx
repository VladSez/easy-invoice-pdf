// @vitest-environment happy-dom

import type { InvoiceData } from "@/app/schema";
import type { FieldErrors } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import "@testing-library/jest-dom/vitest";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    error: vi.fn(),
  }),
}));

import { toast } from "sonner";
import { formErrorsToToast } from "../utils/form-errors-to-toast";

function renderToastContent(content: unknown) {
  render(content as ReactElement);
}

describe("formErrorsToToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("does not call toast.error when errors object is empty", () => {
    formErrorsToToast({ errors: {}, isMobile: false });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows flat field error messages", () => {
    const errors = {
      notes: { type: "required", message: "Notes are required" },
    } satisfies FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: false });

    expect(toast.error).toHaveBeenCalledTimes(1);

    const [content, options] = vi.mocked(toast.error).mock.calls[0];

    renderToastContent(content);

    expect(
      screen.getByText("Please fix the following errors:"),
    ).toBeInTheDocument();
    expect(screen.getByText("Notes are required")).toBeInTheDocument();
    expect(options).toEqual({
      id: "form-errors-error-toast",
      duration: 15_000,
      position: "bottom-right",
    });
  });

  it("shows nested object field error messages", () => {
    const errors = {
      seller: {
        name: { type: "required", message: "Seller name is required" },
        vatNo: { type: "required", message: "Seller VAT number is required" },
      },
    } satisfies FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: false });

    const [content] = vi.mocked(toast.error).mock.calls[0];
    renderToastContent(content);

    expect(screen.getByText("Seller name is required")).toBeInTheDocument();
    expect(
      screen.getByText("Seller VAT number is required"),
    ).toBeInTheDocument();
  });

  it("shows array item field error messages", () => {
    const errors = {
      items: [
        {
          name: { type: "required", message: "Item name is required" },
          amount: { type: "min", message: "Amount must be positive" },
        },
        {
          netPrice: { type: "required", message: "Net price is required" },
        },
      ],
    } satisfies FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: false });

    const [content] = vi.mocked(toast.error).mock.calls[0];
    renderToastContent(content);

    expect(screen.getByText("Item name is required")).toBeInTheDocument();
    expect(screen.getByText("Amount must be positive")).toBeInTheDocument();
    expect(screen.getByText("Net price is required")).toBeInTheDocument();
  });

  it("falls back to Unknown error when message is missing", () => {
    const errors = {
      notes: { type: "required" },
      seller: {
        name: { type: "required" },
      },
      items: [
        {
          name: { type: "required" },
        },
      ],
    } as FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: false });

    const [content] = vi.mocked(toast.error).mock.calls[0];
    renderToastContent(content);

    expect(screen.getAllByText("Unknown error")).toHaveLength(3);
  });

  it("uses top-center position on mobile", () => {
    const errors = {
      notes: { type: "required", message: "Required" },
    } as const satisfies FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: true });

    const [, options] = vi.mocked(toast.error).mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        position: "top-center",
      }),
    );
  });

  it("uses bottom-right position on desktop", () => {
    const errors = {
      notes: { type: "required", message: "Required" },
    } as const satisfies FieldErrors<InvoiceData>;

    formErrorsToToast({ errors, isMobile: false });

    const [, options] = vi.mocked(toast.error).mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        position: "bottom-right",
      }),
    );
  });
});
