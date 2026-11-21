// @vitest-environment happy-dom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getInitialInvoiceData } from "@/app/constants";
import type { InvoiceData } from "@/app/schema";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MOCK_INVOICE_ITEM_DATA } from "@/utils/__tests__/data";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/analytics/track-event", () => {
  return {
    trackEvent: vi.fn(),
  };
});

import { trackEvent } from "@/lib/analytics/track-event";

import { InvoiceClosing } from "../invoice-closing";

interface HarnessProps {
  /** Overrides applied to the initial invoice. */
  overrides?: Partial<InvoiceData>;
  template?: InvoiceData["template"];
}

function Harness({ overrides, template = "default" }: HarnessProps) {
  const defaultValues = useMemo(() => {
    return {
      ...getInitialInvoiceData(),
      items: [MOCK_INVOICE_ITEM_DATA, MOCK_INVOICE_ITEM_DATA],
      total: 494.46,
      template,
      ...overrides,
    };
  }, [overrides, template]);

  const { control, getValues, setValue } = useForm<InvoiceData>({
    defaultValues,
  });

  useEffect(() => {
    formHandle.getValues = getValues;
  }, [getValues]);

  return (
    <TooltipProvider delayDuration={0}>
      <InvoiceClosing
        control={control}
        errors={{}}
        getValues={getValues}
        setValue={setValue}
        currency="EUR"
        template={template}
        numberFormatLocale="en"
        taxLabelText="VAT"
      />
    </TooltipProvider>
  );
}

const SIGNATURE = "data:image/png;base64,iVBORw0KGgo=";

/** The rendered form's `getValues`, so a test can check what an action stored. */
const formHandle: { getValues?: () => InvoiceData } = {};

function readForm(): InvoiceData {
  if (!formHandle.getValues) throw new Error("the form has not rendered yet");

  return formHandle.getValues();
}

function getPill(name: string) {
  return screen.getByRole("button", { name });
}

function getPart(name: string) {
  return screen.getByRole("region", { name });
}

describe("InvoiceClosing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    formHandle.getValues = undefined;
  });

  it("totals the items' net and tax amounts beside the invoice total", () => {
    render(<Harness />);

    // two mock items of 201.00 net and 46.23 VAT each
    expect(screen.getByTestId("totalNetAmount")).toHaveTextContent(
      "402.00 EUR",
    );
    expect(screen.getByTestId("totalVatAmount")).toHaveTextContent("92.46 EUR");
    expect(screen.getByTestId("total")).toHaveTextContent("494.46 EUR");
  });

  it("opens the parts a new invoice already prints, and keeps the QR code behind a pill", () => {
    render(<Harness />);

    expect(getPart("Payment method")).toBeInTheDocument();
    expect(getPart("Signatures")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "QR code" }),
    ).not.toBeInTheDocument();
    expect(getPill("QR code")).toBeInTheDocument();
  });

  it("opens a saved QR code, and leaves out a payment method the invoice hides and lacks", () => {
    render(
      <Harness
        overrides={{
          qrCodeData: "https://pay.example.com",
          paymentMethod: "",
          paymentMethodFieldIsVisible: false,
        }}
      />,
    );

    expect(getPart("QR code")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "QR code link or text" }),
    ).toHaveValue("https://pay.example.com");
    expect(getPill("Payment method")).toBeInTheDocument();
  });

  it("adds a QR code: opens its card, focuses the field and turns it on in the PDF", async () => {
    const user = userEvent.setup();

    render(<Harness overrides={{ qrCodeIsVisible: false }} />);

    await user.click(getPill("QR code"));

    const field = screen.getByRole("textbox", {
      name: "QR code link or text",
    });

    await vi.waitFor(() => {
      expect(field).toHaveFocus();
    });
    expect(
      within(getPart("QR code")).getByRole("switch", {
        name: "Show QR Code in PDF",
      }),
    ).toBeChecked();
    expect(trackEvent).toHaveBeenCalledWith({
      event: "add_invoice_closing_part",
      data: { part: "qr" },
    });
  });

  it("adds a part after the ones already open, where its pill was", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(getPill("QR code"));

    const order = screen.getAllByRole("region").map((region) => {
      return region.getAttribute("aria-label");
    });

    // a new invoice opens payment and signatures in PDF order; the QR code comes last
    expect(order).toEqual(["Payment method", "Signatures", "QR code"]);
  });

  it("removes the payment method: clears it, hides it and brings back its pill", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(
      screen.getByRole("button", { name: "Remove payment method" }),
    );

    expect(
      screen.queryByRole("region", { name: "Payment method" }),
    ).not.toBeInTheDocument();
    expect(readForm().paymentMethod).toBe("");
    expect(readForm().paymentMethodFieldIsVisible).toBe(false);

    await vi.waitFor(() => {
      expect(getPill("Payment method")).toHaveFocus();
    });
  });

  it("removes the signatures: clears both names, both drawings and both lines", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        overrides={{
          personAuthorizedToReceiveName: "Anna",
          personAuthorizedToIssueName: "Jan",
          personAuthorizedToIssueSignature: SIGNATURE,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove signatures" }));

    expect(readForm()).toMatchObject({
      personAuthorizedToReceiveName: "",
      personAuthorizedToReceiveSignature: "",
      personAuthorizedToReceiveFieldIsVisible: false,
      personAuthorizedToIssueName: "",
      personAuthorizedToIssueSignature: "",
      personAuthorizedToIssueFieldIsVisible: false,
    });
    expect(getPill("Signatures")).toBeInTheDocument();
  });

  it("offers a pad for each signer, and Clear empties a drawn signature", async () => {
    const user = userEvent.setup();
    render(
      <Harness overrides={{ personAuthorizedToIssueSignature: SIGNATURE }} />,
    );

    expect(
      screen.getByRole("img", { name: "Received by signature pad" }),
    ).toBeInTheDocument();
    // only the empty pad prompts to draw
    expect(screen.getAllByText("Draw signature")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Clear Received by signature" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Clear Issued by signature" }),
    );

    expect(readForm().personAuthorizedToIssueSignature).toBe("");
    expect(screen.getAllByText("Draw signature")).toHaveLength(2);
    expect(trackEvent).toHaveBeenCalledWith({
      event: "signature_cleared",
      data: { signer: "issued_by" },
    });
  });

  it("reports a QR code's data once, when the empty field first gets some", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(getPill("QR code"));
    await user.type(
      screen.getByRole("textbox", { name: "QR code link or text" }),
      "https://pay.example.com",
    );

    const dataEvents = vi.mocked(trackEvent).mock.calls.filter(([call]) => {
      return call.event === "qr_code_data_added";
    });

    expect(dataEvents).toEqual([
      [
        {
          event: "qr_code_data_added",
          data: { invoice_template: "default" },
        },
      ],
    ]);
  });

  it("opens the signatures for an invoice that only has a drawn signature", () => {
    render(
      <Harness
        overrides={{
          personAuthorizedToReceiveFieldIsVisible: false,
          personAuthorizedToIssueFieldIsVisible: false,
          personAuthorizedToIssueSignature: SIGNATURE,
        }}
      />,
    );

    expect(getPart("Signatures")).toBeInTheDocument();
  });

  it("offers only the QR code on the Stripe template, which prints no payment method or signatures", () => {
    render(<Harness template="stripe" />);

    expect(
      screen.queryByRole("region", { name: "Payment method" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Signatures" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Payment method" }),
    ).not.toBeInTheDocument();
    expect(getPill("QR code")).toBeInTheDocument();
  });
});
