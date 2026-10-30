import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  getPartyFieldClassName,
  PartyDialogSection,
  PdfVisibilityToggle,
} from "@/app/(main)/(app)/components/invoice-form/sections/components/party-dialog-fields";
import { useConfirmDiscard } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-confirm-discard";
import {
  getAppStorageItem,
  setAppStorageItem,
} from "@/app/(main)/(app)/utils/app-local-storage";
import {
  SELLERS_LOCAL_STORAGE_KEY,
  sellerSchema,
  type SellerData,
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
import { zodResolverForOutput } from "@/lib/zod-resolver-for-output";

import { ConfirmDiscardDialog } from "../confirm-discard-dialog";

const SELLER_FORM_ID = "seller-form";

/** The seller form with nothing filled in yet */
const EMPTY_SELLER_FORM_VALUES = {
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
} satisfies SellerData;

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
  /** The tax number label a new seller starts with: the invoice language's, as in the form. */
  defaultVatNoLabelText: string;
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
  defaultVatNoLabelText,
  isEditMode,
  formValues,
}: SellerDialogProps) {
  const form = useForm<SellerData>({
    resolver: zodResolverForOutput(sellerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      vatNoLabelText: initialData?.vatNoLabelText ?? defaultVatNoLabelText,
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

  const { isDirty, dirtyFields } = form.formState;

  // hidden fields are faded in the dialog, as they will be missing from the PDF
  const [
    isVatNoVisible,
    isEmailVisible,
    isAccountNumberVisible,
    isSwiftBicVisible,
    isNotesVisible,
  ] = useWatch({
    control: form.control,
    name: [
      "vatNoFieldIsVisible",
      "emailFieldIsVisible",
      "accountNumberFieldIsVisible",
      "swiftBicFieldIsVisible",
      "notesFieldIsVisible",
    ],
  });

  const { isConfirmDiscardDialogOpen, setIsConfirmDiscardDialogOpen } =
    useConfirmDiscard();

  // by default, we want to apply the new seller to the current invoice
  const [shouldApplyNewSellerToInvoice, setShouldApplyNewSellerToInvoice] =
    useState(true);

  // Add state for applying inline form values to dialog form
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
   * Resets the dialog form to the seller it was opened with, or to an empty
   * form when adding a new one.
   *
   * `form.reset()` with no arguments cannot be used for this: react-hook-form treats
   * the values of the last `reset(values)` call as the new defaults, so after a
   * pre-fill it would restore the pre-filled values instead of clearing them.
   */
  function resetFormToInitialValues() {
    form.reset(
      initialData ?? {
        ...EMPTY_SELLER_FORM_VALUES,
        vatNoLabelText: defaultVatNoLabelText,
      },
    );
  }

  /**
   * Applies the pre-fill switch to the dialog form.
   *
   * Switch ON: fills the form with the values from the current invoice form, so the
   * invoice's seller can be saved as a new seller.
   * Switch OFF: clears the form back to the initial (or empty) seller.
   *
   * Leaves the form alone in edit mode, so the seller being edited is never overwritten.
   */
  function applyPrefillSwitch(newValue: boolean) {
    setShouldApplyInlineFormValues(newValue);

    if (isEditMode) {
      return;
    }

    // Switch is ON: pre-fill the form with the current invoice seller data
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
   * Closes the seller dialog and resets the form to its default state.
   */
  function closeDialog() {
    resetFormToInitialValues();

    // by default, we don't want to apply the inline form values to the dialog form
    setShouldApplyInlineFormValues(false);
    // by default, we want to apply the new seller to the current invoice
    setShouldApplyNewSellerToInvoice(true);

    onClose(false);
  }

  function onSubmit(formValues: SellerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing sellers or initialize empty array
      const sellers = getAppStorageItem(SELLERS_LOCAL_STORAGE_KEY);
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
        setAppStorageItem({
          key: SELLERS_LOCAL_STORAGE_KEY,
          value: JSON.stringify(validSellers),
        });
      }

      // we don't need to validate the name if we are editing an existing seller

      // Validate seller data against existing sellers
      const isDuplicateName = validSellers.some((seller: SellerData) => {
        return seller.name === formValues.name && seller.id !== formValues.id;
      });

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
          data-testid={`manage-seller-dialog`}
        >
          <DialogHeader className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <DialogTitle className="text-base">
              {isEditMode ? "Edit seller" : "New seller"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Changes apply to every invoice that uses this seller."
                : "Saved in this browser, ready to pick on any invoice."}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4">
            {/* Show Use Current Form Values switch only when creating new seller */}
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
                    Copies the seller you typed into the invoice. You can still
                    change it here.
                  </p>
                </div>
              </div>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                id={SELLER_FORM_ID}
              >
                <PartyDialogSection title="Business">
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
                              rows={2}
                              placeholder="Enter seller name"
                              className={getPartyFieldClassName({
                                isPrefilled: isPrefilled({
                                  name: "name",
                                  value: field.value,
                                }),
                              })}
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
                              rows={2}
                              placeholder="Enter seller address"
                              className={getPartyFieldClassName({
                                isPrefilled: isPrefilled({
                                  name: "address",
                                  value: field.value,
                                }),
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </PartyDialogSection>

                <PartyDialogSection
                  title="Tax number"
                  action={
                    <FormField
                      control={form.control}
                      name="vatNoFieldIsVisible"
                      render={({ field }) => {
                        return (
                          <PdfVisibilityToggle
                            id="vatNoFieldIsVisible"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            fieldLabel="Tax Number"
                          />
                        );
                      }}
                    />
                  }
                >
                  {/* a label of its own, so the PDF can say "VAT no", "Tax ID", ... */}
                  <fieldset
                    aria-label="Seller tax number"
                    className="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] gap-3"
                  >
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
                                placeholder="e.g. VAT no"
                                className={getPartyFieldClassName({
                                  isHidden: !isVatNoVisible,
                                  isPrefilled: isPrefilled({
                                    name: "vatNoLabelText",
                                    value: field.value,
                                  }),
                                })}
                              />
                            </FormControl>
                            <FormMessage />
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
                            <FormLabel>Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. PL1234567890"
                                className={getPartyFieldClassName({
                                  isHidden: !isVatNoVisible,
                                  isPrefilled: isPrefilled({
                                    name: "vatNo",
                                    value: field.value,
                                  }),
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </fieldset>
                </PartyDialogSection>

                <PartyDialogSection title="Contact &amp; payment">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Email</FormLabel>
                            <FormField
                              control={form.control}
                              name="emailFieldIsVisible"
                              render={({ field: visibilityField }) => {
                                return (
                                  <PdfVisibilityToggle
                                    id="emailFieldIsVisible"
                                    checked={visibilityField.value}
                                    onCheckedChange={visibilityField.onChange}
                                    fieldLabel="Email"
                                    data-testid="sellerEmailDialogFieldVisibilitySwitch"
                                  />
                                );
                              }}
                            />
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="seller@email.com"
                              className={getPartyFieldClassName({
                                isHidden: !isEmailVisible,
                                isPrefilled: isPrefilled({
                                  name: "email",
                                  value: field.value,
                                }),
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>Account Number</FormLabel>
                            <FormField
                              control={form.control}
                              name="accountNumberFieldIsVisible"
                              render={({ field: visibilityField }) => {
                                return (
                                  <PdfVisibilityToggle
                                    id="accountNumberFieldIsVisible"
                                    checked={visibilityField.value}
                                    onCheckedChange={visibilityField.onChange}
                                    fieldLabel="Account Number"
                                  />
                                );
                              }}
                            />
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Enter account number"
                              className={getPartyFieldClassName({
                                isHidden: !isAccountNumberVisible,
                                isPrefilled: isPrefilled({
                                  name: "accountNumber",
                                  value: field.value,
                                }),
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="swiftBic"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>SWIFT/BIC</FormLabel>
                            <FormField
                              control={form.control}
                              name="swiftBicFieldIsVisible"
                              render={({ field: visibilityField }) => {
                                return (
                                  <PdfVisibilityToggle
                                    id="swiftBicFieldIsVisible"
                                    checked={visibilityField.value}
                                    onCheckedChange={visibilityField.onChange}
                                    fieldLabel="SWIFT/BIC"
                                  />
                                );
                              }}
                            />
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Enter SWIFT/BIC code"
                              className={getPartyFieldClassName({
                                isHidden: !isSwiftBicVisible,
                                isPrefilled: isPrefilled({
                                  name: "swiftBic",
                                  value: field.value,
                                }),
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </PartyDialogSection>

                <PartyDialogSection
                  title="Notes"
                  action={
                    <FormField
                      control={form.control}
                      name="notesFieldIsVisible"
                      render={({ field }) => {
                        return (
                          <PdfVisibilityToggle
                            id="notes-field-visibility"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            fieldLabel="Notes"
                            data-testid="sellerNotesDialogFieldVisibilitySwitch"
                          />
                        );
                      }}
                    />
                  }
                >
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => {
                      return (
                        <FormItem>
                          {/* the section heading says it already */}
                          <FormLabel className="sr-only">Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={2}
                              placeholder="Enter notes (max 750 characters)"
                              maxLength={750}
                              className={getPartyFieldClassName({
                                isHidden: !isNotesVisible,
                                isPrefilled: isPrefilled({
                                  name: "notes",
                                  value: field.value,
                                }),
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </PartyDialogSection>
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
                    id="apply-seller-to-current-invoice-switch"
                    checked={shouldApplyNewSellerToInvoice}
                    onChange={(event) => {
                      setShouldApplyNewSellerToInvoice(event.target.checked);
                    }}
                    aria-describedby="apply-seller-to-current-invoice-description"
                    className="size-4 cursor-pointer accent-slate-900"
                  />

                  <Label
                    htmlFor="apply-seller-to-current-invoice-switch"
                    className="cursor-pointer font-normal"
                  >
                    Use on this invoice
                  </Label>
                </div>

                {/* says what Save will do with the current choice */}
                <p
                  id="apply-seller-to-current-invoice-description"
                  className="ml-6 mt-0.5 max-w-64 text-pretty text-xs text-slate-500"
                >
                  {shouldApplyNewSellerToInvoice
                    ? "Replaces the seller on this invoice with this one."
                    : "Only saved to your list. This invoice keeps its seller."}
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
                  // check if the form has unsaved changes and open the confirm discard dialog
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
                // we don't want to use type="submit" because it will cause unnecessary re-render of the invoice pdf preview
                type="button"
                onClick={async () => {
                  // trigger validations and submit the form
                  void form.handleSubmit(onSubmit)();
                }}
                form={SELLER_FORM_ID}
              >
                Save seller
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
        entityName="seller"
      />
    </>
  );
}

interface IsPrefilledOptions {
  name: keyof SellerData;
  value: unknown;
}
