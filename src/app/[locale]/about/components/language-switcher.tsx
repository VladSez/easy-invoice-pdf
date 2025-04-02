"use client";

import { SelectNative } from "@/components/ui/select-native";
import { GlobeIcon } from "lucide-react";
import { useTransition } from "react";
import { type ChangeEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "next-intl";
import { Label } from "@/components/ui/label";

const MAP_LOCALE_TO_LANGUAGE = {
  en: "English",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  ru: "Русский",
  uk: "Українська",
} as const satisfies Record<Locale, string>;

type SupportedLocale = keyof typeof MAP_LOCALE_TO_LANGUAGE;
type LanguageLabel = (typeof MAP_LOCALE_TO_LANGUAGE)[SupportedLocale];

interface LanguageSwitcherProps {
  locale: SupportedLocale;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as SupportedLocale;

    startTransition(() => {
      const pathnameWithoutLocale = pathname.replace(`/${locale}`, "");
      router.replace(pathnameWithoutLocale || "/", { locale: nextLocale });
    });
  };

  return (
    <div className="flex flex-col">
      <Label htmlFor="language-select" className="sr-only">
        Select language
      </Label>
      <div
        className={cn(
          "flex items-center gap-1",
          isPending && "transition-opacity [&:disabled]:opacity-30"
        )}
      >
        <GlobeIcon className="h-4 w-4" />
        <SelectNative
          id="language-select"
          value={locale}
          onChange={handleChange}
          className="block w-full"
          disabled={isPending}
        >
          {(
            Object.entries(MAP_LOCALE_TO_LANGUAGE) as Array<
              [SupportedLocale, LanguageLabel]
            >
          ).map(([locale, label]) => (
            <option key={locale} value={locale}>
              {label}
            </option>
          ))}
        </SelectNative>
      </div>
    </div>
  );
}
