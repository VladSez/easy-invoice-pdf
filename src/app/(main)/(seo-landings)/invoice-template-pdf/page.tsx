import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("invoice-template-pdf");
};

export default function InvoiceTemplatePdfPage() {
  return <SeoLandingRoutePage slug="invoice-template-pdf" />;
}
