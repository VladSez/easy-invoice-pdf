"use client";

import { BlackAnimatedGoToAppBtn } from "@/components/animated-go-to-app-btn";
import { GithubIcon } from "@/components/etc/github-logo";
import { GITHUB_URL } from "@/config";
import { cn } from "@/lib/utils";
import { type Locale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export interface HeaderProps {
  locale: Locale;
  translations: {
    navLinks: {
      features: string;
      faq: string;
      github: string;
      githubUrl: string;
    };
    switchLanguageText: string;
    goToAppText: string;
    startInvoicingButtonText: string;
    changelogLinkText: string;
    founderLinkText: string;
    termsOfServiceLinkText: string;
  };
  hideLanguageSwitcher?: boolean;
}

export function Header({
  locale,
  translations,
  hideLanguageSwitcher = false,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isChangelogActive = pathname === "/changelog";
  const isTosActive = pathname === "/tos";

  const desktopNavLinkClass =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-slate-100/90 hover:text-black";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="flex items-center justify-center">
        <div className="container h-16 px-4 md:px-6">
          <div className="flex h-full items-center justify-between gap-4">
            {/* Logo - hidden from header when sheet is open */}
            <div
              className={cn(open && "pointer-events-none invisible")}
              aria-hidden={open ? true : undefined}
              tabIndex={open ? -1 : undefined}
            >
              <Logo />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              {/* Desktop nav */}
              <nav className="hidden items-center justify-end gap-1 lg:flex">
                {/* a href this is only reliable way to scroll to a section on route navigation*/}
                <a
                  href={`/${locale}/about#features`}
                  className={cn(desktopNavLinkClass, "text-slate-600")}
                >
                  {translations.navLinks.features}
                </a>
                {/* a href this is only reliable way to scroll to a section on route navigation*/}
                <a
                  href={`/${locale}/about#faq`}
                  className={cn(desktopNavLinkClass, "text-slate-600")}
                >
                  {translations.navLinks.faq}
                </a>

                <Link
                  href="/changelog"
                  className={cn(
                    desktopNavLinkClass,
                    isChangelogActive
                      ? "bg-slate-100 text-black"
                      : "text-slate-600",
                  )}
                >
                  {translations.changelogLinkText}
                </Link>
                <Link
                  href="/tos"
                  className={cn(
                    desktopNavLinkClass,
                    isTosActive ? "bg-slate-100 text-black" : "text-slate-600",
                  )}
                >
                  {translations.termsOfServiceLinkText}
                </Link>
                <Link
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  aria-label="View on GitHub"
                >
                  <GithubIcon className="size-4" />
                  {translations.navLinks.github}
                </Link>
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

              {/* CTA button - hidden from header on mobile when sheet is open */}
              <div
                className={cn(
                  open &&
                    "pointer-events-none invisible lg:pointer-events-auto lg:visible",
                )}
                aria-hidden={open ? true : undefined}
              >
                <BlackAnimatedGoToAppBtn>
                  {translations.goToAppText}
                </BlackAnimatedGoToAppBtn>
              </div>

              {/* Burger menu -- mobile only; hidden when sheet is open (X is inside sheet) */}
              <div
                className={cn(
                  "relative lg:hidden",
                  open && "pointer-events-none invisible",
                )}
                aria-hidden={open ? true : undefined}
              >
                <MobileMenu
                  open={open}
                  onOpenChange={setOpen}
                  locale={locale}
                  translations={translations}
                  hideLanguageSwitcher={hideLanguageSwitcher}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
