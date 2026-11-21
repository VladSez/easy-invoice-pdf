import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PartyFields } from "@/app/(main)/(app)/components/invoice-form/sections/components/party-fields";
import { useConfirmDiscard } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-confirm-discard";
import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  BUYERS_LOCAL_STORAGE_KEY,
  buyerSchema,
  type BuyerData,
} from "@/app/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { zodResolverForOutput } from "@/lib/zod-resolver-for-output";

import { ConfirmDiscardDialog } from "../confirm-discard-dialog";

const BUYER_FORM_ID = "buyer-form";

/** The buyer form with nothing filled in yet */
const EMPTY_BUYER_FORM_VALUES = {
  id: "",
  name: "",
  address: "",
  vatNo: "",
  vatNoLabelText: "VAT no",
  email: "",
  emailFieldIsVisible: true,
  vatNoFieldIsVisible: true,
  notes: "",
  notesFieldIsVisible: true,
} as const satisfies BuyerData;

interface BuyerDialogProps {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  handleBuyerAdd?: (
    buyer: BuyerData,
    { shouldApplyNewBuyerToInvoice }: { shouldApplyNewBuyerToInvoice: boolean },
  ) => void;
  handleBuyerEdit?: (buyer: BuyerData) => void;
  initialData: BuyerData | null;
  /** The tax number label a new buyer starts with: the invoice language's, as in the form. */
  defaultVatNoLabelText: string;
  isEditMode: boolean;
  formValues?: Partial<BuyerData>;
}

/**
 * BuyerDialog component for adding or editing buyer information.
 *
 * This dialog provides a form interface for managing buyer data, including:
 * - Basic information (name, address, VAT number)
 * - Contact details (email)
 * - Additional notes
 *
 * Features:
 * - Pre-fill form with current invoice values (when creating new buyer)
 * - Apply newly created buyer to current invoice
 * - Validation for duplicate buyer names
 * - Unsaved changes warning on dialog close
 * - Field visibility toggles for optional information
 */
