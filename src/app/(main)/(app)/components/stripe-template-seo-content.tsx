import {
  CreditCardIcon,
  FileTextIcon,
  MonitorIcon,
  ReceiptTextIcon,
} from "lucide-react";
import Link from "next/link";

import {
  MAX_CUSTOM_COLUMNS,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";
import { cn } from "@/lib/utils";

import {
  SEO_LINK_CLASS_NAME,
  SeoContentFaq,
  SeoContentFeatureCard,
  SeoContentFeatureGrid,
  SeoContentIntro,
  SeoContentSection,
  SeoContentStepsCard,
} from "./seo-content-cards";
import { LanguagesSketch, SketchBar } from "./seo-content-sketches";
import { SeoContentHeading } from "./seo-content-text";
import { TemplateChooser } from "./template-chooser";

/**
 * Plain, server-rendered copy below the invoice editor on `/stripe-template`.
 *
 * The route has its own canonical URL and title ("Stripe Invoice Template"), so it is
 * indexed as a page of its own, but the editor renders on the client: without this, its
 * prerendered HTML is a loading skeleton and the footer. `HomeSeoContent` solves the same
 * problem on `/`, with the same cards from `seo-content-cards.tsx`.
 *
 * Written for "Stripe invoice template": what the layout looks like, how it differs from
 * the classic template, and how to fill it in. The general pitch (free, no login, open
 * source) is `/`'s, and "Stripe invoice generator" (paying through Stripe) belongs to
 * `/stripe-invoice-alternative`, so this links to both rather than repeating them.
 */
export function StripeTemplateSeoContent() {
  return (
    <SeoContentSection
      labelledBy="stripe-template-seo-content-heading"
      testId="stripe-template-seo-content"
    >
      <SeoContentIntro
        headingId="stripe-template-seo-content-heading"
        heading="A free Stripe-style invoice template"
        facts={FACTS}
      >
        <p>
          The Stripe invoice template follows the layout of the invoices Stripe
          sends. The amount due and its due date sit in bold above a single
          table of line items, with a short summary of totals below. Fill in the
          form and the preview redraws as you type, then download the PDF.
        </p>
        <p>
          You don&apos;t need a Stripe account. It is a layout you fill in, not
          a payments service: no products to set up and no dashboard. The
          invoice is built in your browser, and{" "}
          <Link
            href="/invoice-generator-no-login"
            className={SEO_LINK_CLASS_NAME}
          >
            there is no signup
          </Link>
          .
        </p>
      </SeoContentIntro>

      <div>
        <SeoContentHeading>What&apos;s on the template</SeoContentHeading>
        {/* six parts that make the case for this template: the amount due and US
            Letter are left out because the intro, the facts and the template chooser
            already say both */}
        <SeoContentFeatureGrid>
          <SeoContentFeatureCard
            sketch={<LanguagesSketch />}
            title={
              <Link
                href="/multi-language-invoice-generator"
                className={cn(SEO_LINK_CLASS_NAME, "font-semibold")}
              >
                {SUPPORTED_INVOICE_PDF_LANGUAGES.length} languages
              </Link>
            }
          >
            Every label, with your own tax label such as VAT, GST or Sales Tax
          </SeoContentFeatureCard>
          {TEMPLATE_PARTS.map(({ title, text, Sketch }) => {
            return (
              <SeoContentFeatureCard
                key={title}
                sketch={<Sketch />}
                title={title}
              >
                {text}
              </SeoContentFeatureCard>
            );
          })}
        </SeoContentFeatureGrid>
      </div>

      <SeoContentStepsCard
        heading="How to fill in the Stripe invoice template"
        steps={HOW_TO_STEPS}
      />

      <div>
        <SeoContentHeading>Stripe or classic?</SeoContentHeading>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          Both templates take the same form. Switch any time and your details
          carry over.
        </p>
        <TemplateChooser />
      </div>

      <SeoContentFaq
        items={FAQ}
        aside={
          <>
            Comparing it with billing through Stripe itself? See the{" "}
            <Link
              href="/stripe-invoice-alternative"
              className={SEO_LINK_CLASS_NAME}
            >
              Stripe invoice generator
            </Link>{" "}
            page.
          </>
        }
      />
    </SeoContentSection>
  );
}

function PayOnlineSketch() {
  return (
    <>
      <SketchBar className="h-2 w-1/2 bg-slate-300" />
      <span className="text-xs font-semibold text-indigo-600">
        Pay online →
      </span>
    </>
  );
}

function ItemsTableSketch() {
  return (
    <>
      <div className="grid grid-cols-[3fr_1fr_1fr] gap-1.5">
        <SketchBar className="bg-slate-300" />
        <SketchBar className="bg-slate-300" />
        <SketchBar className="bg-slate-300" />
      </div>
      <div className="grid grid-cols-[3fr_1fr_1fr] gap-1.5">
        <SketchBar />
        <SketchBar />
        <SketchBar />
      </div>
      <div className="mt-1 flex w-[45%] flex-col gap-1 self-end">
        <SketchBar />
        <SketchBar className="bg-slate-900" />
      </div>
    </>
  );
}

function LogoAndPartiesSketch() {
  return (
    <div className="flex items-center gap-3">
      <span className="size-[34px] shrink-0 rounded-lg bg-slate-300" />
      <div className="grid flex-1 grid-cols-2 gap-2">
        {[0, 1].map((column) => {
          return (
            <div key={column} className="flex flex-col gap-1">
              <SketchBar className="bg-slate-300" />
              <SketchBar />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DiscountSketch() {
  return (
    <div className="flex items-center gap-2">
      <SketchBar className="flex-1" />
      <span className="text-xs text-slate-400 line-through">€1,000.00</span>
      <span className="inline-flex h-[22px] items-center rounded-full bg-slate-900 px-2 text-[11px] font-semibold text-white">
        −10%
      </span>
    </div>
  );
}

function CustomColumnsSketch() {
  return (
    <>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-1.5">
        <SketchBar className="bg-slate-300" />
        {["Hours", "Project", "SKU"].map((label) => {
          return (
            <span
              key={label}
              className="truncate rounded bg-slate-900 px-1 py-0.5 text-center text-[10px] font-semibold text-white"
            >
              {label}
            </span>
          );
        })}
      </div>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-1.5">
        <SketchBar />
        <SketchBar />
        <SketchBar />
        <SketchBar />
      </div>
    </>
  );
}

const FACTS = [
  {
    icon: ReceiptTextIcon,
    title: "Stripe's layout",
    description: "Bold amount due, one table of items",
  },
  {
    icon: CreditCardIcon,
    title: "No Stripe account",
    description: "A layout, not a payments service",
  },
  {
    icon: MonitorIcon,
    title: "In your browser",
    description: "No signup, nothing uploaded",
  },
  {
    icon: FileTextIcon,
    title: "US Letter",
    description: "Ready to print or send",
  },
] as const;

const TEMPLATE_PARTS = [
  {
    title: "Per-item discounts",
    text: "A percentage or a fixed amount off any line, with your own label",
    Sketch: DiscountSketch,
  },
  {
    title: "Custom columns",
    text: `Up to ${MAX_CUSTOM_COLUMNS} of your own in the items table, such as hours, project or SKU`,
    Sketch: CustomColumnsSketch,
  },
  {
    title: "Pay online link",
    text: "Optional, under the amount, pointing to any payment page you use",
    Sketch: PayOnlineSketch,
  },
  {
    title: "Line-item table",
    text: "Quantity and unit price, then subtotal, tax and total",
    Sketch: ItemsTableSketch,
  },
  {
    title: "Logo and details",
    text: "Your logo beside the invoice title, your details next to your client's",
    Sketch: LogoAndPartiesSketch,
  },
] as const;

const HOW_TO_STEPS = [
  "Add your details as the seller and your client's as the buyer",
  "Set the invoice number, issue date and due date",
  "Add a line for each product or service, with quantity and price",
  "Paste a payment link into Pay online if you want one on the invoice",
  "Download the PDF, or copy a link that opens the same invoice",
] as const;

// no "no watermark": every PDF prints a "Created with easyinvoicepdf.com" footer credit
const FAQ = [
  {
    question: "Do I need a Stripe account to use this template?",
    answer:
      "No. The template copies the look of a Stripe invoice, but nothing here connects to Stripe. You type the details and download a PDF.",
  },
  {
    question: "Can my client pay from the invoice?",
    answer:
      "Only through a link you add. Paste any payment URL, such as a Stripe Payment Link, PayPal or your bank's page, into Pay online and it becomes a clickable link in the PDF. You can put the same link in the QR code field too.",
  },
  {
    question: "Is the Stripe invoice template free?",
    answer:
      "Yes. There is no paid plan and no limit on how many invoices you download.",
  },
  {
    question: "Can I add my logo?",
    answer:
      "Yes. Upload a JPEG, PNG or WebP and it appears at the top of the invoice.",
  },
] as const;
