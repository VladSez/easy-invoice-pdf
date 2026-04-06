"use client";

import { GithubIcon } from "@/components/etc/github-logo";
import { BlackAnimatedGoToAppBtn } from "@/components/animated-go-to-app-btn";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Locale } from "next-intl";
import Link from "next/link";
import { ArrowRightIcon, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import type { HeaderProps } from "@/app/[locale]/about/components/header";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  translations: HeaderProps["translations"];
}

export function MobileMenu({
  open,
  onOpenChange,
  locale,
  translations,
}: MobileMenuProps) {
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
            <a
              href="#features"
              className="flex items-center rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {translations.navLinks.features}
            </a>
          </SheetClose>
          <SheetClose asChild>
            <a
              href="#faq"
              className="flex items-center rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {translations.navLinks.faq}
            </a>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href="/changelog"
              className="flex items-center rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {translations.changelogLinkText}
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              href={translations.navLinks.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-4 py-4 text-lg font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <GithubIcon className="size-5" />
              {translations.navLinks.github}
            </Link>
          </SheetClose>

          {/* Start Invoicing CTA Button */}
          <div className="pt-2" onClick={() => onOpenChange(false)}>
            <Button
              size="lg"
              variant="outline"
              className={
                "group relative overflow-hidden bg-zinc-900 px-3 text-white transition-all duration-300 hover:scale-[1.02] hover:bg-zinc-800 hover:text-white active:scale-[0.98] sm:px-8"
              }
              asChild
            >
              <Link
                href="/?template=default"
                scroll={false}
                className="flex items-center"
              >
                <ArrowRightIcon className="mr-2 size-5 group-hover:scale-110" />

                {translations.startInvoicingButtonText}
              </Link>
            </Button>
          </div>
        </nav>

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
      </SheetContent>
    </Sheet>
  );
}
