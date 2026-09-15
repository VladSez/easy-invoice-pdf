import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("swedish-invoice-generator");
};

export default function SwedishInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="swedish-invoice-generator" />;
}
