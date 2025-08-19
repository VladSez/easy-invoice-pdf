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
import { sellerSchema, type SellerData } from "@/app/schema";
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
import { SELLERS_LOCAL_STORAGE_KEY } from "./seller-management";
import { z } from "zod";
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

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
      email: initialData?.email ?? "",
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

  // by default, we want to apply the new seller to the current invoice
  const [shouldApplyNewSellerToInvoice, setShouldApplyNewSellerToInvoice] =
    useState(true);

  // Add state for applying form values
  const [shouldApplyFormValues, setShouldApplyFormValues] = useState(false);

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
          email: "",
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

  function onSubmit(formValues: SellerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing sellers or initialize empty array
      const sellers = localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY);
      const existingSellers: unknown = sellers ? JSON.parse(sellers) : [];

      // Validate existing sellers array with Zod
      const existingSellersValidationResult = z
        .array(sellerSchema)
        .safeParse(existingSellers);

      if (!existingSellersValidationResult.success) {
        console.error(
          "Invalid existing sellers data:",
          existingSellersValidationResult.error,
        );

        // Show error toast
        toast.error("Error loading existing sellers", {
          richColors: true,
          description: "Please try again",
        });

        // Reset localStorage if validation fails
        localStorage.setItem(SELLERS_LOCAL_STORAGE_KEY, JSON.stringify([]));

        return;
      }

      // we don't need to validate the name if we are editing an existing seller

      // Validate seller data against existing sellers
      const isDuplicateName = existingSellersValidationResult.data.some(
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
          richColors: true,
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
      onClose(false);

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Failed to save seller:", error);

      toast.error("Failed to save seller", {
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
                content="Use the seller details already entered in the invoice form to pre-fill this dialog"
                className="z-[1000]"
              />
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
                    <FormLabel>Name</FormLabel>
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
                    <FormLabel>Address</FormLabel>
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

              <div className="flex items-end justify-between">
                <FormField
                  control={form.control}
                  name="vatNo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>VAT Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter VAT number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show/Hide VAT Number Field in PDF */}
                <div className="ml-4 flex items-center gap-2">
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
                          />
                          <CustomTooltip
                            trigger={
                              <Label htmlFor="vatNoFieldIsVisible">
                                Show in PDF
                              </Label>
                            }
                            content='Show/Hide the "VAT Number" field in the PDF'
                            className="z-[1000]"
                          />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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
                        placeholder="seller@email.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VAT Number */}
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Account Number</FormLabel>
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

                  <div className="ml-4 flex items-center gap-2">
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
                            />
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="accountNumberFieldIsVisible">
                                  Show in PDF
                                </Label>
                              }
                              content='Show/Hide the "Account Number" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* SWIFT/BIC */}
                <div className="flex items-end justify-between">
                  <FormField
                    control={form.control}
                    name="swiftBic"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>SWIFT/BIC</FormLabel>
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

                  {/* Show/Hide SWIFT/BIC Field in PDF */}
                  <div className="ml-4 flex items-center gap-2">
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
                            />
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="swiftBicFieldIsVisible">
                                  Show in PDF
                                </Label>
                              }
                              content='Show/Hide the "SWIFT/BIC" field in the PDF'
                              className="z-[1000]"
                            />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

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

                  {/* Show/Hide Notes Field in PDF */}
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
                                data-testid={`sellerNotesDialogFieldVisibilitySwitch`}
                              />
                            </FormControl>
                            <CustomTooltip
                              trigger={
                                <Label htmlFor="notes-field-visibility">
                                  Show in PDF
                                </Label>
                              }
                              content="Show/Hide the notes field in the PDF"
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

          {/* Apply to Current Invoice switch remains at the bottom */}
          {!isEditMode && (
            <div className="mt-4 flex items-center gap-2 border-t pt-4">
              <Switch
                checked={shouldApplyNewSellerToInvoice}
                onCheckedChange={setShouldApplyNewSellerToInvoice}
                id="apply-seller-to-current-invoice-switch"
              />
              <CustomTooltip
                trigger={
                  <Label
                    htmlFor="apply-seller-to-current-invoice-switch"
                    className="cursor-pointer"
                  >
                    Apply to Current Invoice
                  </Label>
                }
                content="When enabled, the newly created seller will be automatically applied to your current invoice form"
                className="z-[1000]"
              />
            </div>
          )}
        </div>
        <DialogFooter className="border-border border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" _variant="outline">
              Cancel
            </Button>
          </DialogClose>
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
  );
}
