"use client";

import { GithubIcon } from "@/components/etc/github-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import type { Locale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import type { HeaderProps } from ".";
import { LanguageSwitcher } from "./language-switcher";

interface MobileMenuSharedProps {
  locale: Locale;
  translations: HeaderProps["translations"];
  hideLanguageSwitcher?: boolean;
}

interface MobileMenuPanelProps extends MobileMenuSharedProps {
  onOpenChange: (open: boolean) => void;
}

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
}: MobileMenuPanelProps) {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();

  const isChangelogActive = pathname === "/changelog";
  const isTosActive = pathname === "/tos";

  const mobileNavLinkClass =
    "flex items-center rounded-lg px-4 py-4 text-lg font-medium transition-colors hover:bg-slate-100/90 hover:text-black";

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

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
        "fixed inset-x-0 top-16 z-[60] flex max-h-[calc(100dvh-4rem)] flex-col overflow-y-auto border-b bg-white shadow-lg",
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

      <nav className="container flex flex-col gap-1 px-6 py-4 md:px-10">
        <a
          href={`/${locale}/about#features`}
          className={cn(mobileNavLinkClass, "text-slate-700")}
          onClick={close}
        >
          {translations.navLinks.features}
        </a>
        <a
          href={`/${locale}/about#faq`}
          className={cn(mobileNavLinkClass, "text-slate-700")}
          onClick={close}
        >
          {translations.navLinks.faq}
        </a>
        <Link
          href="/changelog"
          className={cn(
            mobileNavLinkClass,
            isChangelogActive
              ? "bg-slate-200 text-black hover:bg-slate-200/80"
              : "text-slate-700",
          )}
          onClick={close}
        >
          {translations.changelogLinkText}
        </Link>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/tos"
          className={cn(
            mobileNavLinkClass,
            isTosActive
              ? "bg-slate-200 text-black hover:bg-slate-200/80"
              : "text-slate-700",
          )}
          onClick={close}
        >
          {translations.termsOfServiceLinkText}
        </a>
        <Link
          href={translations.navLinks.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label={translations.navLinks.githubCTA}
          onClick={close}
        >
          <GithubIcon className="size-5" />
          {translations.navLinks.githubCTA}
        </Link>

        <div className="w-fit pt-4">
          <Button
            size="lg"
            variant="outline"
            className={
              "group relative overflow-hidden bg-zinc-900 px-5 py-6 text-lg text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-800 hover:text-white active:scale-[0.98] sm:px-8"
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

      {!hideLanguageSwitcher ? (
        <div className="border-t border-slate-200 px-6 pb-6 pt-5">
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm text-slate-700">
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
