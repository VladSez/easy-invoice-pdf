"use client";

import { subscribeAction } from "@/actions/subscribe-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Locale } from "next-intl";

function SubmitButton({
  translations,
}: {
  translations: {
    subscribe: string;
  };
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      _variant="default"
      _size="default"
      className={cn(
        "absolute right-2 top-1.5 transition-all duration-200",
        "hover:opacity-90 active:scale-95",
        pending && "cursor-not-allowed opacity-80"
      )}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <span className="flex items-center gap-2">
          {translations.subscribe}
        </span>
      )}
    </Button>
  );
}

export function SubscribeInput({
  translations,
  locale,
}: {
  translations: {
    title: string;
    description: string;
    subscribe: string;
    placeholder: string;
    success: string;
    error: string;
    emailLanguageInfo: string;
  };
  locale: Locale;
}) {
  const [isSubmitted, setSubmitted] = useState(false);

  return (
    <div className="w-full">
      <div className="relative">
        {isSubmitted ? (
          <div
            className={cn(
              "flex h-12 items-center justify-between",
              "rounded-lg border bg-emerald-50 px-4 py-2",
              "duration-300 animate-in fade-in-0 slide-in-from-top-1"
            )}
          >
            <p className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{translations.success}</span>
            </p>
          </div>
        ) : (
          <form
            data-testid="subscribe-form"
            action={async (formData) => {
              const result = await subscribeAction(formData, locale);

              if (result.error) {
                toast.error(result.error);
                return;
              }

              setSubmitted(true);

              // Show server-provided message if available, otherwise fallback to translation
              if (result.message) {
                toast.success(result.message);
              } else {
                toast.success(translations.success);
              }

              setTimeout(() => {
                setSubmitted(false);
              }, 3000);
            }}
            className="relative"
          >
            <div className="relative">
              <Mail className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                type="email"
                name="email"
                autoComplete="email"
                placeholder={translations.placeholder}
                aria-label={translations.placeholder}
                className={cn(
                  "h-12 pl-10 pr-32",
                  "placeholder:text-muted-foreground/60",
                  "transition-all duration-200",
                  "focus:ring-primary/20 focus:ring-2 focus:ring-offset-0",
                  "hover:border-primary/50"
                )}
                required
              />
            </div>
            <SubmitButton translations={translations} />
          </form>
        )}
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {translations.emailLanguageInfo}
      </p>
    </div>
  );
}
