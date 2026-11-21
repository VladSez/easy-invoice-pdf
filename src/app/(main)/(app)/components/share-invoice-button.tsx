"use client";

import { AlertCircleIcon, LinkIcon } from "lucide-react";

import type { InvoiceData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import { CustomTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Why an invoice carrying a logo cannot be turned into a link.
 *
 * Shared with the toast `handleShareInvoice` raises when the button is pressed anyway, so the
 * tooltip and the toast cannot drift into telling the user two different things.
 */
export const CANNOT_SHARE_INVOICE_DESCRIPTION =
  "Invoices with logos cannot be shared. Please remove the logo to generate a shareable link. You can still download the invoice as PDF and share it.";

const CANNOT_SHARE_SIGNED_INVOICE_DESCRIPTION =
  "Invoices with drawn signatures cannot be shared. Please clear the signatures to generate a shareable link. You can still download the invoice as PDF and share it.";

/**
 * Why this invoice can't become a link, or `null` when it can. A link holds neither images
 * nor drawn signatures; signatures only block the default template, the one that prints them
 * (links leave them out, see `compressInvoiceData`).
 */
export function getCannotShareInvoiceReason(
  invoiceData: InvoiceData | null,
): string | null {
  if (!invoiceData) return null;

  if (invoiceData.logo) return CANNOT_SHARE_INVOICE_DESCRIPTION;

  const hasDrawnSignature =
    Boolean(invoiceData.personAuthorizedToReceiveSignature) ||
    Boolean(invoiceData.personAuthorizedToIssueSignature);

  if (invoiceData.template === "default" && hasDrawnSignature) {
    return CANNOT_SHARE_SIGNED_INVOICE_DESCRIPTION;
  }

  return null;
}

/**
 * The "Get link" button and the tooltip explaining what it will (or will not) do.
 *
 * Rendered twice on the page -- in the desktop header and in the mobile dock -- which used to
 * mean two copies of the same forty lines of tooltip, and two places to update when the copy
 * changed. Only the button's own spacing actually differs between them.
 */
export function ShareInvoiceButton({
  cannotShareReason,
  handleShareInvoice,
  className,
}: {
  /** Why the invoice can't be shared, from `getCannotShareInvoiceReason`; `null` when it can. */
  cannotShareReason: string | null;
  /** Generates the link and puts it on the clipboard (or into the native share sheet). */
  handleShareInvoice: () => void;
  /** Layout classes for the button itself: the header and the dock space it differently. */
  className?: string;
}) {
  const canShareInvoice = cannotShareReason === null;

  return (
    <CustomTooltip
      className={cn(!canShareInvoice && "bg-red-50")}
      trigger={
        <Button
          data-disabled={!canShareInvoice} // for better UX than 'disabled'
          onClick={handleShareInvoice}
          variant="outline"
          className={cn(className)}
        >
          <LinkIcon className="mr-1.5 size-4" />
          Get link
        </Button>
      }
      content={
        canShareInvoice ? (
          <div className="flex items-center gap-3 p-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Share Invoice Online
              </p>
              <p className="text-pretty text-xs leading-relaxed text-slate-700">
                Generate a link to share this invoice with your clients. They
                can view and download it directly from their browser.
              </p>
            </div>
          </div>
        ) : (
          <div
            data-testid="share-invoice-tooltip-content"
            className="flex items-center gap-3 bg-red-50 p-3"
          >
            <AlertCircleIcon className="h-5 w-5 flex-shrink-0 fill-red-600 text-white" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-red-800">
                Unable to Share Invoice
              </p>
              <p className="text-pretty text-xs leading-relaxed text-red-700">
                {cannotShareReason}
              </p>
            </div>
          </div>
        )
      }
    />
  );
}
