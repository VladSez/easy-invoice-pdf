"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/etc/error-message";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";

type Props = {
  error: Error;
  reset(): void;
};

export default function Error({ error, reset }: Props) {
  const t = useTranslations("Error");

  useEffect(() => {
    Sentry.captureException(error);

    toast.error(t("toastMessage"), {
      closeButton: true,
      richColors: true,
    });
  }, [error, t]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <ErrorMessage>
          {t("title")}. {t("description")}{" "}
          <a
            href="https://pdfinvoicegenerator.userjot.com/board/bugs"
            className="underline"
          >
            {t("bugReport")}
          </a>
        </ErrorMessage>
      </div>
      <Button onClick={reset} _variant="outline">
        {t("tryAgain")}
      </Button>
      <Button asChild>
        <Link href="/app">{t("goBack")}</Link>
      </Button>
    </div>
  );
}
