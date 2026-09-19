"use client";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Mailbox } from "@/lib/mailbox/mailbox-types";

/**
 * Confirms removing send access. The wording stays about the mailbox
 * connection: disconnecting never deletes the user's EasyInvoicePDF account or
 * their sign-in method.
 */
export function DisconnectMailboxDialog({
  mailbox,
  onConfirm,
  isDisconnecting,
  disabled,
}: {
  mailbox: Mailbox;
  onConfirm: () => void;
  isDisconnecting: boolean;
  disabled: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={disabled}
        >
          {isDisconnecting ? (
            <Loader2 className="mr-1 size-3 animate-spin" />
          ) : null}
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect {mailbox.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            EasyInvoicePDF will no longer be able to send invoices from this
            mailbox. You stay signed in and can connect it again at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600"
            onClick={onConfirm}
          >
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
