import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("multi-language-invoice-generator");
};

export default function MultiLanguageInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="multi-language-invoice-generator" />;
}
