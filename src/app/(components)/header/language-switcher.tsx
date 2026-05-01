"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { GlobeIcon } from "lucide-react";
import type { Locale } from "next-intl";
import { useTransition } from "react";
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
import { cn } from "@/lib/utils";

const MAP_LOCALE_TO_LANGUAGE = {
  en: "English",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
} as const satisfies Record<Locale, string>;

type SupportedLocale = keyof typeof MAP_LOCALE_TO_LANGUAGE;
type LanguageLabel = (typeof MAP_LOCALE_TO_LANGUAGE)[SupportedLocale];

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
                className="rounded-full shadow-none hover:bg-slate-200/80"
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
        {(
          Object.entries(MAP_LOCALE_TO_LANGUAGE) as Array<
            [SupportedLocale, LanguageLabel]
          >
        ).map(([itemLocale, label]) => {
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
