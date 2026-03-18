import { Plus, Trash2, Pencil, AlertCircleIcon, InfoIcon } from "lucide-react";

import {
  useId,
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";
import { CustomTooltip } from "./ui/tooltip";
import { SelectNative } from "./ui/select-native";
import { Button } from "./ui/button";
import { SellerDialog } from "./seller-dialog";
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
import { sellerSchema, type InvoiceData, type SellerData } from "@/app/schema";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";
import { DEFAULT_SELLER_DATA } from "@/app/constants";

/**
 * localStorage key for storing the list of saved sellers.
 * Used to persist seller data across sessions.
 */
export const SELLERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_SELLERS";

interface SellerManagementProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  selectedSellerId: string;
  setSelectedSellerId: Dispatch<SetStateAction<string>>;
  isMobile: boolean;
}

/**
 * SellerManagement component allows users to select, add, edit, and delete sellers for invoices.
 * Handles seller state management, selection, and persistence to localStorage.
 */
export function SellerManagement({
  setValue,
  invoiceData,
  selectedSellerId,
  setSelectedSellerId,
  isMobile,
}: SellerManagementProps) {
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State to store the list of saved sellers for the dropdown selection.
  const [sellersSelectOptions, setSellersSelectOptions] = useState<
    SellerData[]
  >([]);

  // State to track the seller currently being edited (null if not editing).
  const [editingSeller, setEditingSeller] = useState<SellerData | null>(null);

  // Prefill data for the dialog when saving a shared-link seller (add mode, not edit mode)
  const [prefillData, setPrefillData] = useState<SellerData | null>(null);

  // True when the invoice contains a seller from a shared link that isn't in localStorage
  const [hasUnmatchedSharedSeller, setHasUnmatchedSharedSeller] =
    useState(false);

  const sellerSelectId = useId();

  const isEditMode = Boolean(editingSeller);

  // Load sellers from localStorage on component mount
  useEffect(() => {
    try {
      const savedSellers = localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY);
      const parsedSellers: unknown = savedSellers
        ? JSON.parse(savedSellers)
        : [];

      // Validate sellers array with Zod
      const sellersSchema = z.array(sellerSchema);
      const sellersValidationResult = sellersSchema.safeParse(parsedSellers);

      if (!sellersValidationResult.success) {
        console.error("Invalid sellers data:", sellersValidationResult.error);
        return;
      }

      // at this point, there are validated sellers from localStorage
      const sellers = sellersValidationResult.data;

      const invoiceSeller = invoiceData?.seller;

      // Match by name (we don't allow to save sellers with the same name)
      const matchedSeller = sellers.find((s) => s.name === invoiceSeller?.name);

      // Check if the invoice has a seller from a shared link that isn't saved locally
      const hasUnmatchedSharedSeller = !matchedSeller && invoiceSeller?.id;

      // If the invoice has a seller from a shared link that isn't saved locally,
      // flag it so we can show an info banner instead of silently auto-saving
      if (hasUnmatchedSharedSeller) {
        setHasUnmatchedSharedSeller(true);
      } else {
        setHasUnmatchedSharedSeller(false);
      }

      // Update the sellers select options
      setSellersSelectOptions(sellers);

      // Determine which seller should be selected in the dropdown:
      // 1. If the invoice has a shared-link seller that doesn't exist locally (hasUnmatchedSharedSeller),
      //    set to empty string to force the user to explicitly choose or save it
      // 2. If we found a matching seller in localStorage, select it
      // 3. Otherwise, auto-select the first seller in the list (if any exist)
      // 4. If no sellers exist at all, set to empty string (no selection)
      // eslint-disable-next-line react-you-might-not-need-an-effect/you-might-not-need-an-effect
      setSelectedSellerId(
        hasUnmatchedSharedSeller
          ? "" // Force user to choose another seller, save the shared seller, or add a new seller
          : (matchedSeller?.id ?? sellers?.[0]?.id ?? ""),
      );
    } catch (error) {
      console.error("Failed to load sellers:", error);

      Sentry.captureException(error);
    }
  }, [invoiceData?.seller, invoiceData?.seller?.id, setSelectedSellerId]);

  // Update sellers when a new one is added
  const handleSellerAdd = (
    newSeller: SellerData,
    {
      shouldApplyNewSellerToInvoice,
    }: { shouldApplyNewSellerToInvoice: boolean },
  ) => {
    try {
      const newSellerWithId = {
        ...newSeller,
        // Generate a unique ID for the new seller (IMPORTANT!) =)
        id: Date.now().toString(),
      } satisfies SellerData;

      const newSellers = [...sellersSelectOptions, newSellerWithId];

      // Save to localStorage
      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        JSON.stringify(newSellers),
      );

      // Update the sellers state
      setSellersSelectOptions(newSellers);

      // Apply the new seller to the invoice if the user wants to, otherwise just add it to the list and use it later if needed
      if (shouldApplyNewSellerToInvoice) {
        setValue("seller", newSellerWithId);
        setSelectedSellerId(newSellerWithId?.id);
        setHasUnmatchedSharedSeller(false);
      }

      toast.success(
        shouldApplyNewSellerToInvoice
          ? "Seller added and applied to invoice"
          : "Seller added successfully",
        {
          id: "add_seller_success_toast",
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        },
      );

      // analytics track event
      umamiTrackEvent("add_seller_success");
    } catch (error) {
      console.error("Failed to add seller:", error);

      toast.error("Failed to add seller", {
        id: "add_seller_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  // Update sellers when edited
  const handleSellerEdit = (editedSeller: SellerData) => {
    try {
      const updatedSellers = sellersSelectOptions.map((seller) =>
        seller.id === editedSeller.id ? editedSeller : seller,
      );

      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedSellers),
      );

      setSellersSelectOptions(updatedSellers);
      setValue("seller", editedSeller);

      // end edit mode
      setEditingSeller(null);

      toast.success("Seller updated successfully", {
        id: "edit_seller_success_toast",
        richColors: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      // analytics track event
      umamiTrackEvent("edit_seller_success");
    } catch (error) {
      console.error("Failed to edit seller:", error);

      toast.error("Failed to edit seller", {
        id: "edit_seller_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  const handleSellerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;

    if (id) {
      setSelectedSellerId(id);
      const selectedSeller = sellersSelectOptions.find(
        (seller) => seller.id === id,
      );

      if (selectedSeller) {
        setValue("seller", selectedSeller);
        setHasUnmatchedSharedSeller(false);
        toast.success(`Seller "${selectedSeller.name}" applied to invoice`, {
          id: "change_seller_success_toast",
          richColors: true,
          position: isMobile ? "top-center" : "bottom-right",
        });
      }
    }

    // analytics track event
    umamiTrackEvent("change_seller");
  };

  const handleDeleteSeller = () => {
    try {
      const updatedSellers = sellersSelectOptions.filter(
        (seller) => seller.id !== selectedSellerId,
      );

      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedSellers),
      );
      setSellersSelectOptions(updatedSellers);

      const nextSeller = updatedSellers?.[0];

      // If there is another seller available after deletion, select it and update the form value
      if (nextSeller?.id) {
        setSelectedSellerId(nextSeller.id);
        setValue("seller", nextSeller);
      } else {
        // If no sellers remain, reset the selectedSellerId and set the form to default seller data
        setSelectedSellerId("");
        setValue("seller", DEFAULT_SELLER_DATA);
      }

      // Close the delete dialog
      setIsDeleteDialogOpen(false);

      toast.success("Seller deleted successfully", {
        id: "delete_seller_success_toast",
        richColors: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      // analytics track event
      umamiTrackEvent("delete_seller_success");
    } catch (error) {
      console.error("Failed to delete seller:", error);

      toast.error("Failed to delete seller", {
        id: "delete_seller_error_toast",
        description: "Please try again",
        closeButton: true,
        position: isMobile ? "top-center" : "bottom-right",
      });

      Sentry.captureException(error);
    }
  };

  const activeSeller = sellersSelectOptions.find(
    (seller) => seller.id === selectedSellerId,
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        {hasUnmatchedSharedSeller ? (
          <UnmatchedSharedSellerInfoBanner
            invoiceData={invoiceData}
            setPrefillData={setPrefillData}
            setIsSellerDialogOpen={setIsSellerDialogOpen}
          />
        ) : null}

        {sellersSelectOptions.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor={sellerSelectId} className="">
                Select Seller
              </Label>
            </div>
            <div className="flex gap-2">
              <SelectNative
                id={sellerSelectId}
                className="block h-8 min-w-0 flex-1 text-[12px]"
                onChange={handleSellerChange}
                value={selectedSellerId}
                title={activeSeller?.name}
              >
                {!selectedSellerId && (
                  <option value="">— Select seller —</option>
                )}
                {sellersSelectOptions.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </SelectNative>

              {selectedSellerId ? (
                <div className="flex items-center gap-2">
                  <CustomTooltip
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (activeSeller) {
                            // dismiss any existing toast for better UX
                            toast.dismiss();

                            setEditingSeller(activeSeller);
                            setIsSellerDialogOpen(true);
                          }
                        }}
                        className="h-8 px-2"
                      >
                        <span className="sr-only">Edit seller</span>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    }
                    content="Edit seller"
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
                        <span className="sr-only">Delete seller</span>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    }
                    content="Delete seller"
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

                  // open seller dialog
                  setIsSellerDialogOpen(true);
                } else {
                  toast.error("Unable to add seller", {
                    id: "unable-to-add-seller-error-toast",
                    closeButton: true,
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
              New Seller
              <Plus className="ml-1 size-3" />
            </Button>
          }
          content={
            isLocalStorageAvailable ? (
              <div className="flex items-center gap-3 p-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    Save Sellers for Quick Access
                  </p>
                  <p className="text-pretty text-xs leading-relaxed text-slate-700">
                    Store multiple sellers to easily reuse their information in
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
                    enable it or try another browser to save seller information.
                  </p>
                </div>
              </div>
            )
          }
        />
      </div>

      <SellerDialog
        key={(editingSeller ?? prefillData)?.id}
        isOpen={isSellerDialogOpen}
        onClose={() => {
          setIsSellerDialogOpen(false);
          setEditingSeller(null);
          setPrefillData(null);
        }}
        handleSellerAdd={handleSellerAdd}
        handleSellerEdit={handleSellerEdit}
        initialData={editingSeller ?? prefillData}
        isEditMode={isEditMode}
        isFirstEntry={sellersSelectOptions?.length === 0}
      />

      {/* Delete alert seller dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Seller</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold">
                &quot;{activeSeller?.name}&quot;
              </span>{" "}
              seller? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSeller}
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
 * UnmatchedSharedSellerInfoBanner component is used to display a banner when the invoice contains a seller from a shared link that isn't saved locally.
 * It allows the user to save the seller to their local storage.
 */
function UnmatchedSharedSellerInfoBanner({
  invoiceData,
  setPrefillData,
  setIsSellerDialogOpen,
}: {
  invoiceData: InvoiceData;
  setPrefillData: (data: SellerData) => void;
  setIsSellerDialogOpen: (open: boolean) => void;
}) {
  return (
    <div
      className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-3 shadow-sm shadow-blue-200/50 duration-500 animate-in fade-in slide-in-from-bottom-2"
      data-testid="shared-seller-info-banner"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-blue-600" />
        <div className="flex-1 space-y-1">
          <p className="text-balance text-sm leading-snug text-blue-800">
            Seller{" "}
            <span className="font-semibold">
              &quot;{invoiceData.seller.name}&quot;
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
          setPrefillData(invoiceData.seller);
          setIsSellerDialogOpen(true);
        }}
      >
        <Plus className="mr-1 h-3 w-3" />
        Save Seller
      </Button>
    </div>
  );
}
