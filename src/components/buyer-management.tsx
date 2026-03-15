import { Plus, Trash2, Pencil, AlertCircleIcon } from "lucide-react";
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
import { buyerSchema, type InvoiceData, type BuyerData } from "@/app/schema";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import { DEFAULT_BUYER_DATA } from "@/app/constants";

export const BUYERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_BUYERS";

interface BuyerManagementProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  selectedBuyerId: string;
  setSelectedBuyerId: (id: string) => void;
  isMobile: boolean;
}

/**
 * BuyerManagement component allows users to select, add, edit, and delete buyers for invoices.
 * Handles buyer state management, selection, and persistence to localStorage.
 */
export function BuyerManagement({
  setValue,
  invoiceData,
  selectedBuyerId,
  setSelectedBuyerId,
  isMobile,
}: BuyerManagementProps) {
  const [isBuyerDialogOpen, setIsBuyerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State to store the list of saved buyers for the dropdown selection.
  const [buyersSelectOptions, setBuyersSelectOptions] = useState<BuyerData[]>(
    [],
  );

  // State to track the buyer currently being edited (null if not editing).
  const [editingBuyer, setEditingBuyer] = useState<BuyerData | null>(null);

  const buyerSelectId = useId();

  const isEditMode = Boolean(editingBuyer);

  // Load buyers from localStorage on component mount
  useEffect(() => {
    try {
      const savedBuyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
      const parsedBuyers: unknown = savedBuyers ? JSON.parse(savedBuyers) : [];

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

      // Populate the buyers dropdown with the valid buyers loaded from localStorage
      setBuyersSelectOptions(validationResult.data);

      // If a buyer on the invoice matches one from storage, select it.
      // Otherwise default to the first buyer in the list, or blank if none.
      setSelectedBuyerId(
        selectedBuyer?.id ?? validationResult.data[0]?.id ?? "",
      );
    } catch (error) {
      console.error("Failed to load buyers:", error);

      Sentry.captureException(error);
    }
  }, [invoiceData?.buyer?.id, setSelectedBuyerId]);

  // Update buyers when a new one is added
  const handleBuyerAdd = (
    newBuyer: BuyerData,
    { shouldApplyNewBuyerToInvoice }: { shouldApplyNewBuyerToInvoice: boolean },
  ) => {
    try {
      const newBuyerWithId = {
        ...newBuyer,
        // Generate a unique ID for the new buyer (IMPORTANT!) =)
        id: Date.now().toString(),
      } satisfies BuyerData;

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

      toast.success(
        shouldApplyNewBuyerToInvoice
          ? "Buyer added and applied to invoice"
          : "Buyer added successfully",
        {
          id: "add_buyer_success_toast",
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        },
      );

      // analytics track event
      umamiTrackEvent("add_buyer_success");
    } catch (error) {
      console.error("Failed to add buyer:", error);

      toast.error("Failed to add buyer", {
        id: "add_buyer_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  // Update buyers when edited
  const handleBuyerEdit = (editedBuyer: BuyerData) => {
    try {
      const updatedBuyers = buyersSelectOptions.map((buyer) =>
        buyer.id === editedBuyer.id ? editedBuyer : buyer,
      );

      localStorage.setItem(
        BUYERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedBuyers),
      );

      setBuyersSelectOptions(updatedBuyers);
      setValue("buyer", editedBuyer);

      // end edit mode
      setEditingBuyer(null);

      toast.success("Buyer updated successfully", {
        id: "edit_buyer_success_toast",
        richColors: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      // analytics track event
      umamiTrackEvent("edit_buyer_success");
    } catch (error) {
      console.error("Failed to edit buyer:", error);

      toast.error("Failed to edit buyer", {
        id: "edit_buyer_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  const handleBuyerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;

    if (id) {
      setSelectedBuyerId(id);
      const selectedBuyer = buyersSelectOptions.find(
        (buyer) => buyer.id === id,
      );

      if (selectedBuyer) {
        setValue("buyer", selectedBuyer);
        toast.success(`Buyer "${selectedBuyer.name}" applied to invoice`, {
          id: "change_buyer_success_toast",
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        });
      }
    }

    // analytics track event
    umamiTrackEvent("change_buyer");
  };

  const handleDeleteBuyer = () => {
    try {
      const updatedBuyers = buyersSelectOptions.filter(
        (buyer) => buyer.id !== selectedBuyerId,
      );

      localStorage.setItem(
        BUYERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedBuyers),
      );
      setBuyersSelectOptions(updatedBuyers);

      // After deleting a buyer, pick the first buyer in the updated list (if any).
      // If a buyer exists, select them and update the form value;
      // otherwise, clear the selection and reset to default data.
      const nextBuyer = updatedBuyers?.[0];

      // If there is a next buyer available after deletion,
      // update selection to that buyer and set the form value accordingly.
      if (nextBuyer?.id) {
        setSelectedBuyerId(nextBuyer.id);
        setValue("buyer", nextBuyer);
      } else {
        // If no buyers are left, clear selection and reset to default buyer data.
        setSelectedBuyerId("");
        setValue("buyer", DEFAULT_BUYER_DATA);
      }

      // Close the delete dialog
      setIsDeleteDialogOpen(false);

      toast.success("Buyer deleted successfully", {
        id: "delete_buyer_success_toast",
        richColors: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      // analytics track event
      umamiTrackEvent("delete_buyer_success");
    } catch (error) {
      console.error("Failed to delete buyer:", error);

      toast.error("Failed to delete buyer", {
        id: "delete_buyer_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  const activeBuyer = buyersSelectOptions.find(
    (buyer) => buyer.id === selectedBuyerId,
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
                className="block h-8 min-w-0 flex-1 text-[12px]"
                onChange={handleBuyerChange}
                value={selectedBuyerId}
                title={activeBuyer?.name}
              >
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
                        variant="outline"
                        size="sm"
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
                        <span className="sr-only">Edit buyer</span>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    }
                    content="Edit buyer"
                  />
                  <CustomTooltip
                    trigger={
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          // dismiss any existing toast for better UX
                          toast.dismiss();

                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 px-2"
                      >
                        <span className="sr-only">Delete buyer</span>
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
          className={cn(!isLocalStorageAvailable && "bg-red-50")}
          trigger={
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (isLocalStorageAvailable) {
                  // dismiss any existing toast for better UX
                  toast.dismiss();

                  // open buyer dialog
                  setIsBuyerDialogOpen(true);
                } else {
                  toast.error("Unable to add buyer", {
                    id: "unable-to-add-buyer-error-toast",
                    description: (
                      <>
                        <p className="text-pretty text-xs leading-relaxed text-red-700">
                          Local storage is not available in your browser. Please
                          enable it or try another browser.
                        </p>
                      </>
                    ),
                    position: isMobile ? "top-center" : "bottom-right",
                  });
                }
              }}
              aria-disabled={!isLocalStorageAvailable} // better UX than 'disabled'
            >
              New Buyer
              <Plus className="ml-1 size-3" />
            </Button>
          }
          content={
            isLocalStorageAvailable ? (
              <div className="flex items-center gap-3 p-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Save Buyers for Quick Access
                  </p>
                  <p className="text-pretty text-xs leading-relaxed text-slate-700">
                    Store multiple buyers to easily reuse their information in
                    future invoices. All data is saved locally in your browser.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-red-50 p-3">
                <AlertCircleIcon className="h-5 w-5 flex-shrink-0 fill-red-600 text-white" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-red-800">
                    Storage Not Available
                  </p>
                  <p className="text-pretty text-xs leading-relaxed text-red-700">
                    Local storage is not available in your browser. Please
                    enable it or try another browser to save buyer information.
                  </p>
                </div>
              </div>
            )
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
        isFirstEntry={buyersSelectOptions?.length === 0}
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
