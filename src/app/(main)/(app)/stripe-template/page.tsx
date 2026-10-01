import type { Metadata } from "next";

import { buildInvoiceAppMetadata, InvoiceAppPage } from "../invoice-app-page";

export const metadata: Metadata = buildInvoiceAppMetadata("stripe");

/**
 * The invoice generator opened on the Stripe template. Same page as `/`; the client
 * reads the template from the pathname (`getTemplateFromUrl`).
 */
export default function StripeTemplateAppPage() {
  return <InvoiceAppPage template="stripe" />;
}
