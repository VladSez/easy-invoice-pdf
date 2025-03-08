"use client";

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
import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

const BUYER_FORM_ID = "buyer-form";

interface BuyerDialogProps {
  isOpen: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  handleBuyerAdd?: (
    buyer: BuyerData,
    { shouldApplyNewBuyerToInvoice }: { shouldApplyNewBuyerToInvoice: boolean }
  ) => void;
  handleBuyerEdit?: (buyer: BuyerData) => void;
  initialData: BuyerData | null;
  isEditMode: boolean;
}

export function BuyerDialog({
  isOpen,
  onClose,
  handleBuyerAdd,
  handleBuyerEdit,
  initialData,
  isEditMode,
}: BuyerDialogProps) {
  const form = useForm<BuyerData>({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      id: initialData?.id ?? "",
      name: initialData?.name ?? "",
      address: initialData?.address ?? "",
      vatNo: initialData?.vatNo ?? "",
      email: initialData?.email ?? "",
      vatNoFieldIsVisible: initialData?.vatNoFieldIsVisible ?? true,
    },
  });

  const [shouldApplyNewBuyerToInvoice, setShouldApplyNewBuyerToInvoice] =
    useState(false);

  function onSubmit(formValues: BuyerData) {
    try {
      // **RUNNING SOME VALIDATIONS FIRST**

      // Get existing buyers or initialize empty array
      const buyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
      const existingBuyers = buyers ? JSON.parse(buyers) : [];

      // Validate existing buyers array with Zod
      const existingBuyersValidationResult = z
        .array(buyerSchema)
        .safeParse(existingBuyers);

      if (!existingBuyersValidationResult.success) {
        console.error(
          "Invalid existing buyers data:",
          existingBuyersValidationResult.error
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
      const isDuplicateName = existingBuyers.some(
        (buyer: BuyerData) =>
          buyer.name === formValues.name && buyer.id !== formValues.id
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
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

              {/* VAT Number */}
              <div className="space-y-4">
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
              </div>
            </form>
          </Form>

          {/* Apply new buyer to current invoice switch */}
          {!isEditMode ? (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={shouldApplyNewBuyerToInvoice}
                  onCheckedChange={setShouldApplyNewBuyerToInvoice}
                  id="apply-buyer-to-current-invoice-switch"
                />
                <Label htmlFor="apply-buyer-to-current-invoice-switch">
                  Apply Buyer to current invoice
                </Label>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter className="border-border border-t px-6 py-4">
          <DialogClose asChild>
            <Button type="button" _variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={async () => {
              // validate the form
              const isValid = await form.trigger();
              if (!isValid) return;

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
