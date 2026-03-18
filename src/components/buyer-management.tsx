import { Plus, Trash2, Pencil, AlertCircleIcon, InfoIcon } from "lucide-react";
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

/**
 * localStorage key for storing the list of saved buyers.
 * Used to persist buyer data across sessions.
 */
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

  // Prefill data for the dialog when saving a shared-link buyer (add mode, not edit mode)
  const [prefillData, setPrefillData] = useState<BuyerData | null>(null);

  // True when the invoice contains a buyer from a shared link that isn't in localStorage
  const [hasUnmatchedSharedBuyer, setHasUnmatchedSharedBuyer] = useState(false);

  const buyerSelectId = useId();

  const isEditMode = Boolean(editingBuyer);

  // Load buyers from localStorage on component mount
  useEffect(() => {
    try {
      const savedBuyers = localStorage.getItem(BUYERS_LOCAL_STORAGE_KEY);
      const parsedBuyers: unknown = savedBuyers ? JSON.parse(savedBuyers) : [];

      // Validate buyers array with Zod
      const buyersSchema = z.array(buyerSchema);
      const buyersValidationResult = buyersSchema.safeParse(parsedBuyers);

      if (!buyersValidationResult.success) {
        console.error("Invalid buyers data:", buyersValidationResult.error);
        return;
      }

      const buyers = buyersValidationResult.data;

      const invoiceBuyer = invoiceData?.buyer;

      // Check if the invoice's buyer already exists in localStorage by matching names.
      // We use name matching because buyer names must be unique in localStorage,
      // and this helps us identify if a shared-link buyer is already saved locally.
      const matchedBuyer = buyers.find((b) => b.name === invoiceBuyer?.name);

      // Check if the invoice has a buyer from a shared link that isn't saved locally
      const hasUnmatchedSharedBuyer = !matchedBuyer && invoiceBuyer?.id;

      // If the invoice has a buyer from a shared link that isn't saved locally,
      // flag it so we can show an info banner instead of silently auto-saving
      if (hasUnmatchedSharedBuyer) {
        setHasUnmatchedSharedBuyer(true);
      } else {
        setHasUnmatchedSharedBuyer(false);
      }

      // Update the buyers select options
      setBuyersSelectOptions(buyers);

      // Determine which buyer should be selected in the dropdown:
      // 1. If the invoice has a shared-link buyer that doesn't exist locally (hasUnmatchedSharedBuyer),
      //    set to empty string to force the user to explicitly choose or save it
      // 2. If we found a matching buyer in localStorage, select it
      // 3. Otherwise, auto-select the first buyer in the list (if any exist)
      // 4. If no buyers exist at all, set to empty string (no selection)
      // eslint-disable-next-line react-you-might-not-need-an-effect/you-might-not-need-an-effect
      setSelectedBuyerId(
        hasUnmatchedSharedBuyer
          ? "" // Force user to choose another buyer, save the shared buyer, or add a new buyer
          : (matchedBuyer?.id ?? buyers?.[0]?.id ?? ""),
      );
    } catch (error) {
      console.error("Failed to load buyers:", error);

      Sentry.captureException(error);
    }
  }, [invoiceData?.buyer, invoiceData?.buyer?.id, setSelectedBuyerId]);

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
        setHasUnmatchedSharedBuyer(false);
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
        setHasUnmatchedSharedBuyer(false);
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
        {hasUnmatchedSharedBuyer ? (
          <UnmatchedSharedBuyerInfoBanner
            invoiceData={invoiceData}
            setPrefillData={setPrefillData}
            setIsBuyerDialogOpen={setIsBuyerDialogOpen}
          />
        ) : null}

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
                {!selectedBuyerId && <option value="">— Select buyer —</option>}
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
        key={(editingBuyer ?? prefillData)?.id}
        isOpen={isBuyerDialogOpen}
        onClose={() => {
          setIsBuyerDialogOpen(false);
          setEditingBuyer(null);
          setPrefillData(null);
        }}
        handleBuyerAdd={handleBuyerAdd}
        handleBuyerEdit={handleBuyerEdit}
        initialData={editingBuyer ?? prefillData}
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

/**
 * UnmatchedSharedBuyerInfoBanner component is used to display a banner when the invoice contains a buyer from a shared link that isn't saved locally.
 * It allows the user to save the buyer to their local storage.
 */
function UnmatchedSharedBuyerInfoBanner({
  invoiceData,
  setPrefillData,
  setIsBuyerDialogOpen,
}: {
  invoiceData: InvoiceData;
  setPrefillData: (data: BuyerData) => void;
  setIsBuyerDialogOpen: (open: boolean) => void;
}) {
  return (
    <div
      className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-3 shadow-sm shadow-blue-200/50 duration-500 animate-in fade-in slide-in-from-bottom-2"
      data-testid="shared-buyer-info-banner"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
        <div className="flex-1 space-y-1">
          <p className="text-balance text-sm leading-snug text-blue-800">
            Buyer{" "}
            <span className="font-semibold">
              &quot;{invoiceData.buyer.name}&quot;
            </span>{" "}
            is from a shared invoice and isn&apos;t saved locally.
          </p>
          <p className="text-xs text-blue-600">
            Save it to reuse in future invoices.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => {
          toast.dismiss();
          setPrefillData(invoiceData.buyer);
          setIsBuyerDialogOpen(true);
        }}
      >
        <Plus className="mr-1 h-3 w-3" />
        Save Buyer
      </Button>
    </div>
  );
}
