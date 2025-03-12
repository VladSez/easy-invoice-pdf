"use client";

import { Plus, Trash2, Pencil } from "lucide-react";
import { useId, useState, useEffect } from "react";
import { CustomTooltip } from "./ui/tooltip";
import { SelectNative } from "./ui/select-native";
import { Button } from "./ui/button";
import { BuyerDialog } from "./buyer-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import type { UseFormSetValue } from "react-hook-form";
import {
  DEFAULT_BUYER_DATA,
  buyerSchema,
  type InvoiceData,
  type BuyerData,
} from "@/app/schema";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { useOpenPanel } from "@openpanel/nextjs";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";

export const BUYERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_BUYERS";

interface BuyerManagementProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  selectedBuyerId: string;
  setSelectedBuyerId: (id: string) => void;
  formValues?: Partial<BuyerData>;
}

export function BuyerManagement({
  setValue,
  invoiceData,
  selectedBuyerId,
  setSelectedBuyerId,
  formValues,
}: BuyerManagementProps) {
  const [isBuyerDialogOpen, setIsBuyerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [buyersSelectOptions, setBuyersSelectOptions] = useState<BuyerData[]>(
    []
  );
  // const [selectedBuyerId, setSelectedBuyerId] = useState("");
  const [editingBuyer, setEditingBuyer] = useState<BuyerData | null>(null);

  const openPanel = useOpenPanel();
  const buyerSelectId = useId();

  const isEditMode = Boolean(editingBuyer);

  // Load buyers from localStorage on component mount
  useEffect(() => {
    try {
      const savedBuyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
      const parsedBuyers = savedBuyers ? JSON.parse(savedBuyers) : [];

      // Validate buyers array with Zod
      const buyersSchema = z.array(buyerSchema);
      const validationResult = buyersSchema.safeParse(parsedBuyers);

      if (!validationResult.success) {
        console.error("Invalid buyers data:", validationResult.error);
        return;
      }

      const selectedBuyer = validationResult.data.find((buyer: BuyerData) => {
        return buyer?.id === invoiceData?.buyer?.id;
      });

      setBuyersSelectOptions(validationResult.data);
      setSelectedBuyerId(selectedBuyer?.id ?? "");
    } catch (error) {
      console.error("Failed to load buyers:", error);

      Sentry.captureException(error);
    }
  }, [invoiceData?.buyer?.id, setSelectedBuyerId]);

  // Update buyers when a new one is added
  const handleBuyerAdd = (
    newBuyer: BuyerData,
    { shouldApplyNewBuyerToInvoice }: { shouldApplyNewBuyerToInvoice: boolean }
  ) => {
    try {
      const newBuyerWithId = {
        ...newBuyer,
        // Generate a unique ID for the new buyer (IMPORTANT!) =)
        id: Date.now().toString(),
      };

      const newBuyers = [...buyersSelectOptions, newBuyerWithId];

      // Save to localStorage
      localStorage.setItem(BUYERS_LOCAL_STORAGE_KEY, JSON.stringify(newBuyers));

      // Update the buyers state
      setBuyersSelectOptions(newBuyers);

      // Apply the new buyer to the invoice if the user wants to, otherwise just add it to the list and use it later if needed
      if (shouldApplyNewBuyerToInvoice) {
        setValue("buyer", newBuyerWithId);
        setSelectedBuyerId(newBuyerWithId?.id);
      }

      toast.success("Buyer added successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("add_buyer_success");
      umamiTrackEvent("add_buyer_success");
    } catch (error) {
      console.error("Failed to add buyer:", error);

      toast.error("Failed to add buyer", {
        closeButton: true,
      });

      Sentry.captureException(error);
    }
  };

  // Update buyers when edited
  const handleBuyerEdit = (editedBuyer: BuyerData) => {
    try {
      const updatedBuyers = buyersSelectOptions.map((buyer) =>
        buyer.id === editedBuyer.id ? editedBuyer : buyer
      );

      localStorage.setItem(
        BUYERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedBuyers)
      );

      setBuyersSelectOptions(updatedBuyers);
      setValue("buyer", editedBuyer);

      // end edit mode
      setEditingBuyer(null);

      toast.success("Buyer updated successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("edit_buyer_success");
      umamiTrackEvent("edit_buyer_success");
    } catch (error) {
      console.error("Failed to edit buyer:", error);

      toast.error("Failed to edit buyer", {
        closeButton: true,
      });

      Sentry.captureException(error);
    }
  };

  const handleBuyerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;

    if (id) {
      setSelectedBuyerId(id);
      const selectedBuyer = buyersSelectOptions.find(
        (buyer) => buyer.id === id
      );

      if (selectedBuyer) {
        setValue("buyer", selectedBuyer);
      }
    } else {
      // Clear the buyer from the form if the user selects the empty option
      setSelectedBuyerId("");
      setValue("buyer", DEFAULT_BUYER_DATA);
    }

    // analytics track event
    openPanel.track("change_buyer");
    umamiTrackEvent("change_buyer");
  };

  const handleDeleteBuyer = () => {
    try {
      setBuyersSelectOptions((prevBuyers) => {
        const updatedBuyers = prevBuyers.filter(
          (buyer) => buyer.id !== selectedBuyerId
        );

        localStorage.setItem(
          BUYERS_LOCAL_STORAGE_KEY,
          JSON.stringify(updatedBuyers)
        );
        return updatedBuyers;
      });
      // Clear the selected buyer index
      setSelectedBuyerId("");
      // Clear the buyer from the form if it was selected
      setValue("buyer", DEFAULT_BUYER_DATA);

      // Close the delete dialog
      setIsDeleteDialogOpen(false);

      toast.success("Buyer deleted successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("delete_buyer_success");
      umamiTrackEvent("delete_buyer_success");
    } catch (error) {
      console.error("Failed to delete buyer:", error);

      toast.error("Failed to delete buyer", {
        closeButton: true,
      });

      Sentry.captureException(error);
    }
  };

  const activeBuyer = buyersSelectOptions.find(
    (buyer) => buyer.id === selectedBuyerId
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        {buyersSelectOptions.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor={buyerSelectId} className="">
                Select Buyer
              </Label>
            </div>
            <div className="flex gap-2">
              <SelectNative
                id={buyerSelectId}
                className={cn(
                  "block h-8 max-w-[200px] text-[12px]",
                  !selectedBuyerId && "italic text-gray-700"
                )}
                onChange={handleBuyerChange}
                value={selectedBuyerId}
                title={activeBuyer?.name}
              >
                <option value="">No buyer selected (default)</option>
                {buyersSelectOptions.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.name}
                  </option>
                ))}
              </SelectNative>

              {selectedBuyerId ? (
                <div className="flex items-center gap-2">
                  <CustomTooltip
                    trigger={
                      <Button
                        _variant="outline"
                        _size="sm"
                        onClick={() => {
                          if (activeBuyer) {
                            // dismiss any existing toast for better UX
                            toast.dismiss();

                            setEditingBuyer(activeBuyer);
                            setIsBuyerDialogOpen(true);
                          }
                        }}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    }
                    content="Edit buyer"
                  />
                  <CustomTooltip
                    trigger={
                      <Button
                        _variant="destructive"
                        _size="sm"
                        onClick={() => {
                          // dismiss any existing toast for better UX
                          toast.dismiss();

                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                    content="Delete buyer"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <CustomTooltip
          trigger={
            <Button
              _variant="outline"
              _size="sm"
              onClick={() => {
                if (isLocalStorageAvailable) {
                  // dismiss any existing toast for better UX
                  toast.dismiss();

                  // open buyer dialog
                  setIsBuyerDialogOpen(true);
                }
              }}
              aria-disabled={!isLocalStorageAvailable}
              className={cn(
                !isLocalStorageAvailable && "cursor-not-allowed opacity-40"
              )}
            >
              New Buyer
              <Plus className="ml-1 h-3 w-3" />
            </Button>
          }
          content={
            isLocalStorageAvailable
              ? "You can save multiple buyers to use them later"
              : "Local storage is not available in your browser. Please enable it or try another browser"
          }
        />
      </div>

      <BuyerDialog
        // we need to rerender the dialog when the editingBuyer changes
        key={editingBuyer?.id}
        isOpen={isBuyerDialogOpen}
        onClose={() => {
          setIsBuyerDialogOpen(false);
          setEditingBuyer(null);
        }}
        handleBuyerAdd={handleBuyerAdd}
        handleBuyerEdit={handleBuyerEdit}
        initialData={editingBuyer}
        isEditMode={isEditMode}
        formValues={formValues}
      />

      {/* Delete alert buyer dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">&quot;{activeBuyer?.name}&quot;</span>{" "}
              buyer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBuyer}
              className="bg-red-500 text-red-50 hover:bg-red-500/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
