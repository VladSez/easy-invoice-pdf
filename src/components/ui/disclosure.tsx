"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type {
  DisclosureGroupProps as AccordionProps,
  ButtonProps,
  DisclosureProps as CollapsibleProps,
  DisclosurePanelProps as DisclosurePanelPrimitiveProps,
} from "react-aria-components";
import {
  DisclosureGroup as Accordion,
  Button,
  Disclosure as Collapsible,
  DisclosurePanel as CollapsiblePanel,
  composeRenderProps,
  Heading,
} from "react-aria-components";
import { twMerge } from "tailwind-merge";
import { CustomTooltip } from "./tooltip";

interface DisclosureGroupProps extends AccordionProps {
  ref?: React.RefObject<HTMLDivElement>;
}

/**
 * https://intentui.com/docs/2.x/components/navigation/disclosure-group
 */
const DisclosureGroup = React.forwardRef<HTMLDivElement, DisclosureGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Accordion
        ref={ref}
        data-slot="disclosure-group"
        {...props}
        className={composeTailwindRenderProps(
          className,
          "peer cursor-pointer disabled:cursor-not-allowed disabled:opacity-75",
        )}
      >
        {(values) => (
          <div data-slot="disclosure-content">
            {typeof children === "function" ? children(values) : children}
          </div>
        )}
      </Accordion>
    );
  },
);
DisclosureGroup.displayName = "DisclosureGroup";

/**
 * https://intentui.com/docs/2.x/components/navigation/disclosure-group
 */
const Disclosure = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Collapsible
        ref={ref}
        data-slot="disclosure"
        {...props}
        className={composeTailwindRenderProps(
          className,
          "w-full min-w-60 border-b disabled:opacity-60",
        )}
      >
        {children}
      </Collapsible>
    );
  },
);
Disclosure.displayName = "Disclosure";

/**
 * https://intentui.com/docs/2.x/components/navigation/disclosure-group
 */
const DisclosureTrigger = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Heading>
        <Button
          ref={ref}
          slot="trigger"
          className={composeTailwindRenderProps(
            className,
            "flex w-full items-center justify-between gap-x-2 py-3 text-left text-base font-medium disabled:cursor-default disabled:opacity-50 forced-colors:disabled:text-[GrayText] [&[aria-expanded=true]_[data-slot=disclosure-chevron]]:rotate-180",
          )}
          {...props}
        >
          {(values) => (
            <>
              {typeof children === "function" ? children(values) : children}
              <CustomTooltip
                trigger={
                  <ChevronDown
                    data-slot="disclosure-chevron"
                    className="ml-auto size-6 shrink-0 rounded-full p-1 transition-all duration-200 hover:bg-gray-200"
                  />
                }
                content="Expand/Collapse Section"
              />
            </>
          )}
        </Button>
      </Heading>
    );
  },
);
DisclosureTrigger.displayName = "DisclosureTrigger";

/**
 * https://intentui.com/docs/2.x/components/navigation/disclosure-group
 */
const DisclosurePanel = React.forwardRef<
  HTMLDivElement,
  DisclosurePanelPrimitiveProps
>(({ className, children, ...props }, ref) => {
  return (
    <CollapsiblePanel
      ref={ref}
      data-slot="disclosure-panel"
      className={composeTailwindRenderProps(
        className,
        "cursor-text overflow-hidden text-sm text-slate-600 transition-all duration-200 ease-in-out",
      )}
      {...props}
    >
      <div
        data-slot="disclosure-panel-content"
        className="pb-4 pl-0 pr-4 pt-2 [&:has([data-slot=disclosure-group])_&]:px-11"
      >
        {children}
      </div>
    </CollapsiblePanel>
  );
});
DisclosurePanel.displayName = "DisclosurePanel";

function composeTailwindRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind: string,
): string | ((v: T) => string) {
  return composeRenderProps(className, (className) =>
    twMerge(tailwind, className),
  );
}

export type {
  DisclosureGroupProps,
  CollapsibleProps as DisclosureProps,
  DisclosurePanelPrimitiveProps as DisclosurePanelProps,
  ButtonProps as DisclosureTriggerProps,
};
export { DisclosureGroup, Disclosure, DisclosurePanel, DisclosureTrigger };
