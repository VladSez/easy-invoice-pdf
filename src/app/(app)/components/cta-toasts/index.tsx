import { GiftIcon, XIcon } from "lucide-react";
import { toast as sonnerToast } from "sonner";

import { GithubIcon } from "@/components/etc/github-logo";
import { Button } from "@/components/ui/button";
import { DISCORD_FEEDBACK_URL, GITHUB_URL } from "@/config";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
}

const CTA_TOAST = {
  title: "Support Open Source",
  description:
    "Your contribution helps me maintain and improve this open-source project for everyone! 🚀",
} as const;

const SonnerCloseButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  return (
    <button
      className="absolute flex size-5 border border-gray-300 bg-white"
      aria-label="Close toast"
      type="button"
      data-disabled="false"
      data-close-button="true"
      {...props}
    >
      <XIcon className="size-3.5" />
    </button>
  );
};

function PremiumDonationToast(props: ToastProps) {
  const { title, description, id } = props;

  return (
    <div
      className="relative w-full rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-xl lg:max-w-sm"
      data-testid="download-pdf-toast"
    >
      {/* Close button - styled like default Sonner toast */}
      <SonnerCloseButton
        onClick={() => {
          return sonnerToast.dismiss(id);
        }}
      />

      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <GiftIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-gray-700">
          {description}
        </p>
        <div className="flex flex-wrap items-end justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            asChild
            className="h-8 w-[150px] flex-1 border-gray-300 text-xs transition-all duration-200"
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                umamiTrackEvent("gh_star_btn_click_download_pdf_toast_premium");

                sonnerToast.dismiss(id);
              }}
            >
              <GithubIcon className="mr-1.5 size-3.5 fill-white" />
              Star on GitHub
            </a>
          </Button>
          <Button
            size="sm"
            className="h-8 w-[150px] flex-1 border border-gray-300 bg-gray-100 text-xs text-gray-900 transition-all duration-200 hover:bg-gray-200"
            variant="secondary"
            asChild
            data-testid="toast-cta-btn"
          >
            <a
              href={DISCORD_FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                umamiTrackEvent(
                  "feedback_btn_click_download_pdf_toast_premium",
                );

                sonnerToast.dismiss(id);
              }}
            >
              Share Feedback
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shows the donation CTA toast. Triggered only after the user downloads a PDF.
 */
export const showCTAToast = () => {
  // dismiss any existing toasts
  sonnerToast.dismiss();

  return sonnerToast.custom(
    (id) => {
      return (
        <PremiumDonationToast
          id={id}
          title={CTA_TOAST.title}
          description={CTA_TOAST.description}
        />
      );
    },
    {
      duration: Infinity,
    },
  );
};

/**
 * Slight delay to prevent the toast from appearing too quickly
 */
export const CTA_TOAST_TIMEOUT = 2500; // in ms
