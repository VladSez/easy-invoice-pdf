import Link from "next/link";

import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import { BlackGoToAppButton } from "@/app/(components)/header/go-to-app-button-cta";
import { seoHeroCtaMarker } from "@/app/(main)/(seo-landings)/components/seo-cta-marker";
import { StickySeoCta } from "@/app/(main)/(seo-landings)/components/sticky-seo-cta";
import { GithubIcon } from "@/components/etc/github-logo";
import {
  type RoughAnnotationType,
  RoughAnnotation,
} from "@/components/rough-annotation";
import { Button } from "@/components/ui/button";
import { FaqAccordion, FaqAccordionItem } from "@/components/ui/faq-accordion";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { GITHUB_URL } from "@/config";

import {
  type ComparisonTable,
  type SeoLandingDefinition,
  type SeoSection,
} from "../seo-landing-definitions";
import { SeoLandingJsonLd } from "./seo-landing-json-ld";

interface SeoLandingShellProps {
  definition: SeoLandingDefinition;
}

/**
 * Where the mid-page CTA sits, counting sections from zero.
 *
 * A reader who has finished two sections has the answer they searched for, and the next
 * CTA is otherwise below the FAQ. The sticky bar covers the rest of the page, so one
 * inline prompt here is enough.
 */
const INLINE_CTA_AFTER_SECTION_INDEX = 1;

/**
 * Renders a complete SEO landing page shell with hero section, CTA buttons, and layout structure.
 *
 * @param {SeoLandingShellProps} props - Component props
 * @param {SeoLandingDefinition} props.definition - SEO landing page definition
 */
