import { fetchGithubStars } from "@/actions/fetch-github-stars";
import { HeaderClient } from "@/app/(components)/header/header.client";
import type { Locale } from "next-intl";

export interface HeaderProps {
  locale: Locale;
  translations: {
    navLinks: {
      home: string;
      features: string;
      faq: string;
      github: string;
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

/**
 * Header server component that fetches GitHub stars and renders the header
 * @param props - Header props excluding githubStarsCount
 * @param props.locale - Current locale for language/region
 * @param props.translations - Translation object for current locale
 * @param props.hideLanguageSwitcher - Optional flag to hide language switcher
 * @returns Rendered header with GitHub stars count
 */
export async function Header(
  props: Omit<
    HeaderProps,
    "translations" | "locale" | "hideLanguageSwitcher"
  > & {
    translations?: HeaderProps["translations"];
    locale?: HeaderProps["locale"];
    hideLanguageSwitcher?: HeaderProps["hideLanguageSwitcher"];
  },
) {
  const githubStarsCount = await fetchGithubStars();

  return <HeaderClient {...props} githubStarsCount={githubStarsCount} />;
}
