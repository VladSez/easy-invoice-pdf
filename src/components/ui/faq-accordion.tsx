import { PlusIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface FaqAccordionProps {
  children: React.ReactNode;
  className?: string;
}

function FaqAccordion({ children, className }: FaqAccordionProps) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

interface FaqAccordionItemProps {
  question: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function FaqAccordionItem({
  question,
  children,
  className,
}: FaqAccordionItemProps) {
  return (
    <details
      className={cn(
        "group cursor-pointer border-b border-dashed border-stone-300 transition-all duration-200 last:border-b-0",
        className,
      )}
    >
      <summary className="flex cursor-pointer select-none list-none appearance-none items-center justify-between gap-2 py-3 text-left [&::-webkit-details-marker]:hidden">
        <h3 className="text-base font-medium text-stone-900">{question}</h3>
        <PlusIcon
          className="size-5 shrink-0 text-stone-400 transition-all duration-200 will-change-transform group-open:rotate-45 group-hover:text-stone-900"
          aria-hidden="true"
        />
      </summary>
      <div className="overflow-hidden">
        <div className="pb-4 pr-4">
          <p className="cursor-default text-pretty text-sm leading-relaxed text-stone-600">
            {children}
          </p>
        </div>
      </div>
    </details>
  );
}

export { FaqAccordion, FaqAccordionItem };
