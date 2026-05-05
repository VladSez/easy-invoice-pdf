import { Footer } from "@/app/(components)/footer";
import { Header, type HeaderProps } from "@/app/(components)/header";
import { BlackGoToAppButton } from "@/app/(components)/header/go-to-app-button-cta";
import { GITHUB_URL } from "@/config";
import Link from "next/link";

import { SeoLandingJsonLd } from "./seo-landing-json-ld";
import {
  type ComparisonTable,
  type SeoLandingDefinition,
  type SeoSection,
} from "../seo-landing-definitions";
import { ChevronDownIcon } from "lucide-react";
import { StickySeoCta } from "@/app/(seo-landings)/components/sticky-seo-cta";

const HEADER_TRANSLATIONS = {
  navLinks: {
    home: "Product",
    features: "Features",
    faq: "FAQ",
    github: "GitHub",
    githubUrl: GITHUB_URL,
    githubCTA: "Star on GitHub",
    tagline: "Free & Open-Source Invoice Generator",
  },
  switchLanguageText: "Switch language",
  goToAppText: "Open app",
  startInvoicingButtonText: "Start Invoicing",
  changelogLinkText: "Changelog",
  termsOfServiceLinkText: "Terms of Service",
} as const satisfies HeaderProps["translations"];

interface SeoLandingShellProps {
  definition: SeoLandingDefinition;
}

export function SeoLandingShell({ definition }: SeoLandingShellProps) {
  return (
    <>
      <StickySeoCta href={definition.hero.ctaHref} />
      <SeoLandingJsonLd definition={definition} />
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header locale="en" translations={HEADER_TRANSLATIONS} />
        <main className="flex flex-1 flex-col md:pb-12">
          <div className="border-b border-slate-200 bg-white">
            <div className="container mx-auto max-w-4xl px-4 pb-6 pt-12 md:px-6 md:py-16 md:pb-8">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {definition.hero.h1}
              </h1>
              <h2 className="mt-4 max-w-3xl text-xl leading-relaxed text-slate-600 md:text-2xl">
                {definition.hero.subheading}
              </h2>
              <div className="mt-8">
                <BlackGoToAppButton
                  className="h-12 w-full px-8 text-base md:h-14 md:w-auto md:text-lg"
                  href={definition.hero.ctaHref}
                >
                  {definition.hero.ctaLabel}
                </BlackGoToAppButton>
              </div>
              {definition.hero.heroImage ? (
                <div className="mt-8">
                  <a href={definition.hero.ctaHref}>
                    <img
                      src={definition.hero.heroImage}
                      alt={definition.hero.h1}
                      className="h-auto w-full rounded-lg shadow-sm"
                    />
                  </a>
                </div>
              ) : null}
              {definition.hero.bullets.length ? (
                <div className="mt-4 text-pretty">
                  <p className="text-sm text-stone-700 md:text-base">
                    {definition.hero.bullets.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="container mx-auto max-w-4xl flex-1 px-4 pt-6 md:px-6 md:pt-10">
            {definition.sections.map((section, id) => (
              <div key={section.title}>
                <div className="my-2">
                  <SeoSectionBlock section={section} id={id} />
                </div>
                {definition.comparisonTable &&
                section.title === "When to use this instead" ? (
                  <div className="py-6 md:py-8">
                    <h2 className="w-fit bg-rose-500 text-2xl font-semibold tracking-tight text-white dark:bg-cyan-600 dark:text-white md:text-3xl">
                      Feature comparison
                    </h2>
                    {definition.comparisonTable.intro ? (
                      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
                        {definition.comparisonTable.intro}
                      </p>
                    ) : null}
                    <div className="mt-6">
                      <SeoComparisonTable table={definition.comparisonTable} />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <section
              id="faq"
              className="pb-4 pt-10 md:pt-12"
              aria-labelledby="seo-landing-faq-heading"
            >
              <h2
                id="seo-landing-faq-heading"
                className="mb-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl"
              >
                FAQ
              </h2>
              <div className="space-y-2">
                {definition.faq.map((item) => (
                  <details
                    key={item.question}
                    className="group cursor-pointer border-b border-dashed border-slate-400"
                  >
                    <summary className="flex select-none items-center justify-between gap-2 py-3 text-left">
                      <h3 className="text-base font-medium text-slate-900">
                        {item.question}
                      </h3>
                      <ChevronDownIcon
                        className="ml-auto size-6 shrink-0 rounded-full p-1 text-slate-600 transition-all duration-200 hover:bg-gray-200 hover:text-slate-900 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="overflow-hidden">
                      <div className="pb-4 pr-4">
                        <p className="cursor-default text-pretty text-sm leading-relaxed text-slate-600">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <div className="flex justify-center py-6 md:py-12">
              <BlackGoToAppButton className="h-12 w-full px-8 text-base">
                {definition.hero.ctaLabel}
              </BlackGoToAppButton>
            </div>
          </div>
        </main>

        <Footer
          translations={{
            footerDescription: (
              <>
                Create professional invoices in seconds with our free and
                open-source invoice maker. 100% in-browser, no sign-up required.
                <br />
                <br />
                Not accounting software. No compliance guarantees. By using this
                tool, you agree to the{" "}
                <Link
                  href="/tos"
                  className="text-slate-700 underline hover:text-slate-900"
                >
                  Terms of Service
                </Link>
                .
              </>
            ),
            footerCreatedBy: "Made by",
            resources: "Resources",
          }}
          links={
            <ul className="space-y-2">
              <li>
                <Link
                  href="/?template=default"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  App
                </Link>
              </li>
              <li>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="/en/about"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/changelog"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  Changelog
                </Link>
              </li>
            </ul>
          }
        />
      </div>
    </>
  );
}

function SeoSectionBlock({ section, id }: { section: SeoSection; id: number }) {
  const colors = [
    "bg-yellow-300 dark:bg-yellow-600 text-slate-900 dark:text-slate-900",
    "bg-purple-500 dark:bg-purple-500 text-white dark:text-white",
    "bg-green-500 dark:bg-green-500 text-white dark:text-white",
    "bg-blue-500 dark:bg-blue-500 text-white dark:text-white",
    "bg-orange-500 dark:bg-orange-500 text-white dark:text-white",
    "bg-teal-500 dark:bg-teal-500 text-white dark:text-white",
    "bg-red-500 dark:bg-red-500 text-white dark:text-white",
  ] as const;

  const color = colors[id % colors.length];

  return (
    <section className="border-b border-slate-100 py-6 last:border-b-0 md:py-8">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        <span className={`${color} px-0.5 font-bold`}>{section.title}</span>
      </h2>
      {section.lead ? (
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
          {section.lead}
        </p>
      ) : null}
      {section.paragraphs?.map((paragraph, index) => (
        <p
          key={`${section.title}-p-${index}`}
          className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600"
        >
          {paragraph}
        </p>
      ))}
      {section.bullets?.length ? (
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-6 text-lg text-slate-700">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function SeoComparisonTable({ table }: { table: ComparisonTable }) {
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
