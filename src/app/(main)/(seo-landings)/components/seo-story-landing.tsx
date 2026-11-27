import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { Footer } from "@/app/(components)/footer";
import { Header } from "@/app/(components)/header";
import {
  BlackGoToAppButton,
  GoToAppButton,
} from "@/app/(components)/header/go-to-app-button-cta";
import { seoCtaClickEvent } from "@/app/(main)/(seo-landings)/components/seo-cta-click-event";
import { seoHeroCtaMarker } from "@/app/(main)/(seo-landings)/components/seo-cta-marker";
import {
  HeroAppScene,
  StoryStepArt,
} from "@/app/(main)/(seo-landings)/components/seo-story-art";
import { StickySeoCta } from "@/app/(main)/(seo-landings)/components/sticky-seo-cta";
import { GithubIcon } from "@/components/etc/github-logo";
import { RoughAnnotation } from "@/components/rough-annotation";
import { TrackClick } from "@/components/track-click";
import { Button } from "@/components/ui/button";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { GITHUB_URL } from "@/config";
import { githubStarCountFormatter } from "@/utils/number-formatter";

import type { SeoStoryLandingDefinition } from "../seo-landing-definitions";
import { SeoLandingJsonLd } from "./seo-landing-json-ld";

interface SeoStoryLandingProps {
  definition: SeoStoryLandingDefinition;
}

/**
 * A landing told as a short story instead of an article: a hero with a drawn scene of
 * the app, the few steps from an empty form to a PDF (each beside a drawing of the part
 * of the app it is about), the demo clip, related pages and an FAQ that is open from the
 * start.
 *
 * The drawings are HTML rather than screenshots, so they stay sharp at any width, can
 * leave out whatever the step isn't about, and cost nothing to load.
 */
