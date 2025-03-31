"use client";

import { SelectNative } from "@/components/ui/select-native";
import { GlobeIcon } from "lucide-react";
import { useTransition } from "react";
import { type Locale } from "next-intl";
import { type ChangeEvent } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const MAP_LOCALE_TO_LABEL = {
  en: "English",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
} as const satisfies Record<Locale, string>;

interface LanguageSwitcherProps {
  locale: string;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as Locale;

    startTransition(() => {
      // Get the base pathname without locale prefix
      const pathnameWithoutLocale = pathname.replace(`/${locale}`, "");

      // Navigate to the same route with the new locale
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
        {Object.entries(MAP_LOCALE_TO_LABEL).map(([locale, label]) => {
          return (
            <option key={locale} value={locale}>
              {label}
            </option>
          );
        })}
      </SelectNative>
    </div>
  );
}
