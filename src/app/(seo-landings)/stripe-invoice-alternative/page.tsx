import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(seo-landings)/seo-landing-route";

export const dynamic = "force-static";

export const generateMetadata = () =>
  buildSeoLandingMetadata("stripe-invoice-alternative");

export default function StripeInvoiceAlternativePage() {
  return <SeoLandingRoutePage slug="stripe-invoice-alternative" />;
}
