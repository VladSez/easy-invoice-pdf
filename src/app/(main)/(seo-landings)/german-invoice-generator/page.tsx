import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("german-invoice-generator");
};

export default function GermanInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="german-invoice-generator" />;
}
