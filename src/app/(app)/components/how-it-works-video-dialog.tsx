"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VIDEO_DEMO_YOUTUBE_URL } from "@/config";

interface HowItWorksVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component for displaying "How it works" demo video.
 */
export function HowItWorksVideoDialog({
  open,
  onOpenChange,
}: HowItWorksVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[800px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>How EasyInvoicePDF Works</DialogTitle>
          <DialogDescription>
            Watch this quick demo to learn how to create and customize your
            invoices.
          </DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden">
          <iframe
            src={VIDEO_DEMO_YOUTUBE_URL}
            title="EasyInvoicePDF Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="h-full w-full border-0"
            data-testid="how-it-works-video"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
