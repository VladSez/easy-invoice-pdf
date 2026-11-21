import { useId } from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from "react-hook-form";

import {
  ErrorMessage,
  FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME,
  inputErrorClassName,
} from "@/app/(main)/(app)/components/invoice-form/common";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * The seller's or buyer's fields, in titled sections: Business, Tax number, Contact (&
 * payment) and Notes. The same component fills the "New seller" dialog and the invoice
 * form's own seller section, so the two read the same and can't drift apart.
 *
 * It is generic over the form it is bound to: the dialog's form holds a bare `SellerData`
 * (`name`), the invoice form nests it (`seller.name`), so the caller passes the paths.
 */
export function PartyFields<T extends FieldValues>({
  party,
  placement,
  control,
  names,
  isPrefilled,
}: PartyFieldsProps<T>) {
  const partyLabel = PARTY_LABEL[party];
  const ids = getPartyFieldIds({ party, placement });

  const shared = { control, isPrefilled };

  return (
    <div className="space-y-5">
      <PartyFieldsSection title="Business">
        <PartyTextField
          {...shared}
          name={names.name}
          id={ids.name}
          label="Name (Required)"
          placeholder={`Enter ${party} name`}
          isMultiline
        />
        <PartyTextField
          {...shared}
          name={names.address}
          id={ids.address}
          label="Address (Required)"
          placeholder={`Enter ${party} address`}
          isMultiline
        />
      </PartyFieldsSection>

      {/* one switch for the label and the number, so the fade covers the whole section */}
      <PartyFieldsSection
        title="Tax number"
        className={FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME}
        action={
          <PdfToggleField
            control={control}
            name={names.vatNoFieldIsVisible}
            id={ids.vatNoToggle}
            fieldLabel="Tax Number"
            testId={getToggleTestId({ party, placement, field: "VatNo" })}
          />
        }
      >
        {/* a label of its own, so the PDF can say "VAT no", "Tax ID", ... */}
        <fieldset
          aria-label={`${partyLabel} Tax Number`}
          className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3"
        >
          <PartyTextField
            {...shared}
            name={names.vatNoLabelText}
            id={ids.vatNoLabel}
            label="Label"
            placeholder="e.g. VAT no"
          />
          <PartyTextField
            {...shared}
            name={names.vatNo}
            id={ids.vatNo}
            label="Number"
            placeholder="e.g. PL1234567890"
          />
        </fieldset>
      </PartyFieldsSection>

      <PartyFieldsSection title={names.bank ? "Contact & payment" : "Contact"}>
        <PartyTextField
          {...shared}
          name={names.email}
          id={ids.email}
          label="Email"
          type="email"
          placeholder={`${party}@email.com`}
          toggle={
            <PdfToggleField
              control={control}
              name={names.emailFieldIsVisible}
              id={ids.emailToggle}
              fieldLabel="Email"
              testId={getToggleTestId({ party, placement, field: "Email" })}
            />
          }
        />
        {names.bank ? (
          <>
            <PartyTextField
              {...shared}
              name={names.bank.accountNumber}
              id={ids.accountNumber}
              label="Account Number"
              placeholder="Enter account number"
              isMultiline
              toggle={
                <PdfToggleField
                  control={control}
                  name={names.bank.accountNumberFieldIsVisible}
                  id={ids.accountNumberToggle}
                  fieldLabel="Account Number"
                  testId={getToggleTestId({
                    party,
                    placement,
                    field: "AccountNumber",
                  })}
                />
              }
            />
            <PartyTextField
              {...shared}
              name={names.bank.swiftBic}
              id={ids.swiftBic}
              label="SWIFT/BIC"
              placeholder="e.g. WBKPPLPP"
              toggle={
                <PdfToggleField
                  control={control}
                  name={names.bank.swiftBicFieldIsVisible}
                  id={ids.swiftBicToggle}
                  fieldLabel="SWIFT/BIC"
                  testId={getToggleTestId({
                    party,
                    placement,
                    field: "SwiftBic",
                  })}
                />
              }
            />
          </>
        ) : null}
      </PartyFieldsSection>

      <PartyFieldsSection
        title="Notes"
        className={FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME}
        action={
          <PdfToggleField
            control={control}
            name={names.notesFieldIsVisible}
            id={ids.notesToggle}
            fieldLabel="Notes"
            testId={getToggleTestId({ party, placement, field: "Notes" })}
          />
        }
      >
        <PartyTextField
          {...shared}
          name={names.notes}
          id={ids.notes}
          // the section heading says it already
          label="Notes"
          isLabelHidden
          placeholder="Enter notes (max 750 characters)"
          maxLength={750}
          isMultiline
        />
      </PartyFieldsSection>
    </div>
  );
}