export async function SeoStoryLanding({ definition }: SeoStoryLandingProps) {
  const { hero, story } = definition;

  const githubStars = await fetchGithubStars();

  // a failed fetch reports 0 stars, which is better left unsaid than printed
  const proofPoints =
    githubStars > 0
      ? [
          `${githubStarCountFormatter.format(githubStars).toLowerCase()} stars on GitHub`,
          ...story.proofPoints,
        ]
      : story.proofPoints;

  return (
    <>
      {/** Shown only while the hero CTA is off screen. */}
      <StickySeoCta
        href={hero.ctaHref}
        label={hero.ctaLabel}
        slug={definition.slug}
      />
      <SeoLandingJsonLd definition={definition} />

      <div className="flex min-h-screen flex-col bg-white text-neutral-900">
        <Header />
        <main className="flex flex-1 flex-col pb-16 md:pb-20">
          <section className={`${WRAP} pt-12 md:pt-20`}>
            <h1 className="max-w-[820px] text-balance text-[44px] font-extrabold leading-[1] tracking-[-0.04em] md:text-[72px] md:leading-[0.98]">
              <MarkedText
                text={hero.h1}
                mark={hero.h1Mark}
                delayMs={H1_MARK_DELAY_MS}
              />
            </h1>
            {/* the hero's opener is a paragraph, so the section titles stay the page's h2s */}
            <p className="mt-6 max-w-[540px] text-pretty text-lg leading-relaxed text-neutral-700 md:text-[19px]">
              {hero.subheading}
            </p>
            <div
              // room for the frame drawn around the first button
              className="mt-7 flex flex-col gap-6 sm:flex-row"
              {...seoHeroCtaMarker}
            >
              <TrackClick
                {...seoCtaClickEvent({
                  slug: definition.slug,
                  position: "hero",
                })}
              >
                <MarkedCta mark={hero.ctaMark}>
                  <BlackGoToAppButton
                    className="h-11 w-full rounded-[10px] px-5 text-[15px] sm:w-auto"
                    href={hero.ctaHref}
                  >
                    {hero.ctaLabel}
                  </BlackGoToAppButton>
                </MarkedCta>
              </TrackClick>
              <Button
                variant="outline"
                className="h-11 rounded-[10px] border-neutral-200 px-5 text-[15px] font-medium shadow-none"
                asChild
              >
                <a href={`#${STEPS_ID}`}>{story.secondaryCtaLabel}</a>
              </Button>
            </div>
          </section>

          <section className={`${WRAP} pt-10 md:pt-14`}>
            <HeroAppScene appHref={hero.ctaHref} slug={definition.slug} />
            <p className="mt-6 text-pretty text-center text-[13px] text-neutral-500">
              {proofPoints.join(" · ")}
            </p>
          </section>

          <section
            id={STEPS_ID}
            className={`${WRAP} scroll-mt-24 pt-20 md:pt-28`}
            aria-labelledby="seo-story-steps-heading"
          >
            <h2
              id="seo-story-steps-heading"
              className="max-w-[600px] text-balance text-[32px] font-bold leading-[1.08] tracking-[-0.03em] md:text-[44px] md:leading-[1.05]"
            >
              <MarkedText
                text={story.steps.heading}
                mark={story.steps.headingMark}
                delayMs={SECTION_MARK_DELAY_MS}
              />
            </h2>
            <p className="mt-4 max-w-[520px] text-pretty text-[17px] leading-relaxed text-neutral-700">
              {story.steps.lead}
            </p>

            <ol className="mt-10 flex flex-col gap-14 md:mt-14 md:gap-14">
              {story.steps.items.map((step) => {
                return (
                  <li
                    key={step.title}
                    className="grid grid-cols-[minmax(0,1fr)] items-center gap-6 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.6fr)] md:gap-12"
                    data-testid="seo-story-step"
                  >
                    <div>
                      <span className="rounded-[7px] border border-neutral-200 px-2.5 py-1 text-xs text-neutral-800">
                        {step.label}
                      </span>
                      <h3 className="mt-4 text-balance text-[26px] font-bold leading-[1.1] tracking-[-0.025em] md:text-[32px] md:leading-[1.08]">
                        {step.title}
                      </h3>
                      <p className="mt-3 text-pretty text-base leading-relaxed text-neutral-700">
                        {step.body}
                      </p>
                    </div>
                    <StoryStepArt art={step.art} />
                  </li>
                );
              })}
            </ol>

            {/* readers who have just seen the whole flow are the likeliest to try it, and
                the next CTA is otherwise past the video, the related pages and the FAQ.
                Dark, so it doesn't run into the grey video card right below it. */}
            <div className="mt-14 flex flex-col gap-6 rounded-3xl bg-neutral-950 px-6 py-8 text-white md:mt-20 md:flex-row md:items-center md:justify-between md:gap-8 md:px-11 md:py-11">
              <div>
                <h2 className="text-balance text-[30px] font-extrabold leading-[1.15] tracking-[-0.035em] md:text-[40px]">
                  <MarkedText
                    text={story.stepsCta.heading}
                    mark={story.stepsCta.headingMark}
                    delayMs={SECTION_MARK_DELAY_MS}
                  />
                </h2>
                <p className="mt-3 text-pretty text-base text-neutral-400 md:text-[17px]">
                  {story.stepsCta.lead}
                </p>
              </div>
              <div className="flex flex-none flex-col gap-2 sm:flex-row">
                <TrackClick
                  {...seoCtaClickEvent({
                    slug: definition.slug,
                    position: "inline",
                  })}
                >
                  <GoToAppButton
                    className="h-[46px] w-full rounded-[10px] border-transparent bg-white px-5 text-[15px] text-neutral-950 shadow-none hover:bg-neutral-200 hover:shadow-none sm:w-auto"
                    href={hero.ctaHref}
                  >
                    {hero.ctaLabel}
                  </GoToAppButton>
                </TrackClick>
                <Button
                  variant="outline"
                  className="h-[46px] rounded-[10px] border-neutral-700 bg-transparent px-5 text-[15px] font-medium text-white shadow-none hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon className="mr-1.5 size-5 fill-white" />
                    Star on GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section
            className={`${WRAP} pt-20 md:pt-28`}
            aria-labelledby="seo-story-video-heading"
          >
            <div className="rounded-3xl bg-[#eeeeec] p-3 md:p-6">
              <div className="flex flex-col gap-1 px-2 pb-4 pt-2 md:flex-row md:items-end md:justify-between md:gap-6 md:px-2 md:pb-6">
                <h2
                  id="seo-story-video-heading"
                  className="text-[32px] font-bold leading-none tracking-[-0.035em] md:text-[44px]"
                >
                  <MarkedText
                    text={story.video.heading}
                    mark={story.video.headingMark}
                    delayMs={SECTION_MARK_DELAY_MS}
                  />
                </h2>
                <p className="text-pretty text-base text-neutral-700">
                  {story.video.lead}
                </p>
              </div>
              <div className="aspect-video overflow-hidden rounded-2xl bg-neutral-200">
                <YouTubeEmbed
                  src={hero.heroVideo.embedUrl}
                  title={hero.heroVideo.title}
                  testId="seo-landing-hero-video"
                  lazy
                />
              </div>
            </div>
          </section>

          <section
            className={`${WRAP} pt-20 md:pt-28`}
            aria-labelledby="seo-landing-related-heading"
            data-testid="seo-landing-related"
          >
            <h2
              id="seo-landing-related-heading"
              className="text-[28px] font-bold leading-[1.08] tracking-[-0.03em] md:text-4xl"
            >
              <MarkedText
                text={story.related.heading}
                mark={story.related.headingMark}
                delayMs={SECTION_MARK_DELAY_MS}
              />
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {story.related.cards.map((card) => {
                return (
                  <li key={card.slug}>
                    <Link
                      href={`/${card.slug}`}
                      className="group flex h-full flex-col gap-1.5 rounded-2xl border border-neutral-200/80 p-[18px] transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                    >
                      <span className="flex items-center justify-between text-xs text-neutral-500">
                        {card.eyebrow}
                        {/* an icon, not the "↗" character, which each platform's
                            font draws differently and iOS can turn into an emoji */}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 flex-none transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          strokeWidth={1.75}
                        />
                      </span>
                      <span className="text-base font-semibold">
                        {card.title}
                      </span>
                      <span className="text-sm text-neutral-600">
                        {card.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            id="faq"
            className={`${WRAP} scroll-mt-24 pt-20 md:pt-28`}
            aria-labelledby="seo-landing-faq-heading"
          >
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] md:gap-12">
              <div>
                <h2
                  id="seo-landing-faq-heading"
                  className="text-balance text-[32px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[40px]"
                >
                  <MarkedText
                    text={story.faq.heading}
                    mark={story.faq.headingMark}
                    delayMs={SECTION_MARK_DELAY_MS}
                  />
                </h2>
                <p className="mt-3.5 text-pretty text-[17px] leading-relaxed text-neutral-700">
                  {story.faq.lead}
                </p>
              </div>
              {/* open from the start: these are short, and a closed list hides the answers
                  that the FAQPage markup already promises are on the page */}
              <div className="flex flex-col gap-2">
                {definition.faq.map((item) => {
                  return (
                    <div
                      key={item.question}
                      className="rounded-[14px] bg-stone-100 px-5 py-[18px]"
                    >
                      <h3 className="text-base font-semibold">
                        {item.question}
                      </h3>
                      <p className="mt-2 text-pretty text-[15px] leading-relaxed text-neutral-700">
                        {item.answer}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={`${WRAP} pt-20 md:pt-28`}>
            <div className="rounded-3xl bg-[#eeeeec] px-6 py-12 text-center md:px-10 md:py-16">
              <h2 className="mx-auto max-w-[620px] text-balance text-[36px] font-extrabold leading-none tracking-[-0.04em] md:text-[52px]">
                <MarkedText
                  text={story.closing.heading}
                  mark={story.closing.headingMark}
                  delayMs={SECTION_MARK_DELAY_MS}
                />
              </h2>
              <p className="mt-4 text-[17px] text-neutral-700">
                {story.closing.lead}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                <TrackClick
                  {...seoCtaClickEvent({
                    slug: definition.slug,
                    position: "bottom",
                  })}
                >
                  <BlackGoToAppButton
                    className="h-[46px] w-full rounded-[10px] px-5 text-[15px] sm:w-auto"
                    href={hero.ctaHref}
                  >
                    {hero.ctaLabel}
                  </BlackGoToAppButton>
                </TrackClick>
                <Button
                  variant="outline"
                  className="h-[46px] rounded-[10px] border-transparent bg-white px-5 text-[15px] font-medium shadow-none hover:bg-neutral-50"
                  asChild
                >
                  <Link
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GithubIcon className="mr-1.5 size-5" />
                    Star on GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

interface MarkedTextProps {
  /** The text to render, unchanged whether or not it carries a mark. */
  text: string;
  /** The phrase to mark. A phrase missing from `text` renders the plain text. */
  mark: SeoStoryLandingDefinition["hero"]["h1Mark"] | undefined;
  /** Wait after the text comes into view before drawing, to sequence the hero's marks. */
  delayMs: number;
}

/**
 * The text with a hand-drawn mark on one phrase. Only the phrase is wrapped, so the
 * text, and the heading's accessible name, read the same with or without the mark.
 */
function MarkedText({ text, mark, delayMs }: MarkedTextProps) {
  const start = mark ? text.indexOf(mark.phrase) : -1;

  if (!mark || start === -1) {
    return text;
  }

  const style = MARK_STYLES[mark.type];

  return (
    <>
      {text.slice(0, start)}
      <RoughAnnotation
        type={mark.type}
        color={mark.color}
        delayMs={delayMs}
        animationDuration={style.animationDuration}
        strokeWidth={style.strokeWidth}
        padding={style.padding}
      >
        {mark.phrase}
      </RoughAnnotation>
      {text.slice(start + mark.phrase.length)}
    </>
  );
}

interface MarkedCtaProps {
  children: React.ReactNode;
  /** The frame to draw around the button. Without one the button renders as it is. */
  mark: SeoStoryLandingDefinition["hero"]["ctaMark"];
}

/**
 * The hero's CTA button with a hand-drawn frame around it. The spans the frame is
 * measured from are blocks, so on a phone, where the button is full width, the frame
 * is too.
 */
function MarkedCta({ children, mark }: MarkedCtaProps) {
  if (!mark) {
    return children;
  }

  return (
    <RoughAnnotation
      type={mark.type}
      color={mark.color}
      delayMs={CTA_MARK_DELAY_MS}
      animationDuration={800}
      strokeWidth={2.5}
      padding={8}
      className="block sm:inline-block"
      innerClassName="block"
    >
      {children}
    </RoughAnnotation>
  );
}

/**
 * How each mark is drawn. Highlights and underlines keep a small padding because the
 * headings' lines sit close together, and a wider one would reach into the next line.
 */
const MARK_STYLES = {
  circle: { animationDuration: 900, strokeWidth: 2.5, padding: 10 },
  highlight: { animationDuration: 800, strokeWidth: undefined, padding: 2 },
  underline: { animationDuration: 800, strokeWidth: 3, padding: 2 },
} as const;

/** After the hero has painted, so the circle is seen being drawn rather than missed. */
const H1_MARK_DELAY_MS = 300;

/**
 * For the section headings, which draw as each one scrolls into view: a beat after it
 * arrives, so the mark is seen being drawn rather than already there.
 */
const SECTION_MARK_DELAY_MS = 200;

/** Once the circle is done, so the two marks read as one gesture after the other. */
const CTA_MARK_DELAY_MS =
  H1_MARK_DELAY_MS + MARK_STYLES.circle.animationDuration;

/** The steps' anchor, which the hero's second button scrolls to. */
const STEPS_ID = "how-it-works";

/** The page's content column. */
const WRAP = "mx-auto w-full max-w-[1120px] px-4 md:px-6";
