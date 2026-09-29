"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type * as React from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

// Add Provider wrapper for app-wide usage
function TooltipProviderWrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>;
}

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
  className,
  sideOffset = 4,
  showArrow = false,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content> & {
  showArrow?: boolean;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "relative isolate z-[100] max-w-[280px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50",
          className,
        )}
        {...props}
      >
        {props.children}
        {showArrow ? (
          <TooltipPrimitive.Arrow className="my-px border-slate-200 fill-white drop-shadow-[0_1px_0_hsl(var(--border))]" />
        ) : null}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

interface CustomTooltipProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  showArrow?: boolean;
  popoverOnMobile?: boolean;
}

const contentClassName = "max-w-[280px] px-2 py-1 text-xs";

function CustomTooltip({
  trigger,
  content,
  className,
  side = "top",
  align = "center",
  delayDuration = 300,
  showArrow = false,
  popoverOnMobile = false,
}: CustomTooltipProps) {
  const isDesktop = useIsDesktop();
  const usePopover = popoverOnMobile && !isDesktop;

  if (usePopover) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        {content ? (
          <PopoverContent
            side={side}
            align={align}
            className={cn(contentClassName, className)}
          >
            {content}
          </PopoverContent>
        ) : null}
      </Popover>
    );
  }

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      {content ? (
        <TooltipContent
          side={side}
          align={align}
          className={cn(contentClassName, className)}
          showArrow={showArrow}
        >
          {content}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  CustomTooltip,
  TooltipProviderWrapper,
};
