import {
  ArrowRightIcon,
  CircleCheckIcon,
  CodeXmlIcon,
  Link2Icon,
  MonitorIcon,
  UserRoundXIcon,
} from "lucide-react";
import Link from "next/link";

import {
  SUPPORTED_CURRENCIES,
  SUPPORTED_DATE_FORMATS,
  SUPPORTED_INVOICE_PDF_LANGUAGES,
} from "@/app/schema";
import { cn } from "@/lib/utils";

import {
  SEO_CARD_CLASS_NAME,
  SEO_LINK_CLASS_NAME,
  SeoContentFaq,
  SeoContentFeatureCard,
  SeoContentFeatureGrid,
  SeoContentIntro,
  SeoContentSection,
  SeoContentStepsCard,
} from "./seo-content-cards";
import {
  LanguagesSketch,
  SketchBar,
  SketchPills,
} from "./seo-content-sketches";
import { SeoContentHeading } from "./seo-content-text";
import { TemplateChooser } from "./template-chooser";

/**
 * Plain, server-rendered copy below the invoice editor on `/`.
 *
 * The editor renders on the client, so before this the prerendered HTML held a loading
 * skeleton and the footer: under 300 words for the page that gets most of the site's
 * impressions. This says what the tool is in crawlable text, and links each landing page
 * with anchor text that names it, which a footer link list does less convincingly.
 *
 * Only on `/`: `/stripe-template` is indexed as its own page and has its own copy,
 * `StripeTemplateSeoContent`, written for the Stripe template's queries. Both are built
 * from the same blocks (`seo-content-cards.tsx`) in the same order; this one adds the
 * use-case links at the end.
 */
