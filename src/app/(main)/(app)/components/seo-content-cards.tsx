import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { FaqAccordion, FaqAccordionItem } from "@/components/ui/faq-accordion";
import { cn } from "@/lib/utils";

import { ScrollToEditorButton } from "./scroll-to-editor-button";
import { SeoContentHeading } from "./seo-content-text";

/*
 * Card layouts for the crawlable copy below the editor, shared by `HomeSeoContent` on `/`
 * and `StripeTemplateSeoContent` on `/stripe-template` so both pages look alike. All copy
 * stays server-rendered text; only `ScrollToEditorButton` runs on the client.
 */

/** A white card on the gray page background, the base of every block here. */
export const SEO_CARD_CLASS_NAME =
  "rounded-2xl border border-gray-200 bg-white";

/** The `className` of an inline text link inside the cards. */
export const SEO_LINK_CLASS_NAME =
  "font-medium text-slate-900 underline decoration-slate-400 underline-offset-4 transition-colors hover:decoration-slate-900";

/** The outer `<section>` and its centered column. */
export function SeoContentSection({
  labelledBy,
  testId,
  children,
}: SeoContentSectionProps) {
  return (
    <section
      className="w-full bg-gray-100 px-4 pb-12 pt-8 md:pb-20 md:pt-14"
      aria-labelledby={labelledBy}
      data-testid={testId}
    >
      <div className="mx-auto max-w-5xl space-y-14 text-slate-800 md:space-y-20">
        {children}
      </div>
    </section>
  );
}

/**
 * The opening block: the heading and lead paragraphs in a large card, beside a 2x2 grid of
 * short facts. The facts drop below the text on narrow screens.
 */
export function SeoContentIntro({
  headingId,
  heading,
  facts,
  children,
}: SeoContentIntroProps) {
  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div
        className={cn(
          SEO_CARD_CLASS_NAME,
          "min-w-0 flex-[999_1_480px] p-6 sm:p-9",
        )}
      >
        <SeoContentHeading id={headingId}>{heading}</SeoContentHeading>
        <div className="mt-4 space-y-4 text-pretty text-base leading-relaxed sm:mt-5 sm:text-lg">
          {children}
        </div>
      </div>

      <ul className="grid min-w-0 flex-[1_1_360px] grid-cols-2 gap-3">
        {facts.map(({ icon: Icon, title, description }) => {
          return (
            <li
              key={title}
              className={cn(
                SEO_CARD_CLASS_NAME,
                "grid min-h-32 grid-rows-[1fr_auto_auto] gap-1 p-4 sm:min-h-36 sm:p-5",
              )}
            >
              <Icon
                className="size-6 text-slate-900"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="text-pretty text-[15px] font-semibold text-slate-900 sm:text-base">
                {title}
              </span>
              <span className="text-pretty text-[13px] leading-snug text-slate-600">
                {description}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A grid of feature cards, three across on a wide screen, one on a phone. Each child is a
 * `SeoContentFeatureCard`.
 */
export function SeoContentFeatureGrid({ children }: SeoContentChildrenProps) {
  return (
    <ul className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
      {children}
    </ul>
  );
}

/** A feature: a small drawing of it, its name in bold, then one line on what it does. */
export function SeoContentFeatureCard({
  sketch,
  title,
  children,
}: SeoContentFeatureCardProps) {
  return (
    <li
      className={cn(
        SEO_CARD_CLASS_NAME,
        "flex flex-col gap-3.5 p-3.5 pb-[18px]",
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-[92px] flex-col justify-center gap-1.5 rounded-[10px] border border-slate-100 bg-slate-50 p-3.5"
      >
        {sketch}
      </div>
      <div className="mx-1 space-y-1">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="text-pretty text-[15px] leading-normal text-slate-600">
          {children}
        </p>
      </div>
    </li>
  );
}

/**
 * The how-to: numbered steps in one card, two columns where they fit, with a "Start in
 * the editor" button beside the heading.
 */
export function SeoContentStepsCard({
  heading,
  steps,
}: SeoContentStepsCardProps) {
  return (
    <div className={cn(SEO_CARD_CLASS_NAME, "p-6 sm:p-8")}>
      <SeoContentBlockHeader withEditorButton>{heading}</SeoContentBlockHeader>
      <ol className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-10 gap-y-4">
        {steps.map((step, index) => {
          return (
            <li key={step} className="flex items-start gap-3.5">
              <SeoContentNumberBadge number={index + 1} />
              <span className="text-pretty pt-1 text-[15px] leading-relaxed sm:text-base">
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * The FAQ: the heading and a short note on the left, the questions in a card on the
 * right. Stacks on narrow screens.
 */
export function SeoContentFaq({ items, aside }: SeoContentFaqProps) {
  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
      <div className="min-w-0 flex-[1_1_260px]">
        <SeoContentHeading>FAQ</SeoContentHeading>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 sm:text-base">
          {aside}
        </p>
      </div>
      <div
        className={cn(
          SEO_CARD_CLASS_NAME,
          "min-w-0 flex-[999_1_520px] px-5 sm:px-6",
        )}
      >
        <FaqAccordion className="space-y-0">
          {items.map((item) => {
            return (
              <FaqAccordionItem key={item.question} question={item.question}>
                {item.answer}
              </FaqAccordionItem>
            );
          })}
        </FaqAccordion>
      </div>
    </div>
  );
}

/** A block's `<h2>` with an optional "Start in the editor" button on its right. */
function SeoContentBlockHeader({
  withEditorButton = false,
  children,
}: SeoContentBlockHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <SeoContentHeading>{children}</SeoContentHeading>
      {withEditorButton ? <ScrollToEditorButton /> : null}
    </div>
  );
}

/** The dark round number on a step. Decorative: the list numbers it. */
function SeoContentNumberBadge({ number }: SeoContentNumberBadgeProps) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold tabular-nums text-white"
    >
      {number}
    </span>
  );
}

interface SeoContentSectionProps {
  /** The id of the section's first heading. */
  labelledBy: string;
  /** `data-testid` of the section, which e2e tests find it by. */
  testId: string;
  children: ReactNode;
}

interface SeoContentFact {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface SeoContentIntroProps {
  /** The heading's id, for the section's `aria-labelledby`. */
  headingId: string;
  heading: ReactNode;
  /** The four short facts in the grid beside the text. */
  facts: readonly SeoContentFact[];
  /** The lead paragraphs. */
  children: ReactNode;
}

interface SeoContentBlockHeaderProps {
  /** Show the button that scrolls back up to the editor. */
  withEditorButton?: boolean;
  children: ReactNode;
}

interface SeoContentChildrenProps {
  children: ReactNode;
}

interface SeoContentFeatureCardProps {
  /** A small drawing of the feature, decorative: the text says the same. */
  sketch: ReactNode;
  /** The feature's name, shown in bold. */
  title: ReactNode;
  /** One line on what the feature does. */
  children: ReactNode;
}

interface SeoContentStepsCardProps {
  heading: ReactNode;
  steps: readonly string[];
}

interface SeoContentNumberBadgeProps {
  number: number;
}

interface SeoContentFaqItem {
  question: string;
  answer: string;
}

interface SeoContentFaqProps {
  items: readonly SeoContentFaqItem[];
  /** The note under the FAQ heading. */
  aside: ReactNode;
}
