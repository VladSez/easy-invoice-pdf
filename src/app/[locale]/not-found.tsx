import { hasLocale, useTranslations, type Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

export default function NotFound({ params }: { params?: { locale: Locale } }) {
  const t = useTranslations("NotFound");

  const locale = params?.locale;

  if (hasLocale(routing.locales, locale)) {
    // Enables static rendering to prevent an error: https://nextjs.org/docs/messages/dynamic-server-error
    setRequestLocale(locale);
  }

  return (
    <div className="flex h-screen w-full items-center justify-center font-sans">
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center">
          <h1 className="mr-5 border-r border-r-black/30 pr-6 text-2xl font-medium dark:border-r-white/30">
            {t("error")}
          </h1>
          <div>
            <h2 className="text-base font-normal">{t("message")}</h2>
            <Link
              href="/app"
              className="mt-4 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              {t("returnHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
