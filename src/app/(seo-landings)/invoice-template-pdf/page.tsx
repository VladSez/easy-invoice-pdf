import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(seo-landings)/seo-landing-route";

export const dynamic = "force-static";

export const generateMetadata = () =>
  buildSeoLandingMetadata("invoice-template-pdf");

export default function InvoiceTemplatePdfPage() {
  return <SeoLandingRoutePage slug="invoice-template-pdf" />;
}
