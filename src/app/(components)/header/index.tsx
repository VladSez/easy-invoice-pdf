"use client";

import { BlackAnimatedGoToAppBtn } from "@/app/(components)/header/animated-go-to-app-btn";
import { GithubIcon } from "@/components/etc/github-logo";
import { Button } from "@/components/ui/button";
import { GITHUB_URL } from "@/config";
import { cn } from "@/lib/utils";
import { type Locale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenuPanel } from "./mobile-menu";
import { MorphingMenuIcon } from "./morphing-menu-icon";

export interface HeaderProps {
  locale: Locale;
  translations: {
    navLinks: {
      home: string;
      features: string;
      faq: string;
      github: string;
      githubUrl: string;
      githubCTA: string;
      tagline: string;
    };
    switchLanguageText: string;
    goToAppText: string;
    startInvoicingButtonText: string;
    changelogLinkText: string;
    termsOfServiceLinkText: string;
  };
  hideLanguageSwitcher?: boolean;
}

const desktopNavLinkClass =
  "rounded-md text-slate-800 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 hover:text-black active:scale-[0.97] transition-all duration-300";

export function Header({
  locale,
  translations,
  hideLanguageSwitcher = false,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex items-center justify-center">
        <div className="container h-16 px-4 md:px-6">
          <div className="flex h-full items-center justify-between gap-4">
            {/* App logo  */}
            <Logo text={translations.navLinks.tagline} />

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
                    "flex items-center gap-1.5 text-slate-800",
                  )}
                  aria-label={translations.navLinks.github}
                >
                  <GithubIcon className="size-4" />
                  {translations.navLinks.github}
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
        />
      ) : null}
    </header>
  );
}
