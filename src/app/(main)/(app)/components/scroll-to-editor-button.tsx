"use client";

import { ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Scrolls the window back to the top of the page, where the editor is. One of the few
 * client pieces of the copy below the editor.
 */
export function ScrollToEditorButton({
  label = "Start in the editor",
}: ScrollToEditorButtonProps) {
  return (
    <Button
      size="lg"
      className="h-11 gap-2 px-5 text-[15px]"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <ArrowUpIcon className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

interface ScrollToEditorButtonProps {
  /** The button's text. */
  label?: string;
}
