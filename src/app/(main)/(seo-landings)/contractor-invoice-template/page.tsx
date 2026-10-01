import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("contractor-invoice-template");
};

export default function ContractorInvoiceTemplatePage() {
  return <SeoLandingRoutePage slug="contractor-invoice-template" />;
}
