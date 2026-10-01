import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("proforma-invoice-generator");
};

export default function ProformaInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="proforma-invoice-generator" />;
}
