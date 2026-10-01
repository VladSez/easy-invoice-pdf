import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("spanish-invoice-generator");
};

export default function SpanishInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="spanish-invoice-generator" />;
}
