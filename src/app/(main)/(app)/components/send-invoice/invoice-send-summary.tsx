import dayjs from "dayjs";

import { formatCurrency } from "@/app/(main)/(app)/utils/format-currency";
import { formatDateOfServiceEnd } from "@/app/(main)/(app)/utils/format-service-period";
import type { InvoiceData } from "@/app/schema";

/** A paper-sheet mark that makes the attachment recognizable at a glance. */
function PdfFileIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-[42px] w-[34px] shrink-0 flex-col gap-[3px] overflow-hidden rounded border border-gray-300 bg-white px-1.5 py-2"
    >
      <span className="h-[2px] w-3.5 bg-slate-400" />
      <span className="h-[2px] w-3.5 bg-gray-300" />
      <span className="h-[2px] w-3.5 bg-gray-300" />
      <span className="h-[2px] w-3.5 bg-gray-300" />
      <span className="absolute bottom-0 right-0 rounded-tl bg-red-600 px-1 text-[7px] font-bold leading-[10px] tracking-wide text-white">
        PDF
      </span>
    </span>
  );
}

/** Small caps heading that separates the summary into scannable groups. */
function SummaryGroupLabel({ children }: { children: string }) {
  return (
    <p className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </p>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="truncate font-semibold text-slate-900" title={value}>
        {value}
      </span>
    </div>
  );
}

/** Read-only recap of what is about to be sent. */
export function InvoiceSendSummary({
  invoiceData,
  filename,
}: {
  invoiceData: InvoiceData;
  filename: string;
}) {
  const showDateOfService = invoiceData.dateOfServiceFieldIsVisible;
  const invoiceNumber = invoiceData.invoiceNumberObject?.value;

  // Each block below carries `min-w-0`: as grid items they would otherwise
  // refuse to shrink below their content, so a long filename, invoice number or
  // buyer name would widen the whole column instead of ellipsizing inside it.
  return (
    <div className="grid gap-3.5">
      <h3 className="text-sm font-semibold text-slate-900">Summary</h3>

      <div className="flex min-w-0 items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2">
        <PdfFileIcon />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900">
            {filename}
          </p>
          <p className="text-[11px] text-slate-400">
            Attached when you hit send
          </p>
        </div>
      </div>

      {/* The amount is what the recipient looks for first, so it leads. */}
      <div className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <SummaryGroupLabel>Invoice total</SummaryGroupLabel>
          {invoiceNumber ? (
            <span
              className="truncate text-[11px] font-medium text-slate-400"
              title={invoiceNumber}
            >
              Invoice no. {invoiceNumber}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-lg font-semibold leading-tight text-slate-900">
          {formatCurrency({
            amount: invoiceData.total,
            currency: invoiceData.currency,
            language: invoiceData.language,
          })}
        </p>
      </div>

      <div className="grid min-w-0 gap-1.5">
        <SummaryGroupLabel>Dates</SummaryGroupLabel>
        <SummaryLine
          label="Date of issue"
          value={dayjs(invoiceData.dateOfIssue).format(invoiceData.dateFormat)}
        />
        {showDateOfService ? (
          <SummaryLine
            label="Date of sales/service"
            value={formatDateOfServiceEnd(invoiceData)}
          />
        ) : null}
        <SummaryLine
          label="Due date"
          value={dayjs(invoiceData.paymentDue).format(invoiceData.dateFormat)}
        />
      </div>

      <div className="grid min-w-0 gap-0.5">
        <SummaryGroupLabel>Billed to</SummaryGroupLabel>
        <p
          className="truncate text-xs font-semibold text-slate-900"
          title={invoiceData.buyer.name}
        >
          {invoiceData.buyer.name || "—"}
        </p>
      </div>
    </div>
  );
}
