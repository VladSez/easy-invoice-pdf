"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = React.memo(TooltipPrimitive.Provider);

// Add Provider wrapper for app-wide usage
function TooltipProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}

const Tooltip = React.memo(TooltipPrimitive.Root);

const TooltipTrigger = React.memo(TooltipPrimitive.Trigger);

const TooltipContent = React.memo(
  React.forwardRef<
    React.ElementRef<typeof TooltipPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
      showArrow?: boolean;
    }
  >(({ className, sideOffset = 4, showArrow = false, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "relative isolate z-[100] max-w-[280px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          className,
        )}
        {...props}
      >
        {props.children}
        {showArrow && (
          <TooltipPrimitive.Arrow className="my-px border-slate-200 fill-white drop-shadow-[0_1px_0_hsl(var(--border))]" />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )),
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface CustomTooltipProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  showArrow?: boolean;
}

const CustomTooltip = React.memo(
  ({
    trigger,
    content,
    className,
    side = "top",
    align = "center",
    delayDuration = 300,
    showArrow = false,
  }: CustomTooltipProps) => {
    // Memoize both trigger and content
    const memoizedTrigger = React.useMemo(() => trigger, [trigger]);
    const memoizedContent = React.useMemo(() => content, [content]);

    return (
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild>{memoizedTrigger}</TooltipTrigger>
        {memoizedContent ? (
          <TooltipContent
            side={side}
            align={align}
            className={cn("px-2 py-1 text-xs", className)}
            showArrow={showArrow}
          >
            {memoizedContent}
          </TooltipContent>
        ) : null}
      </Tooltip>
    );
  },
);
CustomTooltip.displayName = "CustomTooltip";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  CustomTooltip,
  TooltipProviderWrapper,
};