export function BuyerDialog({
  isOpen,
  onClose,
  handleBuyerAdd,
  handleBuyerEdit,
  initialData,
  defaultVatNoLabelText,
  isEditMode,
  formValues,
}: BuyerDialogProps) {
  const form = useForm<BuyerData>({
    resolver: zodResolverForOutput(buyerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      vatNoLabelText: initialData?.vatNoLabelText ?? defaultVatNoLabelText,
      email: initialData?.email ?? "",
      emailFieldIsVisible: initialData?.emailFieldIsVisible ?? true,
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
      notes: initialData?.notes ?? "",
      notesFieldIsVisible: initialData?.notesFieldIsVisible ?? true,
    },
  });

  const { isDirty, dirtyFields } = form.formState;

  const { isConfirmDiscardDialogOpen, setIsConfirmDiscardDialogOpen } =
    useConfirmDiscard();

  // by default, we want to apply the new buyer to the current invoice
  const [shouldApplyNewBuyerToInvoice, setShouldApplyNewBuyerToInvoice] =
    useState(true);

  // should apply inline form values to the dialog form
  const [shouldApplyInlineFormValues, setShouldApplyInlineFormValues] =
    useState(false);

  // Stores a pending action to execute after user confirms discard in the ConfirmDiscardDialog.
  // Uses currying (() => () => void) because React state setters require a function that returns
  // the new state value. When we call setPendingDiscardAction(() => closeDialog), we're storing
  // a function that returns closeDialog, not calling closeDialog immediately. This prevents
  // premature execution and allows us to defer the action until the user confirms.
  const [pendingDiscardAction, setPendingDiscardAction] = useState<
    (() => void) | null
  >(null);

  /** Filled in from the invoice and not changed since, so it is tinted as copied. */
  function isPrefilled({ name, value }: IsPrefilledOptions) {
    return shouldApplyInlineFormValues && !dirtyFields[name] && Boolean(value);
  }

  /**
   * Resets the dialog form to the buyer it was opened with, or to an empty
   * form when adding a new one.
   *
   * `form.reset()` with no arguments cannot be used for this: react-hook-form treats
   * the values of the last `reset(values)` call as the new defaults, so after a
   * pre-fill it would restore the pre-filled values instead of clearing them.
   */
  function resetFormToInitialValues() {
    form.reset(
      initialData ?? {
        ...EMPTY_BUYER_FORM_VALUES,
        vatNoLabelText: defaultVatNoLabelText,
      },
    );
  }

  /**
   * Applies the "Use current invoice data" switch to the dialog form.
   *
   * Switch ON: fills the form with the current invoice buyer data, so the invoice's
   * buyer can be saved as a new buyer.
   * Switch OFF: clears the form back to the initial (or empty) buyer.
   *
   * Leaves the form alone in edit mode, so the buyer being edited is never overwritten.
   */
  function applyPrefillSwitch(newValue: boolean) {
    setShouldApplyInlineFormValues(newValue);

    if (isEditMode) {
      return;
    }

    // Switch is ON: pre-fill the form with the current invoice buyer data
    if (newValue) {
      if (formValues) {
        form.reset({
          ...form.getValues(),
          ...formValues,
        });
      }
      return;
    }

    // Switch is OFF: reset the form to the initial data, or to an empty form
    resetFormToInitialValues();
  }

  /**
   * Guards the pre-fill switch toggle against dirty form state.
   *
   * When the form has unsaved changes, opens the ConfirmDiscardDialog before
   * applying the switch change. Only applies the switch after the user confirms
   * discard.
   */
  function handlePrefillSwitchToggle(newValue: boolean) {
    if (isDirty) {
      setPendingDiscardAction(() => {
        return () => {
          return applyPrefillSwitch(newValue);
        };
      });
      setIsConfirmDiscardDialogOpen(true);
      return;
    }
    applyPrefillSwitch(newValue);
  }

  /**
   * Closes the buyer dialog and resets the form to its default state.
   */
  function closeDialog() {
    resetFormToInitialValues();

    // by default, we don't want to apply the inline form values to the dialog form
    setShouldApplyInlineFormValues(false);
    // by default, we want to apply the new buyer to the current invoice
    setShouldApplyNewBuyerToInvoice(true);

    onClose(false);
  }

  function onSubmit(formValues: BuyerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing buyers or initialize empty array
      const buyers = getAppStorageItem(BUYERS_LOCAL_STORAGE_KEY);
      const existingBuyers: unknown = buyers ? JSON.parse(buyers) : [];

      const rawBuyers = Array.isArray(existingBuyers) ? existingBuyers : [];

      const validBuyers: BuyerData[] = [];
      let hadInvalidBuyers = false;

      // Validate each buyer individually — drop only invalid items
      for (const item of rawBuyers) {
        const result = buyerSchema.safeParse(item);

        if (result.success) {
          validBuyers.push(result.data);
        } else {
          hadInvalidBuyers = true;

          console.error(
            "[buyer-dialog] Dropped invalid buyer entry:",
            result.error,
          );

          Sentry.captureException(
            new Error(
              `[buyer-dialog] Invalid buyer data in localStorage: ${rawBuyers.length - validBuyers.length} items dropped`,
            ),
          );
        }
      }

      // If we had invalid buyers, save the valid buyers back to localStorage
      if (hadInvalidBuyers) {
        setAppStorageItem({
          key: BUYERS_LOCAL_STORAGE_KEY,
          value: JSON.stringify(validBuyers),
        });
      }

      // Validate buyer data against existing buyers
      const isDuplicateName = validBuyers.some((buyer: BuyerData) => {
        return buyer.name === formValues.name && buyer.id !== formValues.id;
      });

      if (isDuplicateName) {
        form.setError("name", {
          type: "manual",
          message: "A buyer with this name already exists",
        });

        // Focus on the name input field for user to fix the error
        form.setFocus("name");

        // Show error toast
        toast.error("A buyer with this name already exists", {
          richColors: true,
        });

        return;
      }

      if (isEditMode) {
        // Edit buyer
        handleBuyerEdit?.(formValues);
      } else {
        // Add new buyer
        handleBuyerAdd?.(formValues, { shouldApplyNewBuyerToInvoice });
      }

      // Close dialog
      closeDialog();
    } catch (error) {
      console.error("Failed to save buyer:", error);

      toast.error("Failed to save buyer", {
        description: "Please try again",
        richColors: true,
      });

      Sentry.captureException(error);
    }
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Handles the discard action by checking for unsaved changes.
            // If there are unsaved changes (isDirty), opens the confirmation dialog.
            // Otherwise, closes the dialog immediately.
            if (isDirty) {
              setPendingDiscardAction(() => {
                return closeDialog;
              });
              setIsConfirmDiscardDialogOpen(true);
              return;
            }
            closeDialog();
          }
        }}
      >
        <DialogContent
          className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5"
          data-testid={`manage-buyer-dialog`}
        >
          <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <DialogTitle className="text-base">
              {isEditMode ? "Edit buyer" : "New buyer"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Changes apply to every invoice that uses this buyer."
                : "Saved in this browser, ready to pick on any invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4">
            {/* Add Use Current Form Values switch */}
            {!isEditMode ? (
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-neutral-100 px-4 py-3">
                <Switch
                  checked={shouldApplyInlineFormValues}
                  onCheckedChange={handlePrefillSwitchToggle}
                  id="apply-form-values-switch"
                  aria-describedby="apply-form-values-description"
                  // the default track is too pale to read as "off" on the grey strip
                  className="shrink-0 data-[state=unchecked]:bg-slate-300"
                />
                <div>
                  <Label
                    htmlFor="apply-form-values-switch"
                    className="cursor-pointer text-sm font-semibold text-slate-900"
                  >
                    Fill in from this invoice
                  </Label>
                  <p
                    id="apply-form-values-description"
                    className="mt-0.5 text-pretty text-sm text-slate-600"
                  >
                    Copies the buyer you typed into the invoice. You can still
                    change it here.
                  </p>
                </div>
              </div>
            ) : null}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id={BUYER_FORM_ID}>
                <PartyFields
                  party="buyer"
                  placement="dialog"
                  control={form.control}
                  names={{
                    name: "name",
                    address: "address",
                    vatNoLabelText: "vatNoLabelText",
                    vatNo: "vatNo",
                    vatNoFieldIsVisible: "vatNoFieldIsVisible",
                    email: "email",
                    emailFieldIsVisible: "emailFieldIsVisible",
                    notes: "notes",
                    notesFieldIsVisible: "notesFieldIsVisible",
                  }}
                  isPrefilled={isPrefilled}
                />
              </form>
            </Form>
          </div>
          <DialogFooter className="border-border gap-3 border-t px-6 py-4 sm:items-center sm:justify-between">
            {/* where the choice is made: next to Save, rather than at the end of the form */}
            {!isEditMode ? (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="apply-buyer-to-current-invoice-switch"
                    checked={shouldApplyNewBuyerToInvoice}
                    onChange={(event) => {
                      setShouldApplyNewBuyerToInvoice(event.target.checked);
                    }}
                    aria-describedby="apply-buyer-to-current-invoice-description"
                    className="size-4 cursor-pointer accent-slate-900"
                  />

                  <Label
                    htmlFor="apply-buyer-to-current-invoice-switch"
                    className="cursor-pointer font-normal"
                  >
                    Use on this invoice
                  </Label>
                </div>

                {/* says what Save will do with the current choice */}
                <p
                  id="apply-buyer-to-current-invoice-description"
                  className="ml-6 mt-0.5 max-w-64 text-pretty text-xs text-slate-500"
                >
                  {shouldApplyNewBuyerToInvoice
                    ? "Replaces the buyer on this invoice with this one."
                    : "Only saved to your list. This invoice keeps its buyer."}
                </p>
              </div>
            ) : (
              <span aria-hidden />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Handles the discard action by checking for unsaved changes.
                  // If there are unsaved changes (isDirty), opens the confirmation dialog.
                  // Otherwise, closes the dialog immediately.
                  if (isDirty) {
                    setPendingDiscardAction(() => {
                      return closeDialog;
                    });
                    setIsConfirmDiscardDialogOpen(true);
                    return;
                  }
                  closeDialog();
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  // trigger validations and submit the form and handle errors
                  void form.handleSubmit(onSubmit)();
                }}
                form={BUYER_FORM_ID}
              >
                Save buyer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDiscardDialog
        open={isConfirmDiscardDialogOpen}
        onOpenChange={setIsConfirmDiscardDialogOpen}
        onDiscard={() => {
          pendingDiscardAction?.();
          setPendingDiscardAction(null);
        }}
        entityName="buyer"
      />
    </>
  );
}

interface IsPrefilledOptions {
  name: keyof BuyerData;
  value: unknown;
}
