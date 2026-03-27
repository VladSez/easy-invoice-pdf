import { sellerSchema, type SellerData } from "@/app/schema";
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
import { zodResolver } from "@hookform/resolvers/zod";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDiscardDialog } from "../confirm-discard-dialog";
import { SELLERS_LOCAL_STORAGE_KEY } from "./seller-management";
import { InputHelperMessage } from "../../../../../../../components/ui/input-helper-message";
import { useConfirmDiscard } from "@/app/(app)/components/invoice-form/sections/hooks/use-confirm-discard";

const SELLER_FORM_ID = "seller-form";

interface SellerDialogProps {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  handleSellerAdd?: (
    seller: SellerData,
    {
      shouldApplyNewSellerToInvoice,
    }: { shouldApplyNewSellerToInvoice: boolean },
  ) => void;
  handleSellerEdit?: (seller: SellerData) => void;
  initialData: SellerData | null;
  isEditMode: boolean;
  formValues?: Partial<SellerData>;
}

/**
 * SellerDialog component for adding or editing seller information.
 *
 * This dialog provides a form interface for managing seller data, including:
 * - Basic information (name, address, VAT number)
 * - Contact details (email)
 * - Banking information (account number, SWIFT/BIC)
 * - Additional notes
 *
 * Features:
 * - Pre-fill form with current invoice values (when creating new seller)
 * - Apply newly created seller to current invoice
 * - Validation for duplicate seller names
 * - Unsaved changes warning on dialog close
 * - Field visibility toggles for optional information
 */
