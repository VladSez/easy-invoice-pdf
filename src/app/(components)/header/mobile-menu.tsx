"use client";

import { GithubIcon } from "@/components/etc/github-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, StarIcon } from "lucide-react";
import type { Locale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { GITHUB_URL } from "@/config";
import type { HeaderProps } from "@/app/(components)/header";
import { githubStarCountFormatter } from "@/utils/number-formatter";

interface MobileMenuSharedProps {
  locale: Locale;
  translations: HeaderProps["translations"];
  hideLanguageSwitcher?: boolean;
  githubStarsCount: number;
}

interface MobileMenuPanelProps extends MobileMenuSharedProps {
  onOpenChange: (open: boolean) => void;
}

const mobileNavLinkClass =
  "flex items-center rounded-lg px-4 py-4 text-lg font-medium hover:bg-slate-100/90 hover:text-black active:scale-[0.98] transition-all duration-300 md:px-5";

const activeMobileNavLinkClass =
  "bg-slate-200/70 text-black hover:bg-slate-200/80";

/**
 * Mobile menu panel component that renders navigation links, language switcher,
 * and other menu items in a dialog overlay on mobile viewports.
 *
 * @param onOpenChange - Callback to update mobile menu open state
 * @param locale - Current language locale
 * @param translations - Header translations object
 * @param hideLanguageSwitcher - Whether to hide the language switcher
 */
export function MobileMenuPanel({
  onOpenChange,
  locale,
  translations,
  hideLanguageSwitcher,
  githubStarsCount = 0,
}: MobileMenuPanelProps) {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();

  const gitHubStarCountFormatted = githubStarCountFormatter
    .format(githubStarsCount)
    .toLowerCase();

  const isChangelogActive = pathname === "/changelog";
  const isTosActive = pathname === "/tos";
  const isHomeActive = pathname === `/${locale}/about`;

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  // close mobile menu when escape key is pressed
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChangeRef.current(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => onOpenChange(false);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={cn(
        "fixed inset-x-0 top-[86px] z-[60] mx-2 flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto rounded-3xl bg-white shadow-lg ring-1 ring-stone-200 md:mx-6",
        "duration-200 animate-in fade-in slide-in-from-top-2",
      )}
    >
      <h2 id={titleId} className="sr-only">
        Mobile Menu
      </h2>
      <p id={descriptionId} className="sr-only">
        Mobile navigation menu with links to features, FAQ, changelog, terms of
        service, invoice pdf generator app, and language settings
      </p>

      <div className="flex w-full flex-col justify-center gap-1 px-6 py-4 sm:px-8 sm:py-5 md:gap-3 md:px-12 md:py-8">
        <nav className="container space-y-1.5">
          <a
            href={`/${locale}/about`}
            className={cn(
              mobileNavLinkClass,
              isHomeActive ? activeMobileNavLinkClass : "text-slate-700",
            )}
            onClick={close}
          >
            {translations.navLinks.home}
          </a>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/changelog"
            className={cn(
              mobileNavLinkClass,
              isChangelogActive ? activeMobileNavLinkClass : "text-slate-700",
            )}
            onClick={close}
          >
            {translations.changelogLinkText}
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/tos"
            className={cn(
              mobileNavLinkClass,
              isTosActive ? activeMobileNavLinkClass : "text-slate-700",
            )}
            onClick={close}
          >
            {translations.termsOfServiceLinkText}
          </a>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              mobileNavLinkClass,
              "group flex items-center gap-1.5 text-slate-800",
            )}
            aria-label={translations.navLinks.githubCTA}
          >
            <GithubIcon className="size-5 transition-all duration-300 group-hover:fill-current" />
            {translations.navLinks.githubCTA}

            {githubStarsCount > 0 ? (
              <>
                <div className="mx-0.5 h-4 w-[1px] bg-slate-300" />
                <StarIcon className="size-5 fill-yellow-400 text-yellow-600 transition-all duration-300 group-hover:fill-yellow-300 group-hover:text-yellow-500" />
                <span className="text-sm font-semibold tabular-nums text-slate-800">
                  {gitHubStarCountFormatted}
                </span>
              </>
            ) : (
              <StarIcon className="size-5 fill-yellow-400 text-yellow-600 transition-all duration-300 group-hover:fill-yellow-300 group-hover:text-yellow-500" />
            )}
          </a>

          <div className="w-full pb-2 pt-4">
            <Button
              size="lg"
              variant="outline"
              className={
                "group relative w-full overflow-hidden bg-zinc-900 px-5 py-6 text-lg text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-800 hover:text-white active:scale-[0.98] sm:px-8"
              }
              asChild
            >
              <Link
                href="/?template=default"
                scroll={false}
                className="flex items-center"
                onClick={close}
              >
                <ArrowRightIcon className="mr-2 size-6 group-hover:scale-110" />

                {translations.startInvoicingButtonText}
              </Link>
            </Button>
          </div>
        </nav>
      </div>

      {!hideLanguageSwitcher ? (
        <div className="border-t border-slate-200 px-6 pb-6 pt-5 sm:px-8 md:px-12 md:pb-8 md:pt-6">
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm text-slate-800">
              {translations.switchLanguageText}
            </span>
            <LanguageSwitcher
              locale={locale}
              buttonText={translations.switchLanguageText}
              onSelect={close}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
