import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  entityName: string;
}

export function ConfirmDiscardDialog({
  open,
  onOpenChange,
  onDiscard,
  entityName,
}: ConfirmDiscardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="confirm-discard-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes to {entityName}?</AlertDialogTitle>
          <AlertDialogDescription className="">
            You have <span className="font-semibold">unsaved changes</span>.
            They will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDiscard}
            className="bg-red-500 text-red-50 hover:bg-red-500/90"
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
