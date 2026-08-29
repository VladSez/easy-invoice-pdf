import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(seo-landings)/seo-landing-route";

export const dynamic = "force-static";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("invoice-generator-no-login");
};

export default function InvoiceGeneratorNoLoginPage() {
  return <SeoLandingRoutePage slug="invoice-generator-no-login" />;
}
