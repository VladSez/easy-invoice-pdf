"use client";

import { GithubIcon } from "@/components/etc/github-logo";
import { BlackAnimatedGoToAppBtn } from "@/app/(components)/header/animated-go-to-app-btn";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRightIcon, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import type { HeaderProps } from ".";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  translations: HeaderProps["translations"];
  hideLanguageSwitcher?: boolean;
}

export function MobileMenu({
  open,
  onOpenChange,
  locale,
  translations,
  hideLanguageSwitcher,
}: MobileMenuProps) {
  const pathname = usePathname();

  const isChangelogActive = pathname === "/changelog";
  const isTosActive = pathname === "/tos";

  const mobileNavLinkClass =
    "flex items-center rounded-lg px-4 py-4 text-lg font-medium transition-colors hover:bg-slate-100/90 hover:text-black";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full shadow-none"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="top"
        animation="fade"
        className="bottom-0 top-0 flex flex-col border-b-0 bg-white px-0 py-0"
        showCloseButton={false}
      >
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Navigation menu with links to features, FAQ, changelog, terms of
          service, and language settings
        </SheetDescription>

        {/* Faux header row mirroring the page header */}
        <header className="w-full border-b bg-white shadow-sm">
          <div className="flex items-center justify-center">
            <div className="container h-16 px-4 md:px-6">
              <div className="flex h-full items-center justify-between gap-4">
                <Logo />
                <div className="flex items-center gap-1">
                  <BlackAnimatedGoToAppBtn>
                    {translations.goToAppText}
                  </BlackAnimatedGoToAppBtn>
                  <SheetClose asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="rounded-full shadow-none"
                      aria-label="Close menu"
                    >
                      <X size={20} />
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </div>
          </div>
        </header>

        <nav className="container flex flex-col gap-1 px-6 py-4 md:px-10">
          <SheetClose asChild>
            {/* this is only reliable way to scroll to a section on route navigation*/}
            <a
              href={`/${locale}/about#features`}
              className={cn(mobileNavLinkClass, "text-slate-700")}
            >
              {translations.navLinks.features}
            </a>
          </SheetClose>
          <SheetClose asChild>
            {/* this is only reliable way to scroll to a section on route navigation*/}
            <a
              href={`/${locale}/about#faq`}
              className={cn(mobileNavLinkClass, "text-slate-700")}
            >
              {translations.navLinks.faq}
            </a>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/changelog"
              className={cn(
                mobileNavLinkClass,
                isChangelogActive
                  ? "bg-slate-100 text-black"
                  : "text-slate-700",
              )}
            >
              {translations.changelogLinkText}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/tos"
              className={cn(
                mobileNavLinkClass,
                isTosActive ? "bg-slate-100 text-black" : "text-slate-700",
              )}
            >
              {translations.termsOfServiceLinkText}
            </a>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={translations.navLinks.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="View on GitHub"
            >
              <GithubIcon className="size-5" />
              {translations.navLinks.githubCTA}
            </Link>
          </SheetClose>

          {/* Start Invoicing CTA Button */}
          <div className="w-fit pt-4" onClick={() => onOpenChange(false)}>
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
              >
                <ArrowRightIcon className="mr-2 size-6 group-hover:scale-110" />

                {translations.startInvoicingButtonText}
              </Link>
            </Button>
          </div>
        </nav>

        {!hideLanguageSwitcher && (
          <div className="mt-auto border-t border-slate-200 px-6 pb-6 pt-5">
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm text-slate-700">
                {translations.switchLanguageText}
              </span>
              <LanguageSwitcher
                locale={locale}
                buttonText={translations.switchLanguageText}
                onSelect={() => onOpenChange(false)}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
