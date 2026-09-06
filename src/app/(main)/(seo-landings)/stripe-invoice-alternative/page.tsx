import {
  buildSeoLandingMetadata,
  SeoLandingRoutePage,
} from "@/app/(main)/(seo-landings)/seo-landing-route";

export const generateMetadata = () => {
  return buildSeoLandingMetadata("stripe-invoice-alternative");
};

export default function StripeInvoiceAlternativePage() {
  return <SeoLandingRoutePage slug="stripe-invoice-alternative" />;
}
