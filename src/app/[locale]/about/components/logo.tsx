"use client";

import { FinalProjectLogo } from "@/components/etc/final-project-logo";
import { ProjectLogoDescription } from "@/components/project-logo-description";
import { useTranslations } from "next-intl";

export function Logo() {
  const t = useTranslations("About");

  return (
    <div>
      <div className="flex items-center gap-1.5 md:gap-2">
        <FinalProjectLogo className="size-6 md:size-7" />

        {/* show app logo and description on desktop */}
        <div className="hidden sm:block">
          <ProjectLogoDescription>{t("tagline")}</ProjectLogoDescription>
        </div>

        {/* show only app name on mobile (to save space) */}
        <div className="block sm:hidden">
          <p className="text-balance text-center text-xl font-bold text-zinc-800 sm:mt-0 sm:text-2xl lg:mr-5 lg:text-left">
            <a
              href="https://easyinvoicepdf.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              EasyInvoicePDF
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
