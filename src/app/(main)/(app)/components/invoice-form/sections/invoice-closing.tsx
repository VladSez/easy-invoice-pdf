import { memo, useState } from "react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";

import {
  ErrorMessage,
  hiddenInPdfClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import { AddPillButton } from "@/app/(main)/(app)/components/invoice-form/sections/components/add-pill-button";
import { InPdfSwitch } from "@/app/(main)/(app)/components/invoice-form/sections/components/pdf-column-switch";
import { SignaturePad } from "@/app/(main)/(app)/components/invoice-form/sections/components/signature-pad";
import { formatMoneyForTemplate } from "@/app/(main)/(app)/utils/format-money-for-template";
import type {
  InvoiceData,
  SupportedCurrencies,
  SupportedNumberFormatLocale,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";

/**
 * Everything under the items: the totals, the notes, and the optional parts of the PDF's
 * footer (payment method, QR code, signatures). An optional part waits behind a pill until
 * it's added, and the open ones are listed in the order the PDF prints them.
 */
export const InvoiceClosing = memo(function InvoiceClosing({
  control,
  errors,
  getValues,
  setValue,
  currency,
  template,
  numberFormatLocale,
  taxLabelText,
}: InvoiceClosingProps) {
  const isDefaultTemplate = template === "default";

  // A part starts open when the PDF already prints it, so a saved invoice looks the same
  // here as in its PDF: the payment method and signature lines print by default, a QR
  // code only once it has data.
  const [openParts, setOpenParts] = useState<Record<ClosingPart, boolean>>(
    () => {
      const data = getValues();

      return {
        payment:
          data.paymentMethodFieldIsVisible || Boolean(data.paymentMethod),
        qr: Boolean(data.qrCodeData),
        signatures:
          data.personAuthorizedToReceiveFieldIsVisible ||
          data.personAuthorizedToIssueFieldIsVisible ||
          Boolean(data.personAuthorizedToReceiveName) ||
          Boolean(data.personAuthorizedToIssueName) ||
          Boolean(data.personAuthorizedToReceiveSignature) ||
          Boolean(data.personAuthorizedToIssueSignature),
      };
    },
  );

  // the Stripe template prints no payment method and no signature lines
  const availableParts = CLOSING_PARTS.filter((part) => {
    return isDefaultTemplate || part.key === "qr";
  });

  const closedParts = availableParts.filter((part) => {
    return !openParts[part.key];
  });

  const openPart = (part: ClosingPart) => {
    setOpenParts((current) => {
      return { ...current, [part]: true };
    });

    PART_ON_ADD[part](setValue);

    trackEvent({ event: "add_invoice_closing_part", data: { part } });

    // the card mounts in this click's render, so focus its first field on the next frame.
    // By id: the card's switch renders a hidden checkbox that a generic query would find.
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`#${FIRST_FIELD_ID[part]}`)?.focus();
    });
  };

  const removePart = (part: ClosingPart) => {
    setOpenParts((current) => {
      return { ...current, [part]: false };
    });

    PART_ON_REMOVE[part](setValue);

    trackEvent({ event: "remove_invoice_closing_part", data: { part } });

    // the card unmounts with the focused Remove button in it, so hand focus to its pill
    requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-testid="addClosingPart-${part}"]`)
        ?.focus();
    });
  };

  return (
    // on phones, room under the last part so it can be scrolled clear of the bottom dock
    <div
      className="flex flex-col gap-5 max-lg:pb-16"
      data-testid="final-section"
    >
      <TotalsCard
        control={control}
        currency={currency}
        template={template}
        numberFormatLocale={numberFormatLocale}
        taxLabelText={taxLabelText}
        totalError={errors.total?.message}
      />

      <NotesField control={control} error={errors.notes?.message} />

      {isDefaultTemplate && openParts.payment ? (
        <PartCard
          part="payment"
          title="Payment method"
          headerSwitch={
            <InPdfSwitch
              control={control}
              name="paymentMethodFieldIsVisible"
              ariaLabel="Show Payment Method in PDF"
              tooltip="Show the payment method in the PDF"
              testId="paymentMethodFieldIsVisible"
            />
          }
          visibilityField="paymentMethodFieldIsVisible"
          control={control}
          onRemove={() => {
            removePart("payment");
          }}
        >
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  id="paymentMethod"
                  aria-label="Payment Method"
                  type="text"
                  placeholder="e.g. Bank transfer, Card, PayPal"
                  className="h-9 max-md:text-base"
                />
              );
            }}
          />
          {errors.paymentMethod ? (
            <ErrorMessage>{errors.paymentMethod.message}</ErrorMessage>
          ) : null}
        </PartCard>
      ) : null}

      {openParts.qr ? (
        <PartCard
          part="qr"
          title="QR code"
          headerSwitch={
            <InPdfSwitch
              control={control}
              name="qrCodeIsVisible"
              ariaLabel="Show QR Code in PDF"
              tooltip="Show the QR code in the PDF"
            />
          }
          visibilityField="qrCodeIsVisible"
          control={control}
          onRemove={() => {
            removePart("qr");
          }}
        >
          <Controller
            name="qrCodeData"
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  id="qrCodeData"
                  aria-label="QR code link or text"
                  type="text"
                  placeholder="Link or text to encode"
                  className="h-9 max-md:text-base"
                  data-testid="qrCodeData"
                />
              );
            }}
          />
          {errors.qrCodeData ? (
            <ErrorMessage>{errors.qrCodeData.message}</ErrorMessage>
          ) : null}
          <Controller
            name="qrCodeDescription"
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  id="qrCodeDescription"
                  aria-label="QR code caption"
                  type="text"
                  placeholder="Caption (optional), e.g. Scan to pay"
                  className="h-9 max-md:text-base"
                  data-testid="qrCodeDescription"
                />
              );
            }}
          />
          {errors.qrCodeDescription ? (
            <ErrorMessage>{errors.qrCodeDescription.message}</ErrorMessage>
          ) : null}
          <p className="text-xs text-slate-500">
            Printed at the bottom of the PDF.
          </p>
        </PartCard>
      ) : null}

      {isDefaultTemplate && openParts.signatures ? (
        <PartCard
          part="signatures"
          title="Signatures"
          control={control}
          onRemove={() => {
            removePart("signatures");
          }}
        >
          <div className="flex flex-col gap-4">
            {SIGNERS.map((signer) => {
              return (
                <SignerField
                  key={signer.nameField}
                  control={control}
                  signer={signer}
                  error={errors[signer.nameField]?.message}
                />
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            Draw with a mouse, trackpad or finger. The name and signature print
            above the signature line at the bottom of the PDF; leave both empty
            for a blank line to sign on paper.
          </p>
        </PartCard>
      ) : null}

      {closedParts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {closedParts.map((part) => {
            return (
              <AddPillButton
                key={part.key}
                testId={`addClosingPart-${part.key}`}
                onClick={() => {
                  openPart(part.key);
                }}
              >
                {part.label}
              </AddPillButton>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

/** Net, tax and the invoice total, the total large since it's the number that's paid. */
function TotalsCard({
  control,
  currency,
  template,
  numberFormatLocale,
  taxLabelText,
  totalError,
}: TotalsCardProps) {
  const [items, total] = useWatch({ control, name: ["items", "total"] });

  const formatMoney = (amount: number) => {
    return formatMoneyForTemplate({
      amount,
      currency,
      numberFormatLocale,
      template,
    });
  };

  const sumOf = (key: "netAmount" | "vatAmount") => {
    return items.reduce((sum, item) => {
      // oxlint-disable-next-line typescript/no-unnecessary-type-conversion -- the calculated amounts can arrive as strings from a restored invoice
      return sum + (Number(item[key]) || 0);
    }, 0);
  };

  return (
    <div>
      <dl className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1 text-sm tabular-nums">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <dt className="text-slate-500">Net</dt>
          <dd data-testid="totalNetAmount">
            {formatMoney(sumOf("netAmount"))}
          </dd>
        </div>
        <div className="flex min-h-9 items-center justify-between gap-3">
          <dt className="text-slate-500">{taxLabelText}</dt>
          <dd data-testid="totalVatAmount">
            {formatMoney(sumOf("vatAmount"))}
          </dd>
        </div>
        <div className="flex min-h-12 items-center justify-between gap-3 border-t border-slate-200">
          <dt className="font-semibold">Total</dt>
          <dd className="text-lg font-bold" data-testid="total">
            {formatMoney(total)}
          </dd>
        </div>
      </dl>
      {totalError ? <ErrorMessage>{totalError}</ErrorMessage> : null}
    </div>
  );
}

/** The invoice's notes, always shown, with their own "In PDF" switch. */
function NotesField({ control, error }: NotesFieldProps) {
  const isVisible = useWatch({ control, name: "notesFieldIsVisible" });

  return (
    <div className={hiddenInPdfClassName(!isVisible)}>
      <div className="mb-2.5 flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor="notes">Notes</Label>
        <InPdfSwitch
          control={control}
          name="notesFieldIsVisible"
          ariaLabel="Show Notes in PDF"
          tooltip="Show the notes in the PDF"
        />
      </div>
      <Controller
        name="notes"
        control={control}
        render={({ field }) => {
          return (
            <Textarea {...field} id="notes" rows={2} data-testid="notes" />
          );
        }}
      />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
    </div>
  );
}

/** A white card for one optional part of the PDF footer: its title, switch and Remove. */
function PartCard({
  part,
  title,
  headerSwitch,
  visibilityField,
  control,
  onRemove,
  children,
}: PartCardProps) {
  return (
    <section
      aria-label={title}
      data-closing-part={part}
      className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-3"
    >
      <div className="-my-1 -me-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <span className="whitespace-nowrap text-sm font-semibold">{title}</span>
        <div className="ms-auto flex items-center gap-2">
          {headerSwitch}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[13px] font-normal text-slate-500 max-md:h-11"
            aria-label={`Remove ${title.toLowerCase()}`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
      {visibilityField ? (
        <HiddenInPdfFade control={control} field={visibilityField}>
          {children}
        </HiddenInPdfFade>
      ) : (
        children
      )}
    </section>
  );
}

/** Fades a card's fields while its switch leaves it out of the PDF. */
function HiddenInPdfFade({ control, field, children }: HiddenInPdfFadeProps) {
  const isVisible = useWatch({ control, name: field });

  return (
    <div
      className={cn("flex flex-col gap-3", hiddenInPdfClassName(!isVisible))}
    >
      {children}
    </div>
  );
}

/** One signature line: who signs, their drawn signature, and whether the line prints. */
function SignerField({ control, signer, error }: SignerFieldProps) {
  const isVisible = useWatch({ control, name: signer.visibilityField });

  return (
    <div className={cn("min-w-0", hiddenInPdfClassName(!isVisible))}>
      <div className="mb-2.5 flex min-h-5 items-center justify-between gap-2">
        <Label htmlFor={signer.nameField} className="min-w-0 truncate">
          {signer.label}
        </Label>
        <InPdfSwitch
          control={control}
          name={signer.visibilityField}
          ariaLabel={signer.switchLabel}
          tooltip={`Show the "${signer.label}" signature line in the PDF`}
        />
      </div>
      <Controller
        name={signer.nameField}
        control={control}
        render={({ field }) => {
          return (
            <Input
              {...field}
              id={signer.nameField}
              type="text"
              placeholder="Name"
              className="h-9 max-md:text-base"
              data-testid={signer.nameField}
            />
          );
        }}
      />
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <div className="mt-2">
        <Controller
          name={signer.signatureField}
          control={control}
          render={({ field }) => {
            return (
              <SignaturePad
                value={field.value ?? ""}
                onChange={field.onChange}
                label={signer.label}
                testId={signer.signatureField}
              />
            );
          }}
        />
      </div>
    </div>
  );
}

type ClosingPart = "payment" | "qr" | "signatures";

/** The optional parts, in the order the PDF prints them, which is also the pill order. */
const CLOSING_PARTS = [
  { key: "payment", label: "Payment method" },
  { key: "qr", label: "QR code" },
  { key: "signatures", label: "Signatures" },
] as const satisfies ReadonlyArray<{ key: ClosingPart; label: string }>;

/** The field a part's card opens on. */
const FIRST_FIELD_ID = {
  payment: "paymentMethod",
  qr: "qrCodeData",
  signatures: "personAuthorizedToReceiveName",
} as const satisfies Record<ClosingPart, string>;

const DIRTY = { shouldDirty: true } as const;

/** Adding a part turns it on in the PDF, since that's why it was added. */
const PART_ON_ADD: Record<ClosingPart, PartUpdate> = {
  payment: (setValue) => {
    setValue("paymentMethodFieldIsVisible", true, DIRTY);
  },
  qr: (setValue) => {
    setValue("qrCodeIsVisible", true, DIRTY);
  },
  signatures: (setValue) => {
    setValue("personAuthorizedToReceiveFieldIsVisible", true, DIRTY);
    setValue("personAuthorizedToIssueFieldIsVisible", true, DIRTY);
  },
};

/** Removing a part takes it out of the PDF and clears it, so nothing stays behind. */
const PART_ON_REMOVE: Record<ClosingPart, PartUpdate> = {
  payment: (setValue) => {
    setValue("paymentMethod", "", DIRTY);
    setValue("paymentMethodFieldIsVisible", false, DIRTY);
  },
  qr: (setValue) => {
    setValue("qrCodeData", "", DIRTY);
    setValue("qrCodeDescription", "", DIRTY);
  },
  signatures: (setValue) => {
    setValue("personAuthorizedToReceiveName", "", DIRTY);
    setValue("personAuthorizedToReceiveSignature", "", DIRTY);
    setValue("personAuthorizedToReceiveFieldIsVisible", false, DIRTY);
    setValue("personAuthorizedToIssueName", "", DIRTY);
    setValue("personAuthorizedToIssueSignature", "", DIRTY);
    setValue("personAuthorizedToIssueFieldIsVisible", false, DIRTY);
  },
};

/** The signature lines, in the PDF's order: received by on the left, issued by on the right. */
const SIGNERS = [
  {
    label: "Received by",
    nameField: "personAuthorizedToReceiveName",
    signatureField: "personAuthorizedToReceiveSignature",
    visibilityField: "personAuthorizedToReceiveFieldIsVisible",
    switchLabel: "Show Person Authorized to Receive in PDF",
  },
  {
    label: "Issued by",
    nameField: "personAuthorizedToIssueName",
    signatureField: "personAuthorizedToIssueSignature",
    visibilityField: "personAuthorizedToIssueFieldIsVisible",
    switchLabel: "Show Person Authorized to Issue in PDF",
  },
] as const;

/** Sets the form fields that adding or removing one part changes. */
type PartUpdate = (setValue: UseFormSetValue<InvoiceData>) => void;

interface InvoiceClosingProps {
  control: Control<InvoiceData>;
  errors: FieldErrors<InvoiceData>;
  getValues: UseFormGetValues<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  currency: SupportedCurrencies;
  template: InvoiceData["template"];
  /** The invoice's number format, already resolved against its language. */
  numberFormatLocale: SupportedNumberFormatLocale;
  taxLabelText: string;
}

interface TotalsCardProps {
  control: Control<InvoiceData>;
  currency: SupportedCurrencies;
  template: InvoiceData["template"];
  numberFormatLocale: SupportedNumberFormatLocale;
  taxLabelText: string;
  totalError: string | undefined;
}

interface NotesFieldProps {
  control: Control<InvoiceData>;
  error: string | undefined;
}

interface PartCardProps {
  part: ClosingPart;
  title: string;
  /** The part's "In PDF" switch; Signatures has one per line instead. */
  headerSwitch?: React.ReactNode;
  /** The field that switch toggles, so the card's fields fade while it's off. */
  visibilityField?: "paymentMethodFieldIsVisible" | "qrCodeIsVisible";
  control: Control<InvoiceData>;
  onRemove: () => void;
  children: React.ReactNode;
}

interface HiddenInPdfFadeProps {
  control: Control<InvoiceData>;
  field: "paymentMethodFieldIsVisible" | "qrCodeIsVisible";
  children: React.ReactNode;
}

interface SignerFieldProps {
  control: Control<InvoiceData>;
  signer: (typeof SIGNERS)[number];
  error: string | undefined;
}
