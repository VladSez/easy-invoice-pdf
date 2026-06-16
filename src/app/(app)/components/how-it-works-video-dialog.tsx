"use client";

import { HowItWorksVideos } from "@/app/(app)/components/how-it-works-videos";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HOW_IT_WORKS_VIDEOS } from "@/config";
import { useEffect, useState } from "react";

interface HowItWorksVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VIDEO_ID = HOW_IT_WORKS_VIDEOS[0].id;

/**
 * Dialog component for displaying "How it works" demo videos by use case.
 */
export function HowItWorksVideoDialog({
  open,
  onOpenChange,
}: HowItWorksVideoDialogProps) {
  const [resetKey, setResetKey] = useState(0);

  // Reset video iframe when dialog opens by incrementing a key.
  // This forces the HowItWorksVideos component to re-mount and reload video.
  // eslint-disable-next-line react-you-might-not-need-an-effect/you-might-not-need-an-effect
  useEffect(() => {
    if (open) {
      setResetKey((key) => key + 1);
    }
  }, [open]);

  const activeVideo = HOW_IT_WORKS_VIDEOS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-0.75rem)] w-[calc(100%-0.75rem)] max-w-[calc(100%-0.75rem)] flex-col gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-h-[calc(100vh-2rem)] sm:w-full sm:max-w-[800px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{activeVideo.title}</DialogTitle>
          <DialogDescription>{activeVideo.description}</DialogDescription>
        </DialogHeader>

        <HowItWorksVideos
          resetKey={resetKey}
          initialVideoId={DEFAULT_VIDEO_ID}
          showIframe={open}
          className="gap-0"
        />
      </DialogContent>
    </Dialog>
  );
}
