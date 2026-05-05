import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(seo-landings)/seo-landing-route";

export const dynamic = "force-static";

export const generateMetadata = () =>
  buildSeoLandingMetadata("open-source-invoice-generator");

export default function OpenSourceInvoiceGeneratorPage() {
  return <SeoLandingRoutePage slug="open-source-invoice-generator" />;
}