export function SellerDialog({
  isOpen,
  onClose,
  handleSellerAdd,
  handleSellerEdit,
  initialData,
  isEditMode,
  formValues,
}: SellerDialogProps) {
  const form = useForm<SellerData>({
    resolver: zodResolver(sellerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      vatNoLabelText: initialData?.vatNoLabelText ?? "VAT no",
      email: initialData?.email ?? "",
      emailFieldIsVisible: initialData?.emailFieldIsVisible ?? true,
      accountNumber: initialData?.accountNumber ?? "",
      swiftBic: initialData?.swiftBic ?? "",
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
      accountNumberFieldIsVisible:
        initialData?.accountNumberFieldIsVisible ?? true,
      swiftBicFieldIsVisible: initialData?.swiftBicFieldIsVisible ?? true,
      notes: initialData?.notes ?? "",
      notesFieldIsVisible: initialData?.notesFieldIsVisible ?? true,
    },
  });

  const { isDirty } = form.formState;

  const { isConfirmDiscardDialogOpen, setIsConfirmDiscardDialogOpen } =
    useConfirmDiscard();

  // by default, we want to apply the new seller to the current invoice
  const [shouldApplyNewSellerToInvoice, setShouldApplyNewSellerToInvoice] =
    useState(true);

  // Add state for applying form values
  const [shouldApplyFormValues, setShouldApplyFormValues] = useState(false);

  // Stores a pending action to execute after user confirms discard in the ConfirmDiscardDialog.
  // Uses currying (() => () => void) because React state setters require a function that returns
  // the new state value. When we call setPendingDiscardAction(() => closeDialog), we're storing
  // a function that returns closeDialog, not calling closeDialog immediately. This prevents
  // premature execution and allows us to defer the action until the user confirms.
  const [pendingDiscardAction, setPendingDiscardAction] = useState<
    (() => void) | null
  >(null);

  // Effect to update form values when switch is toggled
  useEffect(() => {
    // if the switch is on and we have form values, we want to apply the form values to the form
    if (shouldApplyFormValues && formValues && !isEditMode) {
      form.reset({
        ...form.getValues(),
        ...formValues,
      });
    }

    // if the switch is off and we have initial data, we want to apply the initial data to the form
    else if (!shouldApplyFormValues && !isEditMode) {
      form.reset(
        initialData ?? {
          id: "",
          name: "",
          address: "",
          vatNo: "",
          vatNoLabelText: "VAT no",
          email: "",
          emailFieldIsVisible: true,
          accountNumber: "",
          swiftBic: "",
          vatNoFieldIsVisible: true,
          accountNumberFieldIsVisible: true,
          swiftBicFieldIsVisible: true,
          notes: "",
          notesFieldIsVisible: true,
        },
      );
    }
  }, [shouldApplyFormValues, formValues, initialData, isEditMode, form]);

  /**
   * Guards the pre-fill switch toggle against dirty form state.
   *
   * When the form has unsaved changes, opens the ConfirmDiscardDialog before
   * applying the switch change. Only updates shouldApplyFormValues (and thus
   * triggers form.reset via the effect above) after the user confirms discard.
   */
  function handlePrefillSwitchToggle(newValue: boolean) {
    if (isDirty) {
      setPendingDiscardAction(() => () => setShouldApplyFormValues(newValue));
      setIsConfirmDiscardDialogOpen(true);
      return;
    }
    setShouldApplyFormValues(newValue);
  }

  /**
   * Prevents accidental data loss by warning users before leaving the page with unsaved changes.
   *
   * This effect sets up a browser-level warning that triggers when:
   * - The form has unsaved changes (isDirty is true)
   * - The user attempts to navigate away, refresh, or close the tab/window
   */
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ""; // required for Chrome
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /**
   * Closes the seller dialog and resets the form to its default state.
   */
  function closeDialog() {
    form.reset();
    setShouldApplyFormValues(false);
    onClose(false);
  }

  function onSubmit(formValues: SellerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing sellers or initialize empty array
      const sellers = localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY);
      const existingSellers: unknown = sellers ? JSON.parse(sellers) : [];

      const rawSellers = Array.isArray(existingSellers) ? existingSellers : [];

      const validSellers: SellerData[] = [];
      let hadInvalidSellers = false;

      // Validate each seller individually — drop only invalid items
      for (const item of rawSellers) {
        const result = sellerSchema.safeParse(item);
        if (result.success) {
          validSellers.push(result.data);
        } else {
          hadInvalidSellers = true;

          Sentry.captureException(
            new Error(
              `[seller-dialog] Invalid seller data in localStorage: ${rawSellers.length - validSellers.length} items dropped`,
            ),
          );

          console.error(
            "[seller-dialog] Dropped invalid seller entry:",
            result.error,
          );
        }
      }

      // If we had invalid sellers, save the valid sellers back to localStorage
      if (hadInvalidSellers) {
        localStorage.setItem(
          SELLERS_LOCAL_STORAGE_KEY,
          JSON.stringify(validSellers),
        );
      }

      // we don't need to validate the name if we are editing an existing seller

      // Validate seller data against existing sellers
      const isDuplicateName = validSellers.some(
        (seller: SellerData) =>
          seller.name === formValues.name && seller.id !== formValues.id,
      );

      if (isDuplicateName) {
        form.setError("name", {
          type: "manual",
          message: "A seller with this name already exists",
        });

        // Focus on the name input field for user to fix the error
        form.setFocus("name");

        // Show error toast
        toast.error("A seller with this name already exists", {
          id: "seller-name-already-exists-error-toast",
          richColors: true,
          description: "Please try again",
        });

        return;
      }

      if (isEditMode) {
        // Edit seller
        handleSellerEdit?.(formValues);
      } else {
        // Add new seller
        handleSellerAdd?.(formValues, { shouldApplyNewSellerToInvoice });
      }

      // Close dialog
      closeDialog();
    } catch (error) {
      console.error("Failed to save seller:", error);

      toast.error("Failed to save seller", {
        id: "failed-to-save-seller-error-toast",
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
            // check if the form has unsaved changes and open the confirm discard dialog
            // If there are unsaved changes (isDirty), opens the confirmation dialog.
            // Otherwise, closes the dialog immediately.
            if (isDirty) {
              setPendingDiscardAction(() => closeDialog);
              setIsConfirmDiscardDialogOpen(true);
              return;
            }
            closeDialog();
          }
        }}
      >
        <DialogContent
          className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5"
          data-testid={`manage-seller-dialog`}
        >
          <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <DialogTitle className="text-base">
              {isEditMode ? "Edit Seller" : "Add New Seller"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Edit the seller details"
                : "Add a new seller to use later in your invoices"}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4">
            {/* Show Use Current Form Values switch only when creating new seller */}
            {!isEditMode && (
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={shouldApplyFormValues}
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
                  When enabled, this will automatically fill in the seller
                  details dialog with the information you&apos;ve already
                  entered in your current invoice form.
                </span>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                id={SELLER_FORM_ID}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (Required)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Enter seller name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Required)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Enter seller address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <fieldset className="rounded-md border px-4 pb-4">
                  <legend className="text-base font-semibold lg:text-lg">
                    Seller Tax Number
                  </legend>

                  <div className="mb-2 flex items-center justify-end">
                    {/* Show Tax Number Field in PDF */}
                    <div className="flex items-center gap-2">
                      <FormField
                        control={form.control}
                        name="vatNoFieldIsVisible"
                        render={({ field }) => (
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
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="vatNoLabelText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter Tax number label"
                            />
                          </FormControl>
                          {form.formState.errors.vatNoLabelText && (
                            <FormMessage>
                              {form.formState.errors.vatNoLabelText.message}
                            </FormMessage>
                          )}

                          {!form.formState.errors.vatNoLabelText && (
                            <InputHelperMessage>
                              Set a custom label (e.g. VAT no, Tax no, etc.)
                            </InputHelperMessage>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vatNo"
                      render={({ field }) => (
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
                      )}
                    />
                  </div>
                </fieldset>

                {/* Email */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="seller@email.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emailFieldIsVisible"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="emailFieldIsVisible"
                              data-testid={`sellerEmailDialogFieldVisibilitySwitch`}
                              aria-label={`Show the 'Email' field in the PDF`}
                            />
                          </FormControl>
                          <CustomTooltip
                            trigger={
                              <Label htmlFor="emailFieldIsVisible">
                                Show Seller Email in PDF
                              </Label>
                            }
                            content='Show the "Email" field in the PDF'
                            className="z-[1000]"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Account Number */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          Account Number
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter account number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumberFieldIsVisible"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="accountNumberFieldIsVisible"
                            aria-label={`Show the 'Account Number' field in the PDF`}
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor="accountNumberFieldIsVisible">
                                Show Seller Account Number in PDF
                              </Label>
                            }
                            content='Show the "Account Number" field in the PDF'
                            className="z-[1000]"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* SWIFT/BIC */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="swiftBic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="mb-2 font-medium">
                          SWIFT/BIC
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder="Enter SWIFT/BIC code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="swiftBicFieldIsVisible"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="swiftBicFieldIsVisible"
                            aria-label={`Show the 'SWIFT/BIC' field in the PDF`}
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor="swiftBicFieldIsVisible">
                                Show Seller SWIFT/BIC in PDF
                              </Label>
                            }
                            content='Show the "SWIFT/BIC" field in the PDF'
                            className="z-[1000]"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-3 rounded-md border p-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notesFieldIsVisible"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="notes-field-visibility"
                              data-testid={`sellerNotesDialogFieldVisibilitySwitch`}
                              aria-label={`Show the 'Notes' field in the PDF`}
                            />
                          </FormControl>
                          <CustomTooltip
                            trigger={
                              <Label htmlFor="notes-field-visibility">
                                Show Seller Notes in PDF
                              </Label>
                            }
                            content="Show the notes field in the PDF"
                            className="z-[1000]"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>

            {/* Apply to Current Invoice switch remains at the bottom */}
            {!isEditMode && (
              <div className="mt-4 flex flex-col gap-1 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={shouldApplyNewSellerToInvoice}
                    onCheckedChange={setShouldApplyNewSellerToInvoice}
                    id="apply-seller-to-current-invoice-switch"
                  />
                  <Label
                    htmlFor="apply-seller-to-current-invoice-switch"
                    className="cursor-pointer"
                  >
                    Apply to Current Invoice
                  </Label>
                </div>
                <span className="mt-1.5 text-xs text-slate-500">
                  When enabled, the newly created seller will be automatically
                  applied to your current invoice form and reflected in the
                  generated PDF.
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="border-border border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // check if the form has unsaved changes and open the confirm discard dialog
                // If there are unsaved changes (isDirty), opens the confirmation dialog.
                // Otherwise, closes the dialog immediately.
                if (isDirty) {
                  setPendingDiscardAction(() => closeDialog);
                  setIsConfirmDiscardDialogOpen(true);
                  return;
                }
                closeDialog();
              }}
            >
              Cancel
            </Button>
            <Button
              // we don't want to use type="submit" because it will cause unnecessary re-render of the invoice pdf preview
              type="button"
              onClick={async () => {
                // we manually trigger the form validation and submit the form

                // Validate form and focus first error field
                const result = await form.trigger(undefined, {
                  shouldFocus: true,
                });
                if (!result) return;

                // submit the form
                onSubmit(form.getValues());
              }}
              form={SELLER_FORM_ID}
            >
              Save Seller
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
        entityName="seller"
      />
    </>
  );
}
