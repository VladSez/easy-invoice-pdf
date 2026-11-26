"use client";

import { Download, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface SceneActionButtonsProps {
  /** Where "Open app" in the toast goes. The landing's own `hero.ctaHref`. */
  appHref: string;
  /** `md` for the step drawing, where the buttons are a little larger. */
  size?: "sm" | "md";
  /** The download button's label, e.g. "Download PDF in English". */
  downloadLabel?: string;
  className?: string;
}

/**
 * The drawn app's Get link and Download PDF buttons, made pressable.
 *
 * The invoice behind them is a drawing, so there is nothing to copy or download. A press
 * says so in a toast and offers the real app instead, which turns a reader who tried the
 * picture into one click from the generator.
 */
export function SceneActionButtons({
  appHref,
  size = "sm",
  downloadLabel = "Download PDF",
  className,
}: SceneActionButtonsProps) {
  const router = useRouter();

  const openAppAction = {
    label: "Open app",
    onClick: () => {
      router.push(appHref);
    },
  };

  const isMedium = size === "md";

  return (
    <div className={cn("flex gap-2", className)}>
      <button
        type="button"
        onClick={() => {
          toast.info("This invoice is only a preview", {
            id: SCENE_TOAST_ID,
            description:
              "Open the app and press Get link to share your own invoice.",
            action: openAppAction,
          });
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[7px] border border-gray-200 bg-white text-slate-900 transition-colors hover:bg-slate-50 active:scale-[0.97]",
          isMedium
            ? "h-[38px] rounded-lg px-3.5 text-sm"
            : "hidden h-8 px-3 text-[13px] sm:inline-flex",
        )}
      >
        <Link2
          className={isMedium ? "size-3.5" : "size-[13px]"}
          aria-hidden="true"
        />
        Get link
      </button>
      <button
        type="button"
        onClick={() => {
          toast.info("This invoice is only a preview", {
            id: SCENE_TOAST_ID,
            description:
              "Open the app to fill in and download your own PDF. No sign up.",
            action: openAppAction,
          });
        }}
        className={cn(
          "inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap bg-slate-900 text-white transition-colors hover:bg-slate-800 active:scale-[0.97]",
          isMedium
            ? "h-[38px] flex-1 rounded-lg px-3.5 text-sm"
            : "h-8 rounded-[7px] px-3.5 text-[13px]",
        )}
      >
        <Download
          className={cn("flex-none", isMedium ? "size-3.5" : "size-[13px]")}
          aria-hidden="true"
        />
        <span className="truncate">{downloadLabel}</span>
      </button>
    </div>
  );
}

/** One id for both buttons, so pressing them in turn swaps the toast rather than stacking. */
const SCENE_TOAST_ID = "seo-story-scene-action";
