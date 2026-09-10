import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("open-source-invoice-generator");
};

export default function OpenSourceInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="open-source-invoice-generator" />;
}
