import { HeaderSkeleton } from "@/app/(components)/header/header-skeleton";
import { AboutFooter } from "@/app/[locale]/about/components/about-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading state for the about page.
 *
 * It mirrors `page.tsx` section by section: every wrapper keeps the real
 * section's padding, grid and frame, and only the parts that wait on data or
 * translations (headings, copy, buttons, demo videos) become skeletons. Each
 * skeleton reserves the exact line box or fixed size of what replaces it, so
 * the page does not move when the real content takes over.
 */
export default function AboutLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSkeleton />

      <main>
        <HeroSectionSkeleton />
        <FeaturesSectionSkeleton />

        {/* GitHub star CTA */}
        <div className="flex justify-center py-8 pb-10 lg:py-6 lg:pb-16">
          <Skeleton className="h-12 w-[235px] rounded-full" />
        </div>

        <FaqSectionSkeleton />
        <CtaSectionSkeleton />
      </main>

      {/* The footer is static, so the loading state renders the real one */}
      <AboutFooter />
    </div>
  );
}

function HeroSectionSkeleton() {
  return (
    <section className="flex w-full items-center justify-center overflow-hidden bg-gradient-to-b from-white to-slate-50 py-10 md:py-16 xl:py-24">
      {/* Background decorative elements */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        data-info="background-decorative-elements"
      >
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-indigo-50/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-emerald-50/40 blur-3xl" />
      </div>

      {/* Blur transition overlay between header and hero */}
      <div
        data-info="blur-transition-overlay"
        className="pointer-events-none absolute left-0 right-0 top-[25px] h-32 bg-gradient-to-b from-slate-100 to-slate-50 blur-2xl"
      />

      <div className="container relative z-10 px-4 md:px-6">
        <div className="grid gap-6 md:gap-8 lg:gap-12 xl:grid-cols-2 xl:gap-6">
          {/* Left column start (text and CTA buttons) */}
          <div className="flex flex-col justify-center space-y-5 md:space-y-6">
            <div className="space-y-3 md:space-y-4">
              {/* Title: two lines of `text-4xl sm:text-5xl md:text-6xl` */}
              <div>
                <TextLineSkeleton
                  className="h-10 justify-center sm:h-12 md:h-[60px] xl:justify-start"
                  barClassName="w-[88%] max-w-[540px]"
                />
                <TextLineSkeleton
                  className="h-10 justify-center sm:h-12 md:h-[60px] xl:justify-start"
                  barClassName="w-[62%] max-w-[400px]"
                />
              </div>

              {/* Description: five lines on mobile, three from `sm` up where the
                  container widens, and `text-lg` line boxes from `md` up */}
              <div className="flex justify-center xl:justify-start">
                <div className="w-full px-4 md:max-w-[500px] lg:px-0">
                  <TextLineSkeleton
                    className="h-6 justify-center md:h-7 xl:justify-start"
                    barClassName="w-full"
                  />
                  <TextLineSkeleton
                    className="h-6 justify-center md:h-7 xl:justify-start"
                    barClassName="w-[95%]"
                  />
                  <TextLineSkeleton
                    className="h-6 justify-center md:h-7 xl:justify-start"
                    barClassName="w-[90%] sm:w-[70%]"
                  />
                  <TextLineSkeleton
                    className="h-6 justify-center sm:hidden"
                    barClassName="w-[92%]"
                  />
                  {/* <TextLineSkeleton
                    className="h-6 justify-center sm:hidden"
                    barClassName="w-[55%]"
                  /> */}
                </div>
              </div>
            </div>

            {/* CTA Buttons (Go to app and GitHub). They only sit side by side
                from `lg` up; below that each one takes the full width. */}
            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row sm:flex-wrap xl:justify-start">
              <Skeleton className="h-[50px] w-full rounded-lg lg:w-[270px]" />
              <Skeleton className="h-[50px] w-full rounded-lg lg:w-[270px]" />
            </div>
          </div>
          {/* Left column end */}

          {/* Right column start (video) */}
          <div className="relative mx-auto w-full max-w-[950px] xl:mx-0">
            {/* Mac OS Frame around the video */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg md:rounded-2xl md:shadow-xl">
              <BrowserChromeBar />
              <div className="relative aspect-video w-full">
                <Skeleton className="size-full rounded-none" />
              </div>
            </div>
          </div>
          {/* Right column end */}
        </div>
      </div>
    </section>
  );
}

function FeaturesSectionSkeleton() {
  return (
    <section className="mt-6 flex w-full items-center justify-center bg-slate-50 py-4 lg:py-8 xl:mt-16 xl:py-16">
      <div className="container lg:max-w-[53rem] xl:max-w-[1280px] 2xl:max-w-[1536px]">
        {/* Features section title and description */}
        <div className="flex w-full flex-col items-center justify-center space-y-8 px-4 text-center md:px-6">
          <div className="w-full space-y-5">
            {/* Title: `text-3xl sm:text-4xl md:text-5xl`, one line from `xl` up */}
            <div>
              <TextLineSkeleton
                className="h-9 justify-center sm:h-10 md:h-12"
                barClassName="w-[85%] max-w-[900px]"
              />
              <TextLineSkeleton
                className="h-9 justify-center sm:h-10 md:h-12 xl:hidden"
                barClassName="w-[60%] max-w-[640px]"
              />
            </div>

            {/* Description: `text-base sm:text-lg md:text-xl` */}
            <div className="mx-auto max-w-[700px]">
              <TextLineSkeleton
                className="h-6 justify-center sm:h-7"
                barClassName="w-full"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:h-7"
                barClassName="w-[88%] sm:w-[70%]"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:hidden"
                barClassName="w-[55%]"
              />
            </div>
          </div>

          {/* "coming soon" badge. The two bars add up to the width of the real
              label, so they wrap onto a second line exactly where it does. */}
          <div className="inline-flex flex-wrap items-center justify-center gap-x-1 rounded-md border border-amber-200 bg-amber-100 px-3 py-1 shadow-sm">
            <Skeleton className="h-5 w-[220px] max-w-full bg-amber-200" />
            <Skeleton className="h-5 w-[110px] max-w-full bg-amber-200" />
          </div>
        </div>

        {/* Features cards: the carousel at rest, with the same track, gutters and
            card frame as `<FeaturesCarousel />`. Two slides is all that is ever
            visible, and the track clips whatever would follow them. */}
        <div className="pt-10 sm:px-4 lg:px-0">
          <div className="overflow-hidden p-2">
            <div className="-ml-6 -mr-2 flex items-stretch sm:-ml-4 sm:mr-0 lg:-ml-6 xl:-ml-10">
              {Array.from({ length: 2 }).map((_, index) => {
                return (
                  <div
                    key={index}
                    className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-[70%] md:basis-[55%] lg:basis-1/2 lg:pl-6 xl:pl-10"
                  >
                    <FeatureCardSkeleton />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls: previous/next arrows and one dot per feature */}
          <div className="flex items-center justify-center gap-2 pt-6 lg:gap-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 6 }).map((_, index) => {
                return (
                  <div key={index} className="p-1.5">
                    <Skeleton className="size-2 rounded-full" />
                  </div>
                );
              })}
            </div>
            <Skeleton className="size-10 shrink-0 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-start gap-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-200 sm:min-h-[465px] md:items-center md:rounded-2xl">
      {/* text content */}
      <div className="w-full max-w-[700px] flex-1 px-6 pb-4 pt-5 sm:px-8 sm:pb-4 sm:pt-6">
        {/* Title: `text-xl leading-tight sm:text-2xl`, one line except between
            `lg` and `xl`, where the cards are at their narrowest two-up */}
        <div className="pb-2 sm:pb-4">
          <TextLineSkeleton
            className="h-[25px] sm:h-8"
            barClassName="w-[70%]"
          />
          <TextLineSkeleton
            className="hidden h-8 lg:flex xl:hidden"
            barClassName="w-[40%]"
          />
        </div>

        {/* Description: `text-base leading-relaxed sm:text-lg sm:leading-7` */}
        <div>
          <TextLineSkeleton className="h-[26px] sm:h-7" barClassName="w-full" />
          <TextLineSkeleton
            className="h-[26px] sm:h-7"
            barClassName="w-[95%] xl:w-[65%]"
          />
          <TextLineSkeleton
            className="h-[26px] sm:h-7 xl:hidden"
            barClassName="w-[60%]"
          />
        </div>
      </div>

      {/* video container */}
      <div className="relative w-full max-w-[800px]">
        {/* Mac OS Frame around the video */}
        <div className="relative overflow-hidden rounded-xl border border-b-0 border-l-0 border-r-0 border-slate-200 bg-white md:rounded-2xl">
          <BrowserChromeBar />
          <div className="relative aspect-[16.6/8.9] h-full w-full lg:aspect-[16.99/9.1]">
            <Skeleton className="size-full rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Each FAQ question, as the two runs of text it breaks into.
 *
 * The runs add up to the width the real question renders at, so a question
 * drops onto a second line exactly where the real one does, and the list keeps
 * its height on narrow screens as well as wide ones.
 */
const FAQ_QUESTION_RUNS = [
  ["w-[114px]", "w-[67px]"],
  ["w-[139px]", "w-[82px]"],
  ["w-[286px]", "w-[134px]"],
  ["w-[256px]", "w-[120px]"],
  ["w-[169px]", "w-[101px]"],
  ["w-[174px]", "w-[104px]"],
  ["w-[149px]", "w-[88px]"],
  ["w-[126px]", "w-[74px]"],
  ["w-[136px]", "w-[80px]"],
] as const;

function FaqSectionSkeleton() {
  return (
    <section className="flex w-full items-center justify-center bg-white py-12 md:py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="w-full space-y-5">
            {/* Title: `text-3xl sm:text-4xl md:text-5xl`, one line from `sm` up */}
            <div>
              <TextLineSkeleton
                className="h-9 justify-center sm:h-10 md:h-12"
                barClassName="w-[80%] max-w-[420px]"
              />
              <TextLineSkeleton
                className="h-9 justify-center sm:hidden"
                barClassName="w-[50%]"
              />
            </div>

            {/* Description: `text-base sm:text-lg md:text-xl` */}
            <div className="mx-auto max-w-[700px]">
              <TextLineSkeleton
                className="h-6 justify-center sm:h-7"
                barClassName="w-full"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:h-7"
                barClassName="w-[92%] sm:w-[62%]"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:hidden"
                barClassName="w-[96%]"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:hidden"
                barClassName="w-[45%]"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          <div className="space-y-2">
            {FAQ_QUESTION_RUNS.map((runs, index) => {
              return (
                <div
                  key={index}
                  className="border-b border-dashed border-stone-300 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-2 py-3">
                    {/* Question: one `text-base` line box per run that fits */}
                    <div className="flex flex-wrap gap-x-1">
                      {runs.map((width) => {
                        return (
                          <div
                            key={width}
                            className={cn(
                              "flex h-6 max-w-full shrink-0 items-center",
                              width,
                            )}
                          >
                            <Skeleton className="h-3.5 w-full" />
                          </div>
                        );
                      })}
                    </div>
                    {/* The plus icon that expands the answer */}
                    <Skeleton className="size-5 shrink-0 rounded-md" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSectionSkeleton() {
  return (
    <section className="flex w-full items-center justify-center bg-slate-900 py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-7 text-center">
          <div className="flex w-full flex-col items-center justify-center space-y-2">
            {/* Title: `text-3xl md:text-5xl/tight`, one line from `md` up */}
            <div className="w-full">
              <TextLineSkeleton
                className="h-9 justify-center md:h-[60px]"
                barClassName="w-[80%] max-w-[620px] bg-slate-700"
              />
              <TextLineSkeleton
                className="h-9 justify-center sm:hidden"
                barClassName="w-[55%] bg-slate-700"
              />
            </div>

            {/* Description: `text-base md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed` */}
            <div className="w-full max-w-[600px]">
              <TextLineSkeleton
                className="h-6 justify-center md:h-[32.5px] lg:h-[26px] xl:h-[32.5px]"
                barClassName="w-full bg-slate-700"
              />
              <TextLineSkeleton
                className="h-6 justify-center sm:hidden md:flex md:h-[32.5px] lg:hidden lg:h-[26px] xl:flex xl:h-[32.5px]"
                barClassName="w-[72%] bg-slate-700"
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-6">
            <div className="flex w-full flex-col justify-center gap-2 md:flex-row">
              <Skeleton className="h-[50px] w-full rounded-lg bg-slate-700 lg:w-[300px]" />
              <Skeleton className="h-[50px] w-full rounded-lg bg-slate-700 lg:w-[300px]" />
            </div>
            {/* "No sign-up required" note: one line of `text-sm` */}
            <TextLineSkeleton
              className="h-5 justify-center"
              barClassName="w-[307px] max-w-full bg-slate-700"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * One line of placeholder text.
 *
 * `className` sizes the wrapper to the exact line box of the copy it stands in
 * for (`h-[60px]` for a line of `text-6xl`, and so on), so the real text drops
 * in without moving anything below it, while the bar inside stays shorter than
 * the line box, the way a run of text sits inside its own.
 */
function TextLineSkeleton({
  className,
  barClassName,
}: {
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("flex w-full items-center", className)}>
      <Skeleton className={cn("h-3/5 w-full", barClassName)} />
    </div>
  );
}

/** The Mac OS like browser chrome bar that sits on top of every demo video */
function BrowserChromeBar() {
  return (
    <div className="h-8 w-full rounded-t-xl bg-gradient-to-b from-[#F3F3F3] to-[#E9E9E9] px-4 shadow-sm md:h-12 md:rounded-t-2xl">
      <div className="flex h-full items-center">
        <div className="flex space-x-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57] md:h-3 md:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E] md:h-3 md:w-3" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840] md:h-3 md:w-3" />
        </div>
      </div>
    </div>
  );
}
