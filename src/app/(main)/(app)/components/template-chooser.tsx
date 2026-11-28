"use client";

import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import type { SupportedTemplates } from "@/app/schema";
import { cn } from "@/lib/utils";
import {
  getRouteTemplate,
  STRIPE_TEMPLATE_PATHNAME,
} from "@/utils/invoice-app-url";

import { ScrollToEditorButton } from "./scroll-to-editor-button";
import { SEO_CARD_CLASS_NAME } from "./seo-content-cards";

/**
 * Both templates side by side, each with a render of its first page and what sets it
 * apart, so a visitor can pick before filling anything in. The template in use comes
 * first: classic on `/`, Stripe on `/stripe-template`.
 *
 * Reads the current template from `usePathname()`, which follows the address-bar rewrite
 * of a template switch in the editor (`TemplateSeoContentSwap` swaps the copy around it on
 * the same signal). Each route's prerender sees its own path, so the served HTML -- what a
 * crawler reads -- marks that route's template as current and links to the other one.
 */
export function TemplateChooser() {
  const pathname = usePathname();
  const currentTemplate = getRouteTemplate(pathname);

  const options = [...TEMPLATE_OPTIONS].sort((a, b) => {
    return (
      Number(b.template === currentTemplate) -
      Number(a.template === currentTemplate)
    );
  });

  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3">
      {options.map((option) => {
        return (
          <TemplateOptionCard
            key={option.template}
            option={option}
            isCurrent={option.template === currentTemplate}
          />
        );
      })}
    </div>
  );
}

function TemplateOptionCard({ option, isCurrent }: TemplateOptionCardProps) {
  return (
    <article
      aria-current={isCurrent ? "true" : undefined}
      aria-labelledby={`template-option-${option.template}`}
      className={cn(
        SEO_CARD_CLASS_NAME,
        "flex flex-col overflow-hidden",
        isCurrent
          ? "border-2 border-slate-900 shadow-xl shadow-slate-900/10 ring-4 ring-slate-900/[0.08]"
          : null,
      )}
    >
      <div
        className={cn(
          // top padding clears the "Current template" badge, on both cards so they line up
          "relative flex h-80 items-center justify-center px-6 pb-6 pt-14 sm:h-[460px] sm:px-7 sm:pb-7",
          isCurrent ? "bg-slate-200" : "bg-slate-100",
        )}
      >
        {isCurrent ? (
          <span className="absolute left-4 top-4 inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-900 px-3 text-[13px] font-semibold text-white">
            <CheckIcon
              className="size-3.5"
              strokeWidth={3}
              aria-hidden="true"
            />
            Current template
          </span>
        ) : null}
        <Image
          src={option.previewSrc}
          alt={option.previewAlt}
          width={option.previewWidth}
          height={PREVIEW_HEIGHT}
          sizes="320px"
          className="h-full w-auto max-w-full rounded-sm object-contain shadow-xl shadow-slate-900/15"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            id={`template-option-${option.template}`}
            className="text-xl font-semibold text-slate-900"
          >
            {option.name}
          </h3>
          <span className="inline-flex h-[26px] items-center rounded-full bg-slate-100 px-2.5 text-xs font-semibold text-slate-700">
            {option.pageSize}
          </span>
        </div>

        <ul className="space-y-2.5">
          {option.traits.map((trait) => {
            return (
              <li
                key={trait}
                className="flex gap-2.5 text-pretty text-[15px] leading-relaxed"
              >
                <CheckIcon
                  className="mt-1 size-4 shrink-0 text-slate-900"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {trait}
              </li>
            );
          })}
        </ul>

        <div className="mt-auto pt-2">
          {isCurrent ? (
            <ScrollToEditorButton label="Keep editing this one" />
          ) : (
            // a full page load: the app keeps the template it was opened on during
            // client-side navigation. The text names the template's page, since it is
            // the anchor text search engines read for that route
            <a
              href={option.switchHref}
              onPointerDown={(event) => {
                event.currentTarget.href = withSharedInvoice(option.switchHref);
              }}
              onFocus={(event) => {
                event.currentTarget.href = withSharedInvoice(option.switchHref);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-[15px] font-medium text-slate-900 transition-colors hover:border-slate-900"
            >
              {option.switchLabel}
              <ArrowRightIcon className="size-4 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Carries a shared invoice (`?data=`) over to the other template's link, so a visitor
 * who opened a shared link switches templates on that invoice, not on their saved one.
 *
 * Applied when the link is pressed or focused rather than while rendering: reading the
 * query during render (`useSearchParams()`) would drop this server-rendered block out of
 * the prerendered HTML, and the HTML a crawler reads should keep the bare link anyway.
 * Pointer-down covers plain, middle and modified clicks (new tab) and the context menu;
 * focus covers the keyboard.
 *
 * @param switchHref - The template's link without the shared invoice.
 * @returns The link with the current `data` param added, or `switchHref` when there is none.
 */
function withSharedInvoice(switchHref: string): string {
  const sharedInvoice = new URLSearchParams(window.location.search).get("data");

  if (!sharedInvoice) {
    return switchHref;
  }

  const url = new URL(switchHref, window.location.origin);
  url.searchParams.set("data", sharedInvoice);

  return `${url.pathname}${url.search}`;
}

/** Both previews are page 1 of the default invoice, rendered at this height. */
const PREVIEW_HEIGHT = 800;

const TEMPLATE_OPTIONS = [
  {
    template: "stripe",
    name: "Stripe",
    pageSize: "US Letter",
    previewSrc: "/template-previews/stripe-invoice-template.png",
    previewWidth: 618,
    previewAlt: "Example PDF made with the Stripe invoice template",
    traits: [
      "The amount due and due date in bold, above the items",
      "One plain table, then subtotal, tax and amount due",
      "An optional Pay online link under the amount",
      "A colored line across the top, in a color you pick",
    ],
    switchHref: STRIPE_TEMPLATE_PATHNAME,
    switchLabel: "Use the Stripe invoice template",
  },
  {
    template: "default",
    name: "Classic",
    pageSize: "A4",
    previewSrc: "/template-previews/classic-invoice-template.png",
    previewWidth: 565,
    previewAlt: "Example PDF made with the classic invoice template",
    traits: [
      "A numbered table with net price, VAT amount and pre-tax amount",
      "A VAT summary by rate",
      "To pay, paid and left to pay, with the amount in words",
      "Signature lines for whoever issues and receives it",
    ],
    // an explicit template: a bare `/` sends a visitor whose saved invoice uses the
    // Stripe template straight back to `/stripe-template`
    switchHref: "/?template=default",
    switchLabel: "Use the classic invoice template",
  },
] as const satisfies readonly TemplateOption[];

interface TemplateOption {
  template: SupportedTemplates;
  name: string;
  /** The PDF's page size, shown as a chip beside the name. */
  pageSize: string;
  /** A render of page 1, under `public/`. */
  previewSrc: string;
  /** The render's width in pixels; every render is `PREVIEW_HEIGHT` tall. */
  previewWidth: number;
  previewAlt: string;
  /** What sets this template apart from the other one. */
  traits: readonly string[];
  /** Opens this template, with a full page load. */
  switchHref: string;
  switchLabel: string;
}

interface TemplateOptionCardProps {
  option: TemplateOption;
  /** The template the editor is on, which gets the badge and the "keep editing" button. */
  isCurrent: boolean;
}
