"use client";

import { BlackAnimatedGoToAppBtn } from "@/app/(components)/header/animated-go-to-app-btn";
import { GithubIcon } from "@/components/etc/github-logo";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenuPanel } from "./mobile-menu";
import { MorphingMenuIcon } from "./morphing-menu-icon";
import { StarIcon } from "lucide-react";
import type { HeaderProps } from "@/app/(components)/header";
import { githubStarCountFormatter } from "@/utils/number-formatter";

const desktopNavLinkClass =
  "rounded-md text-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 hover:text-black active:scale-[0.97] transition-all duration-300";

/**
 * Header client component that renders the main navigation bar
 * @param locale - Current locale for language/region
 * @param translations - Translation object for current locale
 * @param hideLanguageSwitcher - Optional flag to hide language switcher (defaults to false)
 * @param githubStarsCount - Number of GitHub stars to display
 */
export function HeaderClient({
  locale = "en",
  translations = defaultTranslations,
  hideLanguageSwitcher = true,
  githubStarsCount,
}: Omit<HeaderProps, "translations" | "locale" | "hideLanguageSwitcher"> & {
  locale?: HeaderProps["locale"];
  translations?: HeaderProps["translations"];
  hideLanguageSwitcher?: HeaderProps["hideLanguageSwitcher"];
  githubStarsCount: number;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const gitHubStarCountFormatted = githubStarCountFormatter
    .format(githubStarsCount)
    .toLowerCase();

  return (
    <header className="sticky top-4 z-50 w-full px-2 md:px-6">
      <div className="flex items-center justify-center">
        <div className="container h-16 rounded-3xl bg-gradient-to-r from-white/90 to-white/95 px-4 shadow-sm ring-1 ring-stone-200 backdrop-blur-md md:px-6">
          <div className="flex h-full items-center justify-between gap-4">
            {/* App logo  */}
            <Logo
              text={translations.navLinks.tagline}
              className="text-sm min-[375px]:text-base"
            />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              {/* Desktop nav */}
              <nav className="hidden items-center justify-end gap-1 lg:flex">
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    desktopNavLinkClass,
                    "group flex items-center gap-1.5 bg-stone-200/80 text-slate-800 hover:bg-stone-200/90",
                  )}
                  aria-label={translations.navLinks.github}
                  title="Star EasyInvoicePDF on GitHub - free & open-source invoice generator"
                >
                  <GithubIcon className="size-4 fill-slate-800 transition-all duration-300 group-hover:fill-current" />
                  {translations.navLinks.github}

                  {githubStarsCount > 0 ? (
                    <>
                      <div className="mx-0.5 h-4 w-[1px] bg-slate-300" />
                      <StarIcon className="size-4 fill-yellow-400 text-yellow-600 transition-all duration-300 group-hover:fill-yellow-300 group-hover:text-yellow-600/80" />
                      <span className="text-sm font-semibold tabular-nums text-slate-800">
                        {gitHubStarCountFormatted}
                      </span>
                    </>
                  ) : (
                    <StarIcon className="size-4 fill-yellow-400 text-yellow-600 transition-all duration-300 group-hover:fill-yellow-300 group-hover:text-yellow-600/80" />
                  )}
                </Link>
                {/* a href this is only reliable way to scroll to a section on route navigation*/}
                <a
                  href={`/${locale}/about`}
                  className={cn(desktopNavLinkClass)}
                >
                  {translations.navLinks.home}
                </a>

                {/*  eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/changelog" className={cn(desktopNavLinkClass)}>
                  {translations.changelogLinkText}
                </a>
                {/*  eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/tos" className={cn(desktopNavLinkClass)}>
                  {translations.termsOfServiceLinkText}
                </a>
              </nav>

              {/* Language switcher -- desktop only */}
              <div className="hidden min-w-[36px] lg:block">
                {!hideLanguageSwitcher && (
                  <LanguageSwitcher
                    locale={locale}
                    buttonText={translations.switchLanguageText}
                  />
                )}
              </div>

              {/* CTA button  */}
              <BlackAnimatedGoToAppBtn>
                {translations.goToAppText}
              </BlackAnimatedGoToAppBtn>

              {/* Mobile menu toggle: hamburger or X; panel opens below header */}
              <div className="relative lg:hidden">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-full shadow-none"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                  {...(!isMobileMenuOpen
                    ? { "aria-haspopup": "dialog" as const }
                    : {})}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <MorphingMenuIcon
                    isOpen={isMobileMenuOpen}
                    className="size-5"
                    aria-hidden
                  />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <MobileMenuPanel
          onOpenChange={setIsMobileMenuOpen}
          locale={locale}
          translations={translations}
          hideLanguageSwitcher={hideLanguageSwitcher}
          githubStarsCount={githubStarsCount}
        />
      ) : null}
    </header>
  );
}

const defaultTranslations = {
  navLinks: {
    home: "About Us",
    features: "Features",
    faq: "FAQ",
    github: "GitHub",
    githubCTA: "Star on GitHub",
    tagline: "Free & Open-Source Invoice Generator",
  },
  switchLanguageText: "Switch Language",
  goToAppText: "Open app",
  startInvoicingButtonText: "Start Invoicing",
  changelogLinkText: "Changelog",
  termsOfServiceLinkText: "Terms of Service",
} as const satisfies HeaderProps["translations"];