export function SeoLandingShell({ definition }: SeoLandingShellProps) {
  return (
    <>
      {/** Shown only while none of the in-page CTAs below is on screen. */}
      <StickySeoCta
        href={definition.hero.ctaHref}
        label={definition.hero.ctaLabel}
        slug={definition.slug}
      />
      <SeoLandingJsonLd definition={definition} />

      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex flex-1 flex-col md:pb-12">
          <div className="border-b border-slate-200 bg-white">
            <div className="container mx-auto max-w-4xl px-4 pb-6 pt-12 md:px-6 md:py-16 md:pb-8">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {definition.hero.h1}
              </h1>
              {/*
                The hero's opening paragraph, not a heading. It runs to a couple of
                sentences, and a heading that long dilutes the page outline that search
                engines and answer engines read the section titles from.
              */}
              <p className="mt-4 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl">
                {definition.hero.subheading}
              </p>
              <div
                className="mt-8 flex flex-col gap-4 md:flex-row"
                {...seoHeroCtaMarker}
              >
                <BlackGoToAppButton
                  className="w-full px-8 py-6 text-base lg:w-[325px] lg:px-10"
                  href={definition.hero.ctaHref}
                >
                  <span className="truncate">{definition.hero.ctaLabel}</span>
                </BlackGoToAppButton>
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative w-full overflow-hidden border-slate-200 px-8 py-6 text-base shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-slate-300 hover:shadow-md lg:w-[325px] lg:px-10"
                  asChild
                >
                  <Link
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon className="mr-2 size-6 transition-all duration-300 group-hover:scale-105" />
                    <span className="text-clip">View on GitHub</span>
                  </Link>
                </Button>
              </div>
              {definition.hero.heroVideo ? (
                <div className="mt-8 aspect-video overflow-hidden rounded-lg bg-slate-100/80 shadow-sm">
                  <YouTubeEmbed
                    src={definition.hero.heroVideo.embedUrl}
                    title={definition.hero.heroVideo.title}
                    testId="seo-landing-hero-video"
                  />
                </div>
              ) : definition.hero.heroImage ? (
                <div className="mt-8">
                  <a href={definition.hero.ctaHref}>
                    <img
                      src={definition.hero.heroImage}
                      alt={definition.hero.h1}
                      className="h-auto w-full rounded-lg bg-slate-100/80 shadow-sm"
                      loading="eager"
                      fetchPriority="high"
                      width={1920}
                      height={1536}
                    />
                  </a>
                </div>
              ) : null}
              {definition.hero.bullets.length > 0 ? (
                <div className="mt-3 text-pretty">
                  <p className="text-sm text-stone-900">
                    {definition.hero.bullets.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="container mx-auto max-w-4xl flex-1 px-4 pt-6 md:px-6 md:pt-10">
            {definition.factsTable ? (
              <section
                className="border-b border-slate-100 py-6"
                data-testid="seo-landing-facts-table"
              >
                <h2
                  className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
                  data-testid="seo-landing-section-facts-table-title"
                >
                  <RoughAnnotation
                    type="underline"
                    // blue-500
                    color="rgb(59 130 246)"
                    strokeWidth={2.5}
                  >
                    {definition.factsTable.heading}
                  </RoughAnnotation>
                </h2>
                <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
                  {definition.factsTable.rows.map((row) => {
                    return (
                      <div
                        key={row.label}
                        className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4"
                      >
                        <dt className="text-base font-medium text-slate-900">
                          {row.label}
                        </dt>
                        <dd className="text-base text-slate-700 sm:col-span-2">
                          {row.value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </section>
            ) : null}
            {definition.sections.map((section, id) => {
              const canShowComparisonTable =
                section?.showComparisonTable ?? false;
              const comparisonTable = definition?.comparisonTable;

              return (
                <div key={section.title}>
                  <div className="my-2">
                    <SeoSectionBlock section={section} id={id} />
                  </div>
                  {id === INLINE_CTA_AFTER_SECTION_INDEX ? (
                    <SeoInlineCta
                      href={definition.hero.ctaHref}
                      label={definition.hero.ctaLabel}
                    />
                  ) : null}
                  {canShowComparisonTable && comparisonTable ? (
                    <div className="py-6 md:py-8">
                      <h2
                        className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
                        data-testid="seo-landing-section-comparison-table-title"
                      >
                        <RoughAnnotation
                          type="highlight"
                          // rose-300
                          color="rgb(253 164 175)"
                          className="font-bold italic"
                        >
                          {comparisonTable?.heading ?? "Feature comparison"}
                        </RoughAnnotation>
                      </h2>
                      {comparisonTable?.intro ? (
                        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
                          {comparisonTable.intro}
                        </p>
                      ) : null}
                      <div className="mt-6">
                        <SeoComparisonTable table={comparisonTable} />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            <section
              id="faq"
              className="pb-4 pt-10"
              aria-labelledby="seo-landing-faq-heading"
            >
              <h2
                id="seo-landing-faq-heading"
                className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
              >
                FAQ
              </h2>
              <FaqAccordion>
                {definition.faq.map((item) => {
                  return (
                    <FaqAccordionItem
                      key={item.question}
                      question={item.question}
                    >
                      {item.answer}
                    </FaqAccordionItem>
                  );
                })}
              </FaqAccordion>
            </section>

            <div className="flex justify-center py-6 md:py-12">
              <BlackGoToAppButton
                className="h-12 w-full px-8 text-base"
                href={definition.hero.ctaHref}
              >
                {definition.hero.ctaLabel}
              </BlackGoToAppButton>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

/** Mid-page prompt to open the app, shown once between the sections. */
function SeoInlineCta({ href, label }: { href: string; label: string }) {
  return (
    <div
      className="my-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      data-testid="seo-landing-inline-cta"
    >
      <div>
        <p className="text-base font-semibold text-slate-900">
          Ready to try it?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          The form opens with an empty invoice. Fill it in and download the PDF.
          No account needed.
        </p>
      </div>
      <BlackGoToAppButton
        className="w-full shrink-0 px-6 py-5 text-base sm:w-auto"
        href={href}
      >
        <span className="truncate">{label}</span>
      </BlackGoToAppButton>
    </div>
  );
}

function SeoSectionBlock({ section, id }: { section: SeoSection; id: number }) {
  const mark = SECTION_TITLE_MARKS[id % SECTION_TITLE_MARKS.length];

  return (
    <section
      className="border-b border-slate-100 py-6 last:border-b-0"
      data-testid={`seo-landing-section-${section.title}`}
    >
      <h2
        className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
        data-testid={"seo-landing-section-title"}
      >
        <RoughAnnotation
          type={mark.type}
          color={mark.color}
          strokeWidth={mark.type === "highlight" ? undefined : 2.5}
          className="font-bold italic"
        >
          {section.title}
        </RoughAnnotation>
      </h2>
      {section.lead ? (
        <p className="mt-4 max-w-3xl text-balance text-lg leading-relaxed text-slate-800">
          {section.lead}
        </p>
      ) : null}
      {section.paragraphs?.map((paragraph, index) => {
        return (
          <p
            key={`${section.title}-p-${index}`}
            className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-slate-800"
          >
            {paragraph}
          </p>
        );
      })}
      {section.bullets?.length ? (
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-6 text-base text-slate-800">
          {section.bullets.map((item) => {
            return (
              <li key={item} className="text-pretty">
                {item}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function SeoComparisonTable({ table }: { table: ComparisonTable }) {
  if (!table) {
    return null;
  }

  const [colA, colB, colC] = table.columnLabels;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[390px] text-left text-sm text-slate-800">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold md:px-4 md:py-3">
              {colA}
            </th>
            <th scope="col" className="px-3 py-2 font-semibold md:px-4 md:py-3">
              {colB}
            </th>
            <th scope="col" className="px-3 py-2 font-semibold md:px-4 md:py-3">
              {colC}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            return (
              <tr
                key={row.feature}
                className="border-b border-slate-100 last:border-0"
              >
                <th
                  scope="row"
                  className="px-3 py-2 font-medium text-slate-900 md:px-4 md:py-3"
                >
                  {row.feature}
                </th>
                <td className="px-3 py-2 text-slate-700 md:px-4 md:py-3">
                  {row.thisTool}
                </td>
                <td className="px-3 py-2 text-slate-700 md:px-4 md:py-3">
                  {row.other}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The hand-drawn marks on the section titles, cycled in order so neighbouring
 * sections never repeat one. Each draws when its title scrolls into view. No `circle`:
 * on a title this long the ellipse cuts through the first and last letters.
 */
const SECTION_TITLE_MARKS = [
  // yellow-300
  { type: "highlight", color: "rgb(253 224 71)" },
  // purple-500
  { type: "underline", color: "rgb(168 85 247)" },
  // green-500
  { type: "box", color: "rgb(34 197 94)" },
  // orange-500
  { type: "bracket", color: "rgb(249 115 22)" },
] as const satisfies { type: RoughAnnotationType; color: string }[];