/** A titled group of party fields, divided from the one above it. */
function PartyFieldsSection({
  title,
  action,
  className,
  children,
}: PartyFieldsSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "space-y-3 border-t border-slate-200 pt-4 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <div className="flex min-h-[22px] items-center justify-between gap-2">
        <h3
          id={headingId}
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** One labelled text field, with its "In PDF" switch on the label's row when it has one. */
function PartyTextField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  isLabelHidden = false,
  placeholder,
  type = "text",
  maxLength,
  isMultiline = false,
  toggle,
  isPrefilled,
}: PartyTextFieldProps<T>) {
  const errorId = `${id}Error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = typeof field.value === "string" ? field.value : "";
        const error = fieldState.error?.message;

        const inputProps = {
          id,
          name: field.name,
          value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          placeholder,
          maxLength,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
          className: cn(
            isPrefilled?.({ name, value }) && PREFILLED_CLASS_NAME,
            inputErrorClassName(!!error),
          ),
        };

        return (
          // a field with its own switch fades on its own, see FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME
          <div
            className={cn(
              "space-y-2",
              toggle ? FADE_WHEN_HIDDEN_IN_PDF_CLASS_NAME : "",
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between gap-2",
                isLabelHidden ? "sr-only" : "",
              )}
            >
              <Label htmlFor={id}>{label}</Label>
              {toggle}
            </div>
            {isMultiline ? (
              <Textarea {...inputProps} ref={field.ref} rows={2} />
            ) : (
              <Input {...inputProps} ref={field.ref} type={type} />
            )}
            {error ? <ErrorMessage id={errorId}>{error}</ErrorMessage> : null}
          </div>
        );
      }}
    />
  );
}

/** Whether a field is printed: the small "In PDF" switch used across the invoice form. */
function PdfToggleField<T extends FieldValues>({
  control,
  name,
  id,
  fieldLabel,
  testId,
}: PdfToggleFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        return (
          <div className="inline-flex shrink-0 items-center gap-2">
            <Switch
              id={id}
              ref={field.ref}
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              size="sm"
              aria-label={`Show the '${fieldLabel}' field in the PDF`}
              data-testid={testId}
            />
            <Label htmlFor={id} className="cursor-pointer">
              In PDF
            </Label>
          </div>
        );
      }}
    />
  );
}

/**
 * Element ids, unique per placement since the dialog opens over the invoice form. The
 * invoice form keeps its long-standing ids (`sellerName`, `buyerVatNo`, ...).
 */
function getPartyFieldIds({ party, placement }: GetPartyFieldIdsOptions) {
  const prefix = placement === "dialog" ? `${party}Dialog` : party;

  return {
    name: `${prefix}Name`,
    address: `${prefix}Address`,
    vatNoLabel: `${prefix}VatNoLabel`,
    vatNo: `${prefix}VatNo`,
    vatNoToggle: `${prefix}VatNoFieldIsVisible`,
    email: `${prefix}Email`,
    emailToggle: `${prefix}EmailFieldIsVisible`,
    accountNumber: `${prefix}AccountNumber`,
    accountNumberToggle: `${prefix}AccountNumberFieldIsVisible`,
    swiftBic: `${prefix}SwiftBic`,
    swiftBicToggle: `${prefix}SwiftBicFieldIsVisible`,
    notes: `${prefix}Notes`,
    notesToggle: `${prefix}NotesFieldIsVisible`,
  };
}

/** The switches' test ids, as the e2e tests have long known them. */
function getToggleTestId({ party, placement, field }: GetToggleTestIdOptions) {
  if (placement === "dialog") {
    return `${party}${field}DialogFieldVisibilitySwitch`;
  }

  return field === "Notes"
    ? `${party}NotesInvoiceFormFieldVisibilitySwitch`
    : `${party}${field}FieldIsVisible`;
}

const PARTY_LABEL = {
  seller: "Seller",
  buyer: "Buyer",
} as const;

/** Tints a field copied in from the invoice; a field hidden from the PDF fades over it. */
const PREFILLED_CLASS_NAME = "border-green-300 bg-green-50/70";

type Party = keyof typeof PARTY_LABEL;

type Placement = "dialog" | "invoice";

interface PartyFieldsProps<T extends FieldValues> {
  party: Party;
  /** Where the fields are shown, which picks their element and test ids. */
  placement: Placement;
  control: Control<T>;
  /** Where each field lives in the form. */
  names: PartyFieldNames<T>;
  /** The field was copied in from the invoice and not changed since, so it is tinted. */
  isPrefilled?: IsPrefilled<T>;
}

/** Paths of the party's fields in the form the component is bound to. */
interface PartyFieldNames<T extends FieldValues> {
  name: Path<T>;
  address: Path<T>;
  vatNoLabelText: Path<T>;
  vatNo: Path<T>;
  vatNoFieldIsVisible: Path<T>;
  email: Path<T>;
  emailFieldIsVisible: Path<T>;
  /** The seller's bank details; the buyer has none. */
  bank?: {
    accountNumber: Path<T>;
    accountNumberFieldIsVisible: Path<T>;
    swiftBic: Path<T>;
    swiftBicFieldIsVisible: Path<T>;
  };
  notes: Path<T>;
  notesFieldIsVisible: Path<T>;
}

type IsPrefilled<T extends FieldValues> = (options: {
  /** The field's path in the form. */
  name: Path<T>;
  /** Its current value. */
  value: string;
}) => boolean;

interface PartyFieldsSectionProps {
  title: string;
  /** Sits at the end of the heading row, e.g. the tax number's PDF switch. */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

interface PartyTextFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
  /** Kept for screen readers only, when a heading already names the field. */
  isLabelHidden?: boolean;
  placeholder?: string;
  type?: "text" | "email";
  maxLength?: number;
  /** A two-row textarea instead of a one-line input. */
  isMultiline?: boolean;
  /** The field's own "In PDF" switch, shown on the label's row. */
  toggle?: React.ReactNode;
  isPrefilled?: IsPrefilled<T>;
}

interface PdfToggleFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  id: string;
  /** The field's name as the switch's accessible name says it, e.g. `Email`. */
  fieldLabel: string;
  testId: string;
}

interface GetPartyFieldIdsOptions {
  party: Party;
  placement: Placement;
}

interface GetToggleTestIdOptions {
  party: Party;
  placement: Placement;
  /** The field, PascalCase, as it appears in the test id. */
  field: "VatNo" | "Email" | "AccountNumber" | "SwiftBic" | "Notes";
}
