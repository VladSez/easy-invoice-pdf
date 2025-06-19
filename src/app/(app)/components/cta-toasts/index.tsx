import { Button } from "@/components/ui/button";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import {
  Coffee,
  GiftIcon,
  Heart,
  HeartIcon,
  MessageSquare,
  Sparkles,
  Star,
  XIcon,
} from "lucide-react";

import { GithubIcon } from "@/components/etc/github-logo";
import { DONATION_URL } from "@/config";
import { toast as sonnerToast } from "sonner";

const FEEDBACK_URL = "https://pdfinvoicegenerator.userjot.com/";

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
  showDonationButton?: boolean;
}

/**
 * Randomly determines whether to show donation or feedback button
 */
function randomlyShowDonationButton() {
  return Math.random() < 0.5;
}

/**
 * Renders a premium donation toast
 */
export function customPremiumToast(toast: Omit<ToastProps, "id">) {
  // dismiss any existing toasts
  sonnerToast.dismiss();

  return sonnerToast.custom(
    (id) => (
      <PremiumDonationToast
        id={id}
        title={toast.title}
        description={toast.description}
        showDonationButton={toast.showDonationButton}
      />
    ),
    {
      duration: Infinity,
    }
  );
}

/**
 * Renders a default donation toast
 */
export function customDefaultToast(toast: Omit<ToastProps, "id">) {
  // dismiss any existing toasts
  sonnerToast.dismiss();

  return sonnerToast.custom(
    (id) => (
      <DefaultDonationToast
        id={id}
        title={toast.title}
        description={toast.description}
        showDonationButton={toast.showDonationButton}
      />
    ),
    {
      duration: Infinity,
    }
  );
}

const SonnerCloseButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
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
  const { title, description, id, showDonationButton = true } = props;
  const showDonationBtnRandomly = randomlyShowDonationButton();

  return (
    <div
      className="relative max-w-sm rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-xl"
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
        <div className="flex gap-2">
          <Button
            _size="sm"
            _variant="outline"
            asChild
            className="h-8 flex-1 border-gray-300 text-xs transition-all duration-200 hover:bg-gray-50"
          >
            <a
              href="https://github.com/VladSez/easy-invoice-pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                umamiTrackEvent("gh_star_btn_click_download_pdf_toast_premium");

                sonnerToast.dismiss(id);
              }}
            >
              <GithubIcon className="mr-1 h-3 w-3" />
              Star on GitHub
            </a>
          </Button>
          {showDonationButton ? (
            showDonationBtnRandomly ? (
              <PremiumToastDonationButton
                onClick={() => {
                  umamiTrackEvent(
                    "donate_btn_click_download_pdf_toast_premium"
                  );

                  sonnerToast.dismiss(id);
                }}
              />
            ) : (
              <PremiumToastFeedbackButton
                onClick={() => {
                  umamiTrackEvent(
                    "feedback_btn_click_download_pdf_toast_premium"
                  );

                  sonnerToast.dismiss(id);
                }}
              />
            )
          ) : (
            <PremiumToastFeedbackButton
              onClick={() => {
                umamiTrackEvent(
                  "feedback_btn_click_download_pdf_toast_premium"
                );

                sonnerToast.dismiss(id);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PremiumToastFeedbackButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <Button
      _size="sm"
      className="h-8 flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-xs text-white transition-all duration-200 hover:from-green-600 hover:to-blue-700 hover:shadow-lg"
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

function PremiumToastDonationButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <Button
      _size="sm"
      className="h-8 flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-xs text-white transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg"
      asChild
      data-testid="toast-cta-btn"
    >
      <a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <HeartIcon className="mr-1 h-3 w-3 fill-current" />
        Donate $5
      </a>
    </Button>
  );
}

function DefaultDonationToast(props: ToastProps) {
  const { title, description, id, showDonationButton = true } = props;

  // Randomly determine whether to show donation or feedback button
  const showDonationBtnRandomly = randomlyShowDonationButton();

  return (
    <div
      className="flex max-w-md items-start gap-3 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 shadow-xl"
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
        <div className="flex gap-2">
          <Button
            _size="sm"
            className="h-7 bg-gray-900 px-3 text-xs font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-gray-800"
            asChild
          >
            <a
              href="https://github.com/VladSez/easy-invoice-pdf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                umamiTrackEvent("gh_star_btn_click_download_pdf_toast_default");

                sonnerToast.dismiss(id);
              }}
            >
              <Star className="mr-1 h-3 w-3" />
              Star on GitHub
            </a>
          </Button>
          {showDonationButton ? (
            showDonationBtnRandomly ? (
              <DefaultToastDonationButton
                onClick={() => {
                  umamiTrackEvent(
                    "donate_btn_click_download_pdf_toast_default"
                  );

                  sonnerToast.dismiss(id);
                }}
              />
            ) : (
              <DefaultToastFeedbackButton
                onClick={() => {
                  umamiTrackEvent(
                    "feedback_btn_click_download_pdf_toast_default"
                  );

                  sonnerToast.dismiss(id);
                }}
              />
            )
          ) : (
            <DefaultToastFeedbackButton
              onClick={() => {
                umamiTrackEvent(
                  "feedback_btn_click_download_pdf_toast_default"
                );

                sonnerToast.dismiss(id);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DefaultToastDonationButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <Button
      _size="sm"
      className="h-7 bg-gradient-to-r from-pink-500 to-purple-600 px-3 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-pink-600 hover:to-purple-700"
      asChild
      data-testid="toast-cta-btn"
    >
      <a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        <Coffee className="mr-1 h-3 w-3" />
        Donate $5
      </a>
    </Button>
  );
}

function DefaultToastFeedbackButton(
  props: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
  return (
    <Button
      _size="sm"
      className="h-7 bg-gradient-to-r from-green-500 to-blue-600 px-3 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-green-600 hover:to-blue-700"
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
