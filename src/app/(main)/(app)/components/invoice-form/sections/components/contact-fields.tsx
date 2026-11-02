import { Check, EyeOff, Info } from "lucide-react";
import { type Control, useWatch } from "react-hook-form";

import type { BuyerData, InvoiceData, SellerData } from "@/app/schema";
import { cn } from "@/lib/utils";

interface ContactFieldsProps {
  contact: SellerData | BuyerData;
}

/** Every filled-in field of the entry, with the ones hidden on the invoice marked so. */
export function ContactFields({ contact }: ContactFieldsProps) {
  const fields = getContactFields(contact);

  return (
    <dl className="space-y-1.5 border-t border-slate-200 bg-slate-50/60 px-3 py-2 text-xs">
      {fields.map(({ field, label, value, isHidden }) => {
        return (
          <div
            key={field}
            className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2"
          >
            <dt className="text-slate-500">{label}</dt>
            <dd className="whitespace-pre-line break-words text-slate-700">
              {value}
              {isHidden ? (
                <span className="ml-1.5 text-slate-400">
                  (hidden on invoice)
                </span>
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

interface ContactField {
  /** The schema key, used as the React key: labels can repeat, as the tax label is user-set. */
  field: keyof SellerData;
  label: string;
  value: string;
  /** The entry has the value but does not show it on the invoice. */
  isHidden: boolean;
}

function getContactFields(contact: SellerData | BuyerData): ContactField[] {
  const fields: (ContactField | null)[] = [
    { field: "name", label: "Name", value: contact.name, isHidden: false },
    {
      field: "address",
      label: "Address",
      value: contact.address,
      isHidden: false,
    },
    optionalField({
      field: "vatNo",
      label: contact.vatNoLabelText,
      value: contact.vatNo,
      isVisible: contact.vatNoFieldIsVisible,
    }),
    optionalField({
      field: "email",
      label: "Email",
      value: contact.email,
      isVisible: contact.emailFieldIsVisible,
    }),
    "accountNumber" in contact
      ? optionalField({
          field: "accountNumber",
          label: "Account Number",
          value: contact.accountNumber,
          isVisible: contact.accountNumberFieldIsVisible,
        })
      : null,
    "swiftBic" in contact
      ? optionalField({
          field: "swiftBic",
          label: "SWIFT/BIC",
          value: contact.swiftBic,
          isVisible: contact.swiftBicFieldIsVisible,
        })
      : null,
    optionalField({
      field: "notes",
      label: "Notes",
      value: contact.notes,
      isVisible: contact.notesFieldIsVisible,
    }),
  ];

  return fields.filter((field) => {
    return field !== null;
  });
}

interface OptionalFieldOptions {
  field: ContactField["field"];
  label: string;
  /** Left out of the list when empty. */
  value: string | undefined;
  /** The entry's `…FieldIsVisible` flag for this field. */
  isVisible: boolean;
}

function optionalField({
  field,
  label,
  value,
  isVisible,
}: OptionalFieldOptions): ContactField | null {
  return value ? { field, label, value, isHidden: !isVisible } : null;
}

interface SavedContactCardProps {
  control: Control<InvoiceData>;
  party: "seller" | "buyer";
}

/**
 * Stands in for the seller or buyer fields while a saved one is picked: what the PDF prints,
 * with the same fields the import preview lists and the ones it leaves out marked as hidden.
 * Changing them goes through the pencil next to the picker, so they are not editable here.
 */
export function SavedContactCard({ control, party }: SavedContactCardProps) {
  // the details on the invoice, which are the saved seller's or buyer's. The form's own
  // value, not `invoiceData`: that one only catches up after the form's debounce, so the
  // card would show the previous party for half a second after a pick. Watched here rather
  // than in the section, so typing in the section's own fields does not re-render it
  const contact = useWatch({ control, name: party });

  // the name and address head the card, so the list starts after them
  const fields = getContactFields(contact).filter(({ field }) => {
    return field !== "name" && field !== "address";
  });

  return (
    <section
      aria-label={`Saved ${party}`}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white text-sm"
      data-testid={`${party}-saved-card`}
    >
      <header className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-pretty break-words font-semibold text-slate-900">
            {contact.name}
          </p>
          <p className="mt-0.5 whitespace-pre-line break-words text-slate-500">
            {contact.address}
          </p>
        </div>
        <span className="inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
          <Check className="size-3" aria-hidden />
          Saved
        </span>
      </header>

      {fields.length > 0 ? (
        <dl className="space-y-2.5 border-t border-slate-200 px-4 pb-4 pt-3">
          {fields.map(({ field, label, value, isHidden }) => {
            return (
              // the value drops under its label once the card is too narrow for both
              <div key={field} className="flex flex-wrap gap-x-3 gap-y-0.5">
                <dt className="shrink-0 basis-[7.5rem] text-slate-500">
                  {label}
                </dt>
                <dd className="flex min-w-40 flex-1 flex-wrap items-center gap-x-2 gap-y-1 break-words">
                  <span
                    className={cn(
                      "min-w-0 whitespace-pre-line tabular-nums",
                      isHidden ? "text-slate-400" : "text-slate-900",
                    )}
                  >
                    {value}
                  </span>
                  {isHidden ? (
                    <span className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-500">
                      <EyeOff className="size-3" aria-hidden />
                      Hidden on invoice
                    </span>
                  ) : null}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      <p className="flex items-start gap-2 text-pretty border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        Printed as listed. Use the pencil to change this {party} on every
        invoice that uses it.
      </p>
    </section>
  );
}
