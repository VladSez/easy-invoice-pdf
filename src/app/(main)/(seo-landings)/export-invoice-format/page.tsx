import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("export-invoice-format");
};

export default function ExportInvoiceFormatPage() {
  return <SeoLandingRoutePage slug="export-invoice-format" />;
}