export function HomeSeoContent() {
  return (
    <SeoContentSection
      labelledBy="home-seo-content-heading"
      testId="home-seo-content"
    >
      <SeoContentIntro
        headingId="home-seo-content-heading"
        heading="A free invoice generator that runs in your browser"
        facts={FACTS}
      >
        <p>
          EasyInvoicePDF turns a short form into a PDF invoice. Type your
          details, your client&apos;s and the line items, and the preview
          redraws as you go. Download the PDF when it looks right. There is{" "}
          <Link
            href="/invoice-generator-no-login"
            className={SEO_LINK_CLASS_NAME}
          >
            no login and no signup
          </Link>
          , and the invoice is built on your own machine, so nothing you type is
          uploaded.
        </p>
        <p>
          It is free, has no ads, and the{" "}
          <Link
            href="/open-source-invoice-generator"
            className={SEO_LINK_CLASS_NAME}
          >
            source code is open
          </Link>{" "}
          under AGPL-3.0, so you can read it or host your own copy.
        </p>
      </SeoContentIntro>

      <div>
        <SeoContentHeading>What goes on the invoice</SeoContentHeading>
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
            Every label, including the total written out in words
          </SeoContentFeatureCard>
          {FEATURES.map(({ title, text, Sketch }) => {
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
        heading="How to create an invoice"
        steps={HOW_TO_STEPS}
      />

      <div>
        <SeoContentHeading>Classic or Stripe?</SeoContentHeading>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          Two layouts, one form. Switch any time and your details carry over.
        </p>
        <TemplateChooser />
      </div>

      <SeoContentFaq
        items={FAQ}
        aside={
          <>
            The short answers. For a walkthrough, see{" "}
            <Link href="/how-it-works" className={SEO_LINK_CLASS_NAME}>
              how it works
            </Link>
            .
          </>
        }
      />

      <div>
        <SeoContentHeading>Invoices for every kind of work</SeoContentHeading>
        <ul className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-2.5">
          {USE_CASE_LINKS.map(({ href, label }) => {
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    SEO_CARD_CLASS_NAME,
                    "group flex h-full min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5",
                  )}
                >
                  {label}
                  <ArrowRightIcon
                    className="size-[18px] shrink-0 text-slate-400 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-slate-900"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </SeoContentSection>
  );
}

function CurrenciesSketch() {
  return (
    <SketchPills
      words={["€1,200.00", "$1,200.00", "1 200,00 zł", "£1,200.00"]}
      className="font-mono"
    />
  );
}

function DateFormatsSketch() {
  return (
    <div className="flex flex-col gap-1 font-mono text-xs text-slate-700">
      <span>2026-03-20</span>
      <span>20.03.2026</span>
      <span>March 20, 2026</span>
    </div>
  );
}

function TaxLabelSketch() {
  return <SketchPills words={["VAT", "GST", "Sales Tax", "Your own"]} />;
}

function LogoBankQrSketch() {
  return (
    <div className="flex items-center gap-3.5">
      <span className="size-9 shrink-0 rounded-lg bg-slate-300" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SketchBar className="w-4/5 bg-slate-300" />
        <SketchBar className="w-3/5" />
      </div>
      <span className="size-11 shrink-0 rounded border border-slate-900 bg-[repeating-conic-gradient(theme(colors.slate.900)_0_25%,white_0_50%)] bg-[length:11px_11px]" />
    </div>
  );
}

function ShareLinkSketch() {
  return (
    <span className="inline-flex h-[34px] items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3">
      <Link2Icon className="size-3.5 text-slate-900" aria-hidden="true" />
      <span className="font-mono text-xs text-slate-700">
        easyinvoicepdf.com/?data=…
      </span>
    </span>
  );
}

const FACTS = [
  {
    icon: CircleCheckIcon,
    title: "Free, no ads",
    description: "No paid plan, no invoice limit",
  },
  {
    icon: UserRoundXIcon,
    title: "No account",
    description: "Open the page and start typing",
  },
  {
    icon: MonitorIcon,
    title: "On your device",
    description: "Nothing you type is uploaded",
  },
  {
    icon: CodeXmlIcon,
    title: "Open source",
    description: "AGPL-3.0, host your own copy",
  },
] as const;

const FEATURES = [
  {
    title: `${SUPPORTED_CURRENCIES.length} currencies`,
    text: "Each with its own symbol and number format",
    Sketch: CurrenciesSketch,
  },
  {
    title: `${SUPPORTED_DATE_FORMATS.length} date formats`,
    text: "From 2026-03-20 to March 20, 2026",
    Sketch: DateFormatsSketch,
  },
  {
    title: "Custom tax labels",
    text: "VAT, GST, Sales Tax or your own, or no tax columns at all",
    Sketch: TaxLabelSketch,
  },
  {
    title: "Logo, bank, QR code",
    text: "Your logo, bank details, and a QR code for a payment link",
    Sketch: LogoBankQrSketch,
  },
  {
    title: "Saved in your browser, shared by link",
    text: "Your details stay saved in your browser, so the next invoice starts filled in. Send the PDF, or a link that opens the same invoice",
    Sketch: ShareLinkSketch,
  },
] as const;

const HOW_TO_STEPS = [
  "Fill in your details as the seller, and your client's as the buyer",
  "Pick the invoice language, currency and date format",
  "Add a line for each product or service, with quantity and price",
  "Download the PDF, or copy a link to send your client",
] as const;

const USE_CASE_LINKS = [
  { href: "/freelance-invoice-template", label: "Freelance invoice template" },
  {
    href: "/contractor-invoice-template",
    label: "Contractor invoice template",
  },
  { href: "/proforma-invoice-generator", label: "Proforma invoice generator" },
  {
    href: "/export-invoice-format",
    label: "Export invoice format for services",
  },
  { href: "/invoice-template-pdf", label: "Invoice template PDF" },
  {
    href: "/stripe-invoice-alternative",
    label: "Stripe-style invoice without Stripe",
  },
  { href: "/swedish-invoice-generator", label: "Swedish invoice generator" },
  {
    href: "/norwegian-invoice-generator",
    label: "Norwegian invoice generator",
  },
] as const;

// "no watermark" only with the footer credit next to it: every PDF prints a small
// "Created with easyinvoicepdf.com" line (`invoice-footer.tsx`, `stripe-footer.tsx`)
const FAQ = [
  {
    question: "Is EasyInvoicePDF really free?",
    answer:
      'Yes. There is no paid plan and no limit on how many invoices you make. There is no watermark across the invoice, only a small "Created with easyinvoicepdf.com" line in the footer.',
  },
  {
    question: "Do I need an account?",
    answer:
      "No. There is no signup and no email step. Open the page and start typing.",
  },
  {
    question: "Where is my invoice data stored?",
    answer:
      "In your own browser's storage. The PDF is generated on your device, so the invoice never reaches a server. Clearing your browser data removes it, so keep the PDFs you need.",
  },
  {
    question: "Can I add my logo?",
    answer:
      "Yes. Both templates accept a JPEG, PNG or WebP logo at the top of the invoice.",
  },
  {
    question: "Is this accounting software?",
    answer:
      "No. It makes invoice PDFs and does not track payments, file taxes or keep books. Check the invoice against the rules that apply to your business.",
  },
] as const;
