"use client";

import { Check, Download, Link2 } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useState } from "react";

import { seoCtaClickEvent } from "@/app/(main)/(seo-landings)/components/seo-cta-click-event";
import { trackEvent } from "@/lib/analytics/track-event";
import { cn } from "@/lib/utils";

import type { SeoLandingSlug } from "../seo-landing-definitions";

/**
 * Holds which message the hero scene's toast shows, so the drawn buttons and the drawn
 * toast, which sit apart in the scene's markup, can share it. Everything between them
 * stays a server component.
 */
export function SceneToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState<ShownToast>({
    message: "made-here",
    pressCount: 0,
  });

  return (
    <SceneToastContext.Provider value={{ shown, setShown }}>
      {children}
    </SceneToastContext.Provider>
  );
}

/**
 * The drawn app's Get link and Download PDF buttons, made pressable.
 *
 * The invoice behind them is a drawing, so there is nothing to copy or download. A press
 * swaps the toast in the scene for one that says what the real app would do, and links
 * to it.
 */
export function SceneActionButtons() {
  const { setShown } = useSceneToast();

  function show(message: SceneToastMessage) {
    setShown((previous) => {
      return { message, pressCount: previous.pressCount + 1 };
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          show("link");
        }}
        className="hidden h-8 items-center gap-1.5 rounded-[7px] border border-gray-200 bg-white px-3 text-[13px] text-slate-900 transition-[background-color,transform] hover:bg-slate-50 active:scale-[0.97] sm:inline-flex"
      >
        <Link2 className="size-[13px]" aria-hidden="true" />
        Get link
      </button>
      <button
        type="button"
        onClick={() => {
          show("download");
        }}
        className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[7px] bg-slate-900 px-3.5 text-[13px] text-white transition-[background-color,transform] hover:bg-slate-800 active:scale-[0.97]"
      >
        <Download className="size-[13px]" aria-hidden="true" />
        Download PDF
      </button>
    </div>
  );
}

/**
 * The toast in the corner of the hero scene.
 *
 * Before any press it is part of the picture, and a phone, where it would cover the PDF,
 * leaves it out. After a press it is the answer to that press, so it shows on every
 * width, slides in again on each press and is announced to screen readers.
 */
export function SceneToast({ appHref, slug }: SceneToastProps) {
  const { shown } = useSceneToast();

  const hasBeenPressed = shown.pressCount > 0;

  const toast = SCENE_TOASTS[shown.message];

  const Icon = toast.icon;

  return (
    <div
      aria-live="polite"
      className={cn(
        "absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-7 md:right-7 md:w-[340px]",
        hasBeenPressed ? null : "hidden md:block",
      )}
    >
      <div
        // a new key per press remounts the card, which replays its entrance
        key={shown.pressCount}
        className={cn(
          "rounded-xl bg-white p-3.5 text-[13px] shadow-[inset_0_0_0_1px_rgba(0,0,0,.08),0_16px_36px_-14px_rgba(0,0,0,.25)]",
          hasBeenPressed
            ? "duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 motion-reduce:animate-none"
            : null,
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-[30px] flex-none items-center justify-center rounded-full bg-[#f1f1ef]">
            <Icon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{toast.title}</div>
            <div className="text-xs text-neutral-500">{toast.description}</div>
          </div>
          {hasBeenPressed ? (
            <Link
              href={appHref}
              onClick={() => {
                trackEvent(seoCtaClickEvent({ slug, position: "scene" }));
              }}
              className="flex-none rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
            >
              Open app
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface SceneToastProps {
  /** Where the card's "Open app" link goes. */
  appHref: string;
  /** The landing the scene is on, sent with the link's click event. */
  slug: SeoLandingSlug;
}

function useSceneToast() {
  const context = useContext(SceneToastContext);

  if (!context) {
    throw new Error("[useSceneToast] must be used inside <SceneToastProvider>");
  }

  return context;
}

const SCENE_TOASTS = {
  "made-here": {
    icon: Check,
    title: "Invoice 1/11-2026.pdf",
    description: "Made in this browser. Nothing uploaded.",
  },
  download: {
    icon: Download,
    title: "Your PDF is a click away",
    description: "This one is a demo. Open the app to make yours.",
  },
  link: {
    icon: Link2,
    title: "Share links live in the app",
    description: "Open it to get a link to your own invoice.",
  },
} as const satisfies Record<
  string,
  { icon: typeof Check; title: string; description: string }
>;

type SceneToastMessage = keyof typeof SCENE_TOASTS;

interface ShownToast {
  message: SceneToastMessage;
  /** How many times a button was pressed. Keys the card, so each press animates. */
  pressCount: number;
}

const SceneToastContext = createContext<{
  shown: ShownToast;
  setShown: React.Dispatch<React.SetStateAction<ShownToast>>;
} | null>(null);
