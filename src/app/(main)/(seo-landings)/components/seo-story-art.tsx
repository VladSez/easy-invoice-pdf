import {
  Download,
  ChevronDown,
  ChevronUp,
  FileText,
  Link2,
  Lock,
  Wifi,
} from "lucide-react";
import Link from "next/link";

import {
  SceneActionButtons,
  SceneToast,
  SceneToastProvider,
} from "@/app/(main)/(seo-landings)/components/seo-story-scene-actions";
import { FinalProjectLogo } from "@/components/etc/final-project-logo";
import { GITHUB_URL } from "@/config";
import { cn } from "@/lib/utils";

import type { SeoStoryStepArt } from "../seo-landing-definitions";

/**
 * The hero's picture: the generator open in a browser window on a desktop, drawn in
 * HTML. The form and the PDF beside it follow the real app's layout and wording; the
 * browser chrome, the menu bar and the toast around them only set the scene.
 *
 * On a phone the form and most of the chrome drop away and the PDF is left on its own,
 * which is also what the app itself shows first there.
 */
export function HeroAppScene({ appHref }: { appHref: string }) {
  return (
    <SceneToastProvider>
      <figure className="relative m-0 overflow-hidden rounded-2xl bg-[#eeeeec] shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]">
        {/* the drawing itself is hidden from screen readers piece by piece, so that its
          two buttons, which do respond, stay reachable */}
        <figcaption className="sr-only">
          A drawing of the invoice generator: the form beside the PDF it makes.
        </figcaption>
        <div
          aria-hidden="true"
          className="flex h-[30px] items-center gap-[18px] bg-white/70 px-[22px] text-[13px] text-neutral-900 shadow-[inset_0_-1px_0_rgba(0,0,0,.06)]"
        >
          <FinalProjectLogo className="size-3.5 md:size-3.5" />
          <b>EasyInvoicePDF</b>
          {MENU_ITEMS.map((item) => {
            return (
              <span key={item} className="hidden md:inline">
                {item}
              </span>
            );
          })}
          <span className="ml-auto flex items-center gap-3.5">
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <FileText className="size-[13px]" strokeWidth={2} />
              Invoice due Friday
            </span>
            <Wifi className="size-4" strokeWidth={2.2} />
          </span>
        </div>

        <div className="flex justify-center px-3 pb-7 pt-6 md:px-12 md:pb-16 md:pt-14">
          <div className="w-full max-w-[960px] overflow-hidden rounded-[14px] bg-neutral-50 shadow-[inset_0_0_0_1px_rgba(0,0,0,.08),0_40px_80px_-40px_rgba(0,0,0,.35)]">
            <div
              className="flex h-11 items-center gap-3 px-4"
              aria-hidden="true"
            >
              <span className="flex gap-2">
                <span className="size-3 rounded-full bg-[#ff5f57]" />
                <span className="size-3 rounded-full bg-[#febc2e]" />
                <span className="size-3 rounded-full bg-[#28c840]" />
              </span>
              <span className="mx-auto flex h-[26px] w-3/5 max-w-[380px] items-center justify-center gap-1.5 rounded-lg bg-black/5 text-xs text-neutral-800">
                <Lock className="size-[11px]" strokeWidth={2.2} />
                easyinvoicepdf.com
              </span>
              <span className="w-[52px]" />
            </div>

            <div className="bg-white px-3 pt-4 shadow-[inset_0_1px_0_rgba(0,0,0,.06)] md:h-[470px] md:overflow-hidden md:px-5 md:pt-[18px]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2" aria-hidden="true">
                  <FinalProjectLogo className="h-7 w-[27px] md:h-7 md:w-[27px]" />
                  <div className="leading-[1.15]">
                    <div className="text-lg font-bold text-slate-800">
                      EasyInvoicePDF
                    </div>
                    <div className="hidden text-[11px] text-slate-700 sm:block">
                      Free &amp; Open-Source Invoice Generator
                    </div>
                  </div>
                </div>
                <SceneActionButtons />
              </div>

              <div
                aria-hidden="true"
                className="mt-4 grid gap-3.5 md:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]"
              >
                <div className="hidden flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex">
                  <MockSectionTitle title="Seller Information" isOpen />
                  <div className="text-[10px] font-semibold tracking-[0.08em] text-slate-500">
                    BUSINESS
                  </div>
                  <MockField label="Name" value="Alex Morgan Design" />
                  <MockField label="Address" value="12 High Street, London" />
                  <MockField label="Email" value="hello@example.com" />
                  <div className="my-0.5 h-px bg-gray-200" />
                  <MockSectionTitle title="Buyer Information" isOpen={false} />
                </div>

                <div className="overflow-hidden rounded-lg bg-slate-100 px-3.5 pt-3.5">
                  <div className="bg-white px-[22px] pb-[30px] pt-[22px] text-[8.5px] leading-[1.45] text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,.12)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[15px] font-bold">
                        Invoice No. of: 1/11-2026
                      </div>
                      <div className="text-right text-[7.5px]">
                        Date of issue: <b>2026-11-25</b>
                        <br />
                        Date of service: <b>2026-11-30</b>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-[18px]">
                      <MockParty
                        heading="Seller"
                        name="Alex Morgan Design"
                        address="12 High Street, London"
                        email="hello@example.com"
                      />
                      <MockParty
                        heading="Buyer"
                        name="Client Company Ltd"
                        address="45 Market Road, Manchester"
                        email="accounts@example.com"
                      />
                    </div>
                    <table className="mt-3.5 w-full border-collapse text-[7.5px]">
                      <thead>
                        <tr className="text-center font-bold">
                          {[
                            "No",
                            "Name of goods/service",
                            "Qty",
                            "Net price",
                            "VAT",
                            "VAT amount",
                            "Pre-tax amount",
                          ].map((heading) => {
                            return (
                              <th key={heading} className={PDF_CELL}>
                                {heading}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className={PDF_CELL}>1.</td>
                          <td className={PDF_CELL}>Website design</td>
                          <td className={cn(PDF_CELL, "text-right")}>1</td>
                          <td className={cn(PDF_CELL, "text-right")}>
                            2,400.00
                          </td>
                          <td className={cn(PDF_CELL, "text-center")}>20%</td>
                          <td className={cn(PDF_CELL, "text-right")}>480.00</td>
                          <td className={cn(PDF_CELL, "text-right")}>
                            2,880.00
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={7}
                            className={cn(PDF_CELL, "text-right")}
                          >
                            SUM: <b>2,880.00</b>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-3.5 text-[11px] font-bold underline">
                      To pay: 2,880.00 EUR
                    </div>
                    <div className="mt-[3px]">
                      Amount in words:{" "}
                      <b>two thousand eight hundred and eighty EUR 00/100</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SceneToast appHref={appHref} />
      </figure>
    </SceneToastProvider>
  );
}

/** The drawing beside one step, on the grey panel every step shares. */
export function StoryStepArt({ art }: { art: SeoStoryStepArt }) {
  return (
    <div className="flex justify-center rounded-3xl bg-[#eeeeec] p-5 sm:p-8 md:p-10">
      {art === "blank-invoice" ? (
        <BlankInvoiceArt />
      ) : art === "live-preview" ? (
        <LivePreviewArt />
      ) : art === "download-or-share" ? (
        <DownloadOrShareArt />
      ) : (
        <PrivacyFactsArt />
      )}
    </div>
  );
}

/** The General Information card as a new visitor finds it: already numbered and dated. */
function BlankInvoiceArt() {
  return (
    <div
      className={cn(CARD, "flex max-w-[400px] flex-col gap-3 p-5")}
      aria-hidden="true"
    >
      <MockSectionTitle title="General Information" isOpen />
      <div className="grid grid-cols-2 gap-2.5">
        <MockField label="Template" value="Default" isSelect />
        <MockField label="PDF language" value="English" isSelect />
      </div>
      <MockField label="Currency" value="EUR € Euro" />
      <div className="grid grid-cols-2 gap-2.5">
        <MockField label="Invoice number" value="1/11-2026" />
        <MockField label="Date of issue" value="2026-11-25" />
      </div>
    </div>
  );
}

/** An item being edited, and the row it fills in the PDF, highlighted. */
function LivePreviewArt() {
  return (
    <div
      className="flex w-full flex-wrap items-center gap-4"
      aria-hidden="true"
    >
      <div
        className={cn(
          CARD,
          "flex min-w-0 flex-[1_1_220px] flex-col gap-2.5 p-[18px]",
        )}
      >
        <span className="text-[15px] font-semibold text-slate-900">
          Invoice Items
        </span>
        <MockField label="Name" value="Website design" />
        <div className="grid grid-cols-2 gap-2">
          <MockField label="Unit price" value="2400" isFocused />
          <MockField label="VAT" value="20" />
        </div>
      </div>
      <div className="min-w-0 flex-[1.3_1_260px] rounded bg-white p-[18px] text-[9px] leading-[1.45] text-neutral-900 shadow-[0_24px_48px_-24px_rgba(0,0,0,.3),0_1px_3px_rgba(0,0,0,.1)]">
        <table className="w-full border-collapse text-[8px]">
          <thead>
            <tr className="text-center font-bold">
              {["No", "Name", "Net price", "VAT", "Pre-tax"].map((heading) => {
                return (
                  <th key={heading} className={PDF_CELL}>
                    {heading}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-yellow-100">
              <td className={PDF_CELL}>1.</td>
              <td className={PDF_CELL}>Website design</td>
              <td className={cn(PDF_CELL, "text-right")}>2,400.00</td>
              <td className={cn(PDF_CELL, "text-center")}>20%</td>
              <td className={cn(PDF_CELL, "text-right")}>2,880.00</td>
            </tr>
            <tr>
              <td colSpan={5} className={cn(PDF_CELL, "text-right")}>
                SUM: <b>2,880.00</b>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-xs font-bold underline">
          To pay: 2,880.00 EUR
        </div>
        <div className="mt-0.5">
          Left to pay: <b>2,880.00 EUR</b>
        </div>
      </div>
    </div>
  );
}

/** The two ways out of the app: the PDF, and a link that was just copied. */
function DownloadOrShareArt() {
  return (
    <div
      className={cn(
        CARD,
        "my-2 flex max-w-[440px] flex-col gap-3.5 p-5 md:my-4",
      )}
      aria-hidden="true"
    >
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 text-sm text-slate-900">
          <Link2 className="size-3.5" />
          Get link
        </span>
        <span className="inline-flex h-[38px] min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-lg bg-slate-900 px-3.5 text-sm text-white">
          <Download className="size-3.5" />
          Download PDF in English
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-[9px] text-xs text-slate-600 shadow-[inset_0_0_0_1px_#e5e7eb]">
        <Link2 className="size-[13px] flex-none" />
        <span className="min-w-0 truncate">
          easyinvoicepdf.com/?data=N4IgjCBcIGoIIBUQBoQGYohSALFAL…
        </span>
        <span className="flex-none font-semibold text-slate-900">Copied</span>
      </div>
    </div>
  );
}

/**
 * Where the invoice goes, as plain facts. Unlike the other drawings this is real
 * content, so it is a list screen readers can read rather than a hidden picture.
 */
function PrivacyFactsArt() {
  return (
    <dl
      className={cn(
        CARD,
        "my-0 max-w-[480px] px-[22px] py-1.5 text-sm md:my-2",
      )}
    >
      {PRIVACY_FACTS.map((fact) => {
        return (
          <div
            key={fact.label}
            className="flex justify-between gap-4 border-b border-neutral-200/70 py-3.5 last:border-b-0"
          >
            <dt className="text-neutral-600">{fact.label}</dt>
            <dd className="text-right font-semibold">
              {fact.label === "Source code" ? (
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
                >
                  {fact.value}
                </Link>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function MockSectionTitle({
  title,
  isOpen,
}: {
  title: string;
  isOpen: boolean;
}) {
  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] font-semibold text-slate-900">{title}</span>
      <span className="flex size-[22px] items-center justify-center rounded-full bg-slate-100">
        <Chevron className="size-3 text-slate-700" strokeWidth={2.4} />
      </span>
    </div>
  );
}

interface MockFieldProps {
  label: string;
  value: string;
  /** Draws a dropdown arrow, for the app's selects. */
  isSelect?: boolean;
  /** Draws the focus ring, for the field being typed in. */
  isFocused?: boolean;
}

/** A labelled input, drawn: a span rather than an `<input>`, so nothing can be typed. */
function MockField({ label, value, isSelect, isFocused }: MockFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-[5px] text-xs text-gray-900">
      {label}
      <span
        className={cn(
          "flex min-w-0 justify-between gap-2 truncate rounded-md border bg-white px-2.5 py-[7px] text-[13px]",
          isFocused
            ? "border-slate-900 shadow-[0_0_0_3px_rgba(15,23,42,.12)]"
            : "border-gray-300",
        )}
      >
        {value}
        {isSelect ? (
          <ChevronDown className="size-3.5 flex-none self-center text-slate-500" />
        ) : null}
      </span>
    </div>
  );
}

function MockParty({
  heading,
  name,
  address,
  email,
}: {
  heading: string;
  name: string;
  address: string;
  email: string;
}) {
  return (
    <div className="min-w-0">
      <div className="border-b border-gray-500 pb-px text-[10.5px] font-bold">
        {heading}
      </div>
      <div className="mt-[5px] text-[9.5px] font-bold">{name}</div>
      <div className="font-semibold">{address}</div>
      <div className="truncate">
        e-mail: <b>{email}</b>
      </div>
    </div>
  );
}

const MENU_ITEMS = ["File", "Edit", "View", "Window"] as const;

/** A white card floating on the grey panel. */
const CARD =
  "w-full rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,.08),0_24px_48px_-24px_rgba(0,0,0,.3)]";

/** A cell of the drawn PDF's tables, ruled like the default template. */
const PDF_CELL = "border border-gray-400 px-[5px] py-[3px]";

const PRIVACY_FACTS = [
  { label: "Invoice data uploaded", value: "None" },
  { label: "Where the PDF is made", value: "In your browser" },
  { label: "Where your draft is saved", value: "This browser" },
  { label: "Source code", value: "Public on GitHub" },
] as const;
