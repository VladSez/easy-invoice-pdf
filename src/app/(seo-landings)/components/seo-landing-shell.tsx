import { Footer } from "@/app/(components)/footer";
import { BlackGoToAppButton } from "@/app/(components)/header/go-to-app-button-cta";
import { GITHUB_URL } from "@/config";
import Link from "next/link";

import {
  type ComparisonTable,
  type SeoLandingDefinition,
  type SeoSection,
} from "../seo-landing-definitions";
import { SeoLandingJsonLd } from "./seo-landing-json-ld";
import { StickySeoCta } from "@/app/(seo-landings)/components/sticky-seo-cta";
import { Button } from "@/components/ui/button";
import { FaqAccordion, FaqAccordionItem } from "@/components/ui/faq-accordion";
import { GithubIcon } from "@/components/etc/github-logo";
import { Header } from "@/app/(components)/header";

interface SeoLandingShellProps {
  definition: SeoLandingDefinition;
}

/**
 * Renders a complete SEO landing page shell with hero section, CTA buttons, and layout structure.
 *
 * @param {SeoLandingShellProps} props - Component props
 * @param {SeoLandingDefinition} props.definition - SEO landing page definition
 */
export function SeoLandingShell({ definition }: SeoLandingShellProps) {
  return (
    <>
      {/** Sticky CTA component displayed at bottom of SEO landing pages. */}
      <StickySeoCta href={definition.hero.ctaHref} />
      <SeoLandingJsonLd definition={definition} />

      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex flex-1 flex-col md:pb-12">
          <div className="border-b border-slate-200 bg-white">
            <div className="container mx-auto max-w-4xl px-4 pb-6 pt-12 md:px-6 md:py-16 md:pb-8">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {definition.hero.h1}
              </h1>
              <h2 className="mt-4 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl">
                {definition.hero.subheading}
              </h2>
              <div className="mt-8 flex flex-col gap-4 md:flex-row">
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
              {definition.hero.heroImage ? (
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
              {definition.hero.bullets.length ? (
                <div className="mt-3 text-pretty">
                  <p className="text-sm text-stone-900">
                    {definition.hero.bullets.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="container mx-auto max-w-4xl flex-1 px-4 pt-6 md:px-6 md:pt-10">
            {definition.sections.map((section, id) => {
              const canShowComparisonTable =
                section?.showComparisonTable ?? false;
              const comparisonTable = definition?.comparisonTable;

              return (
                <div key={section.title}>
                  <div className="my-2">
                    <SeoSectionBlock section={section} id={id} />
                  </div>
                  {canShowComparisonTable && comparisonTable ? (
                    <div className="py-6 md:py-8">
                      <h2 className="w-fit bg-rose-500 text-2xl font-semibold italic tracking-tight text-white dark:bg-cyan-600 dark:text-white md:text-3xl">
                        👉 Feature comparison
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
                {definition.faq.map((item) => (
                  <FaqAccordionItem
                    key={item.question}
                    question={item.question}
                  >
                    {item.answer}
                  </FaqAccordionItem>
                ))}
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

function SeoSectionBlock({ section, id }: { section: SeoSection; id: number }) {
  const colors = [
    "bg-yellow-300/90 text-black dark:bg-yellow-600 dark:text-black",
    "bg-purple-500/90 dark:bg-purple-500 text-white dark:text-white",
    "bg-green-500/90 dark:bg-green-500 text-white dark:text-white",
    "bg-blue-500/90 dark:bg-blue-500 text-white dark:text-white",
    "bg-orange-500/90 dark:bg-orange-500 text-white dark:text-white",
    "bg-teal-500/90 dark:bg-teal-500 text-white dark:text-white",
    "bg-red-500/90 dark:bg-red-500 text-white dark:text-white",
  ] as const;

  const color = colors[id % colors.length];

  return (
    <section
      className="border-b border-slate-100 py-6 last:border-b-0"
      data-testid={`seo-landing-section-${section.title}`}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        <span className={`${color} px-3 font-bold italic`}>
          {section.title}
        </span>
      </h2>
      {section.lead ? (
        <p className="mt-4 max-w-3xl text-balance text-lg leading-relaxed text-slate-800">
          {section.lead}
        </p>
      ) : null}
      {section.paragraphs?.map((paragraph, index) => (
        <p
          key={`${section.title}-p-${index}`}
          className="mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-slate-800"
        >
          {paragraph}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-6 text-base text-slate-800">
          {section.bullets.map((item) => (
            <li key={item} className="text-pretty">
              {item}
            </li>
          ))}
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
          {table.rows.map((row) => (
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
