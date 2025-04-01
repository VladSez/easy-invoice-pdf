"use client";

import { SelectNative } from "@/components/ui/select-native";
import { GlobeIcon } from "lucide-react";
import { useTransition } from "react";
import { type ChangeEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Locale } from "next-intl";

const MAP_LOCALE_TO_LABEL = {
  en: "English",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
} as const satisfies Record<Locale, string>;

type SupportedLocale = keyof typeof MAP_LOCALE_TO_LABEL;
type LanguageLabel = (typeof MAP_LOCALE_TO_LABEL)[SupportedLocale];

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
    <div
      className={cn(
        "flex items-center gap-1",
        isPending && "transition-opacity [&:disabled]:opacity-30"
      )}
    >
      <GlobeIcon className="h-4 w-4" />
      <SelectNative
        value={locale}
        onChange={handleChange}
        className="block w-full"
        disabled={isPending}
      >
        {(
          Object.entries(MAP_LOCALE_TO_LABEL) as Array<
            [SupportedLocale, LanguageLabel]
          >
        ).map(([locale, label]) => (
          <option key={locale} value={locale}>
            {label}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}
