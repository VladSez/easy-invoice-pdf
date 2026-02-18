import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buyerSchema, type BuyerData } from "@/app/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CustomTooltip } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { BUYERS_LOCAL_STORAGE_KEY } from "./buyer-management";
import { z } from "zod";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { InputHelperMessage } from "./ui/input-helper-message";

const BUYER_FORM_ID = "buyer-form";

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
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
      notes: initialData?.notes ?? "",
      notesFieldIsVisible: initialData?.notesFieldIsVisible ?? true,
    },
  });

  // by default, we want to apply the new buyer to the current invoice
  const [shouldApplyNewBuyerToInvoice, setShouldApplyNewBuyerToInvoice] =
    useState(true);

  const [shouldApplyFormValues, setShouldApplyFormValues] = useState(false);

  /**
   * Synchronizes form values based on the "Use current invoice data" switch state.
   *
   * When creating a new buyer (not in edit mode):
   * - If switch is ON: Populates the form with current invoice buyer data (formValues)
   *   to allow users to save the current invoice's buyer information as a new saved buyer.
   * - If switch is OFF: Resets the form to empty/default values or initialData
   *   to allow users to enter completely new buyer information from scratch.
   *
   * This effect does not run in edit mode to prevent overwriting the buyer being edited.
   */
  useEffect(() => {
    // Switch is ON: Pre-fill form with current invoice buyer data
    if (shouldApplyFormValues && formValues && !isEditMode) {
      form.reset({
        ...form.getValues(),
        ...formValues,
      });
    }

    // Switch is OFF: Reset form to empty state or initial data
    else if (!shouldApplyFormValues && !isEditMode) {
      form.reset(
        initialData ?? {
          id: "",
          name: "",
          address: "",
          vatNo: "",
          vatNoLabelText: "VAT no",
          email: "",
          vatNoFieldIsVisible: true,
          notes: "",
          notesFieldIsVisible: true,
        },
      );
    }
  }, [shouldApplyFormValues, formValues, initialData, isEditMode, form]);

  function onSubmit(formValues: BuyerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing buyers or initialize empty array
      const buyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
      const existingBuyers: unknown = buyers ? JSON.parse(buyers) : [];

      // Validate existing buyers array with Zod
      const existingBuyersValidationResult = z
        .array(buyerSchema)
        .safeParse(existingBuyers);

      if (!existingBuyersValidationResult.success) {
        console.error(
          "Invalid existing buyers data:",
          existingBuyersValidationResult.error,
        );

        // Show error toast
        toast.error("Error loading existing buyers", {
          richColors: true,
          description: "Please try again",
        });

        // Reset localStorage if validation fails
        localStorage.setItem(BUYERS_LOCAL_STORAGE_KEY, JSON.stringify([]));

        return;
      }

      // Validate buyer data against existing buyers
      const isDuplicateName = existingBuyersValidationResult.data.some(
        (buyer: BuyerData) =>
          buyer.name === formValues.name && buyer.id !== formValues.id,
      );

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
      onClose(false);

      // Reset form
      form.reset();
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose(false);
          form.reset();
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
          {!isEditMode && (
            <div className="mb-4 flex items-center gap-2">
              <Switch
                checked={shouldApplyFormValues}
                onCheckedChange={setShouldApplyFormValues}
                id="apply-form-values-switch"
              />
              <CustomTooltip
                trigger={
                  <Label
                    htmlFor="apply-form-values-switch"
                    className="cursor-pointer"
                  >
                    Pre-fill with values from the current invoice form
                  </Label>
                }
                content="Use the buyer details already entered in the invoice form to pre-fill this dialog"
                className="z-[1000]"
              />
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              id={BUYER_FORM_ID}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter buyer name"
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter buyer address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="buyer@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Notes</FormLabel>
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

                  {/* Show Notes Field in PDF */}
                  <div className="ml-4 flex items-center gap-2">
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
                                data-testid={`buyerNotesDialogFieldVisibilitySwitch`}
                                aria-label={`Show the 'Notes' field in the PDF`}
                              />
                            </FormControl>
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="notes-field-visibility">
                                  Show in PDF
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
                </div>
              </div>
            </form>
          </Form>

          {/* Apply to Current Invoice switch remains at bottom */}
          {!isEditMode && (
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
              <Switch
                checked={shouldApplyNewBuyerToInvoice}
                onCheckedChange={setShouldApplyNewBuyerToInvoice}
                id="apply-buyer-to-current-invoice-switch"
              />
              <CustomTooltip
                trigger={
                  <Label
                    htmlFor="apply-buyer-to-current-invoice-switch"
                    className="cursor-pointer"
                  >
                    Apply to Current Invoice
                  </Label>
                }
                content="When enabled, the newly created buyer will be automatically applied to your current invoice form"
                className="z-[1000]"
              />
            </div>
          )}
        </div>
        <DialogFooter className="border-border border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={async () => {
              // Validate form and focus first error field
              const result = await form.trigger(undefined, {
                shouldFocus: true,
              });
              if (!result) return;

              // submit the form
              onSubmit(form.getValues());
            }}
            form={BUYER_FORM_ID}
          >
            Save Buyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
