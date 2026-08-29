import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useConfirmDiscard } from "@/app/(app)/components/invoice-form/sections/hooks/use-confirm-discard";
import { buyerSchema, type BuyerData } from "@/app/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CustomTooltip } from "@/components/ui/tooltip";

import { InputHelperMessage } from "../../../../../../../components/ui/input-helper-message";
import { ConfirmDiscardDialog } from "../confirm-discard-dialog";
import { BUYERS_LOCAL_STORAGE_KEY } from "./buyer-management";

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
  isEditMode,
  formValues,
}: BuyerDialogProps) {
  const form = useForm<BuyerData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      vatNoLabelText: initialData?.vatNoLabelText ?? "VAT no",
      email: initialData?.email ?? "",
      emailFieldIsVisible: initialData?.emailFieldIsVisible ?? true,
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
      notes: initialData?.notes ?? "",
      notesFieldIsVisible: initialData?.notesFieldIsVisible ?? true,
    },
  });

  const { isDirty } = form.formState;

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

  /**
   * Resets the dialog form to the buyer it was opened with, or to an empty
   * form when adding a new one.
   *
   * `form.reset()` with no arguments cannot be used for this: react-hook-form treats
   * the values of the last `reset(values)` call as the new defaults, so after a
   * pre-fill it would restore the pre-filled values instead of clearing them.
   */
  function resetFormToInitialValues() {
    form.reset(initialData ?? EMPTY_BUYER_FORM_VALUES);
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
      const buyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
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
        localStorage.setItem(
          BUYERS_LOCAL_STORAGE_KEY,
          JSON.stringify(validBuyers),
        );
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
              {isEditMode ? "Edit Buyer" : "Add New Buyer"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edit the buyer details"
                : "Add a new buyer to use later in your invoices"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4">
            {/* Add Use Current Form Values switch */}
            {!isEditMode ? (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={shouldApplyInlineFormValues}
                    onCheckedChange={handlePrefillSwitchToggle}
                    id="apply-form-values-switch"
                  />
                  <Label
                    htmlFor="apply-form-values-switch"
                    className="cursor-pointer"
                  >
                    Pre-fill with values from the current invoice form
                  </Label>
                </div>
                <span className="mt-1.5 inline-block text-xs text-slate-500">
                  When enabled, this will automatically fill in the buyer
                  details dialog with the information you&apos;ve already
                  entered in your current invoice form.
                </span>
              </div>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                id={BUYER_FORM_ID}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Name (Required)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter buyer name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>Address (Required)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter buyer address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Tax Number */}
                <fieldset className="rounded-md border px-4 pb-4">
                  <legend className="text-base font-semibold lg:text-lg">
                    Buyer Tax Number
                  </legend>

                  <div className="mb-2 flex items-center justify-end">
                    {/* Show Tax Number Field in PDF */}
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="vatNoFieldIsVisible"
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  id="vatNoFieldIsVisible"
                                  aria-label={`Show the 'Tax Number' field in the PDF`}
                                />
                                <CustomTooltip
                                  trigger={
                                    <Label htmlFor="vatNoFieldIsVisible">
                                      Show in PDF
                                    </Label>
                                  }
                                  content='Show the "Tax Number" field in the PDF'
                                  className="z-[1000]"
                                />
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="vatNoLabelText"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter Tax number label"
                              />
                            </FormControl>

                            {form.formState.errors.vatNoLabelText ? (
                              <FormMessage>
                                {form.formState.errors.vatNoLabelText.message}
                              </FormMessage>
                            ) : null}

                            {!form.formState.errors.vatNoLabelText ? (
                              <InputHelperMessage>
                                Set a custom label (e.g. VAT no, Tax no, etc.)
                              </InputHelperMessage>
                            ) : null}
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="vatNo"
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter Tax number value"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </fieldset>

                {/* Email */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="buyer@email.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="emailFieldIsVisible"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="emailFieldIsVisible"
                                data-testid={`buyerEmailDialogFieldVisibilitySwitch`}
                                aria-label={`Show the 'Email' field in the PDF`}
                              />
                            </FormControl>
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="emailFieldIsVisible">
                                  Show Buyer Email in PDF
                                </Label>
                              }
                              content='Show the "Email" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <FormLabel className="mb-2 font-medium">
                            Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="Enter notes (max 750 characters)"
                              maxLength={750}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="notesFieldIsVisible"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                id="notes-field-visibility"
                                data-testid={`buyerNotesDialogFieldVisibilitySwitch`}
                                aria-label={`Show the 'Notes' field in the PDF`}
                              />
                            </FormControl>
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="notes-field-visibility">
                                  Show Buyer Notes in PDF
                                </Label>
                              }
                              content="Show the notes field in the PDF"
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </form>
            </Form>

            {/* Apply to Current Invoice switch remains at bottom */}
            {!isEditMode ? (
              <div className="mt-4 flex flex-col gap-1 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={shouldApplyNewBuyerToInvoice}
                    onCheckedChange={setShouldApplyNewBuyerToInvoice}
                    id="apply-buyer-to-current-invoice-switch"
                  />
                  <Label
                    htmlFor="apply-buyer-to-current-invoice-switch"
                    className="cursor-pointer"
                  >
                    Apply to Current Invoice
                  </Label>
                </div>
                <span className="mt-1.5 text-xs text-slate-500">
                  When enabled, the newly created buyer will be automatically
                  applied to your current invoice form and reflected in the
                  generated PDF.
                </span>
              </div>
            ) : null}
          </div>
          <DialogFooter className="border-border border-t px-6 py-4">
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
              Save Buyer
            </Button>
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
