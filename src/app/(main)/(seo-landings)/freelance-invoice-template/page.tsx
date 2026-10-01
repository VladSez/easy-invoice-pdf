import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("freelance-invoice-template");
};

export default function FreelanceInvoiceTemplatePage() {
  return <SeoLandingRoutePage slug="freelance-invoice-template" />;
}
