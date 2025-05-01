"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/etc/error-message";
import { toast } from "sonner";
// import { Link } from "@/i18n/navigation";
import Link from "next/link";

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
          Something went wrong. Please try to refresh the page or fill a bug
          report{" "}
          <a
            href="https://pdfinvoicegenerator.userjot.com/board/bugs"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
        </ErrorMessage>
      </div>
      <Button onClick={reset} _variant="outline">
        Try again
      </Button>
      <Button asChild>
        <Link href="/">Return to homepage</Link>
      </Button>
    </div>
  );
}
