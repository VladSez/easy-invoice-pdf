import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("invoice-generator-no-login");
};

export default function InvoiceGeneratorNoLoginPage() {
  return <SeoLandingRoutePage slug="invoice-generator-no-login" />;
}
