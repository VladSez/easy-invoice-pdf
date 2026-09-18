"use client";

import { GlobeIcon } from "lucide-react";
import type { Locale } from "next-intl";
import { useTransition } from "react";

import {
  LANGUAGE_TO_NATIVE_LABEL,
  SUPPORTED_I18N_LOCALES,
  type SupportedLocale,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The locales this switcher offers, in the order the language pickers use.
 *
 * Narrowed to {@link SUPPORTED_I18N_LOCALES} rather than taken from
 * {@link LANGUAGE_TO_NATIVE_LABEL} wholesale: that map is keyed by invoice PDF language,
 * and the ones the site itself is not translated into (`pt-BR`) have no route to switch to.
 */
const LOCALE_OPTIONS = SUPPORTED_I18N_LOCALES.map((locale) => {
  return [locale, LANGUAGE_TO_NATIVE_LABEL[locale]] as const;
}) satisfies readonly (readonly [Locale, string])[];

interface LanguageSwitcherProps {
  locale: SupportedLocale;
  buttonText: string;
  onSelect?: () => void;
}

/**
 * Language switcher dropdown component that allows users to change the UI language.
 * Renders a globe icon button that opens a dropdown menu with available language options.
 * Handles locale switching via Next.js router with loading state during transition.
 *
 * @param locale - Current language locale
 * @param buttonText - Accessible label text for the language switcher button
 * @param onSelect - Optional callback fired when a language is selected
 */
export function LanguageSwitcher({
  locale,
  buttonText,
  onSelect,
}: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full shadow-none hover:bg-slate-100"
                aria-label={buttonText}
                disabled={isPending}
              >
                <GlobeIcon size={16} aria-hidden="true" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent key={locale}>
            <p>{buttonText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent loop>
        {LOCALE_OPTIONS.map(([itemLocale, label]) => {
          const isCurrentLocale = itemLocale === locale;

          return (
            <DropdownMenuItem
              key={itemLocale}
              onClick={() => {
                onSelect?.();
                startTransition(() => {
                  const pathnameWithoutLocale = pathname.replace(
                    `/${locale}`,
                    "",
                  );

                  router.push(pathnameWithoutLocale || "/", {
                    locale: itemLocale,
                  });
                });
              }}
              className={cn(isCurrentLocale && "bg-slate-200 font-medium")}
            >
              {label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
