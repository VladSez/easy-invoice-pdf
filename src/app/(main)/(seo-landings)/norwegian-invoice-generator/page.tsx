import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("norwegian-invoice-generator");
};

export default function NorwegianInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="norwegian-invoice-generator" />;
}
