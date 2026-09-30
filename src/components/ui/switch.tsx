"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

interface SwitchProps extends React.ComponentProps<
  typeof SwitchPrimitives.Root
> {
  /** `sm` is the compact switch used next to form fields, `default` the larger one. */
  size?: "default" | "sm";
}

/**
 * https://originui.com/checks-radios-switches
 *
 * The track keeps its unchecked color, and the checked color is a `before:` layer that
 * fades in with `opacity`, instead of a `background-color` transition on the track.
 * The browser repaints a `background-color` transition on the main thread every frame,
 * and on the first toggle after load one stale repaint sometimes reached the screen
 * just after the animation ended (knob already off, track still the dark checked color).
 * An `opacity` fade runs on the compositor with no repaint, like the thumb's transform.
 */
function Switch({ className, size = "default", ...props }: SwitchProps) {
  return (
    <SwitchPrimitives.Root
      data-size={size}
      className={cn(
        "focus-visible:outline-ring/70 group/switch peer relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-200 outline-offset-2 before:absolute before:-inset-0.5 before:rounded-full before:bg-slate-900 before:opacity-0 before:transition-opacity before:duration-200 before:ease-out-strong focus-visible:outline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 data-[size=sm]:h-5 data-[size=sm]:w-8 data-[state=checked]:before:opacity-100 dark:bg-slate-800 dark:before:bg-slate-50",
        className,
      )}
      {...props}
    >
      {/* travel = thumb width minus the 2px border on each side, so it fits both sizes */}
      <SwitchPrimitives.Thumb className="pointer-events-none relative block size-5 rounded-full bg-white shadow-sm shadow-black/5 ring-0 transition-transform duration-200 ease-out-strong data-[state=checked]:translate-x-[calc(100%-4px)] data-[state=unchecked]:translate-x-0 group-data-[size=sm]/switch:size-4 dark:bg-slate-950 rtl:data-[state=checked]:-translate-x-[calc(100%-4px)]" />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
