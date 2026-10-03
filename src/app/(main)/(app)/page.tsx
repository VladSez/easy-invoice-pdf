import type { Metadata } from "next";

import { buildInvoiceAppMetadata, InvoiceAppPage } from "./invoice-app-page";

export const metadata: Metadata = buildInvoiceAppMetadata("default");

export default function AppPage() {
  return <InvoiceAppPage template="default" />;
}
