import { Button } from "@/components/ui/button";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import {
  GiftIcon,
  Heart,
  MessageSquare,
  Sparkles,
  Star,
  XIcon,
} from "lucide-react";

import { GithubIcon } from "@/components/etc/github-logo";
import { GITHUB_URL } from "@/config";
import { toast as sonnerToast } from "sonner";

const FEEDBACK_URL = "https://pdfinvoicegenerator.userjot.com/";

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
}

/**
 * Renders a premium donation toast
 */
export function customPremiumToast(toast: ToastProps) {
  // dismiss any existing toasts
  sonnerToast.dismiss();

  return sonnerToast.custom(
    (id) => (
      <PremiumDonationToast
        id={id}
        title={toast.title}
        description={toast.description}
      />
    ),
    {
      duration: Infinity,
    },
  );
}

/**
 * Renders a default donation toast
 */
export function customDefaultToast(toast: ToastProps) {
  // dismiss any existing toasts
  sonnerToast.dismiss();

  return sonnerToast.custom(
    (id) => (
      <DefaultDonationToast
        id={id}
        title={toast.title}
        description={toast.description}
      />
    ),
    {
      duration: Infinity,
    },
  );
}

const SonnerCloseButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) => {
  return (
    <button
      className="absolute flex h-5 w-5 border border-gray-300 bg-white"
      aria-label="Close toast"
      type="button"
      data-disabled="false"
      data-close-button="true"
      {...props}
    >
      <XIcon className="h-3.5 w-3.5" />
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
      <SonnerCloseButton onClick={() => sonnerToast.dismiss(id)} />

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
        <div className="flex items-end justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            asChild
            className="h-8 max-w-[150px] flex-1 border-gray-300 text-xs transition-all duration-200 hover:scale-105"
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
          <PremiumToastFeedbackButton
            onClick={() => {
              umamiTrackEvent("feedback_btn_click_download_pdf_toast_premium");

              sonnerToast.dismiss(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function PremiumToastFeedbackButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return (
    <Button
      size="sm"
      className="h-8 max-w-[150px] flex-1 border border-gray-300 bg-gray-100 text-xs text-gray-900 transition-all duration-200 hover:bg-gray-200"
      variant="secondary"
      asChild
      data-testid="toast-cta-btn"
    >
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <MessageSquare className="mr-1 h-3 w-3" />
        Share Feedback
      </a>
    </Button>
  );
}

function DefaultDonationToast(props: ToastProps) {
  const { title, description, id } = props;

  return (
    <div
      className="flex w-full items-start gap-3 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-xl lg:max-w-md"
      data-testid="download-pdf-toast"
    >
      {/* Close button - styled like default Sonner toast */}
      <SonnerCloseButton onClick={() => sonnerToast.dismiss(id)} />

      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
        <Heart className="h-5 w-5 fill-current text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <p className="text-sm font-semibold text-gray-900">{title}</p>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-gray-600">
          {description}
        </p>
        <div className="flex items-end justify-end gap-2">
          <Button
            size="sm"
            className="group h-8 max-w-[150px] bg-gray-900 px-3 text-xs font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-gray-800"
            asChild
          >
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                umamiTrackEvent("gh_star_btn_click_download_pdf_toast_default");

                sonnerToast.dismiss(id);
              }}
            >
              <Star className="mr-1 size-3.5 fill-yellow-300 text-yellow-300" />
              Star on GitHub
            </a>
          </Button>
          <DefaultToastFeedbackButton
            onClick={() => {
              umamiTrackEvent("feedback_btn_click_download_pdf_toast_default");

              sonnerToast.dismiss(id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DefaultToastFeedbackButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  return (
    <Button
      size="sm"
      className="h-8 max-w-[150px] flex-1 border border-gray-300 bg-gray-100 text-xs text-gray-900 transition-all duration-200 hover:bg-gray-200"
      variant="secondary"
      asChild
      data-testid="toast-cta-btn"
    >
      <a
        href={FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <MessageSquare className="mr-1 h-3 w-3" />
        Share Feedback
      </a>
    </Button>
  );
}

export const CTA_TOASTS = [
  {
    id: "premium-donation-toast-client-page",
    title: "Support Open Source",
    description:
      "Your contribution helps me maintain and improve this open-source project for everyone! 🚀",
    show: customPremiumToast,
  },
  {
    id: "default-donation-toast-client-page",
    title: "Love this open-source project?",
    description:
      "Help me keep this free tool running! Your support enables me to add new features and maintain the service. 🙏",
    show: customDefaultToast,
  },
] as const satisfies {
  id: string;
  title: string;
  description: string;
  show: (toast: ToastProps) => void;
}[];

export const showRandomCTAToast = () => {
  const variant = CTA_TOASTS[Math.floor(Math.random() * CTA_TOASTS.length)];

  variant.show({
    id: variant.id,
    title: variant.title,
    description: variant.description,
  });
};

/**
 * Slight delay to prevent the toast from appearing too quickly
 */
export const CTA_TOAST_TIMEOUT = 2_500; // in ms
