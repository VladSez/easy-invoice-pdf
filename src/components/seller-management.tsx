import { Plus, Trash2, Pencil } from "lucide-react";

// import { Info } from "lucide-react";
import { useId, useState, useEffect } from "react";
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
import {
  DEFAULT_SELLER_DATA,
  sellerSchema,
  type InvoiceData,
  type SellerData,
} from "@/app/schema";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { useOpenPanel } from "@openpanel/nextjs";
import { isLocalStorageAvailable } from "@/lib/check-local-storage";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";
import * as Sentry from "@sentry/nextjs";

export const SELLERS_LOCAL_STORAGE_KEY = "EASY_INVOICE_PDF_SELLERS";

export function SellerManagement({
  setValue,
  invoiceData,
}: {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
}) {
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [sellersSelectOptions, setSellersSelectOptions] = useState<
    SellerData[]
  >([]);
  const [selectedSellerIndex, setSelectedSellerIndex] = useState("");
  const [editingSeller, setEditingSeller] = useState<SellerData | null>(null);

  const openPanel = useOpenPanel();
  const sellerSelectId = useId();

  const isEditMode = Boolean(editingSeller);

  // Load sellers from localStorage on component mount
  useEffect(() => {
    try {
      const savedSellers = localStorage.getItem(SELLERS_LOCAL_STORAGE_KEY);
      const parsedSellers = savedSellers ? JSON.parse(savedSellers) : [];

      // Validate sellers array with Zod
      const sellersSchema = z.array(sellerSchema);
      const validationResult = sellersSchema.safeParse(parsedSellers);

      if (!validationResult.success) {
        console.error("Invalid sellers data:", validationResult.error);
        return;
      }

      const selectedSeller = validationResult.data.find(
        (seller: SellerData) => {
          return seller?.id === invoiceData?.seller?.id;
        }
      );

      setSellersSelectOptions(validationResult.data);
      setSelectedSellerIndex(selectedSeller?.id ?? "");
    } catch (error) {
      console.error("Failed to load sellers:", error);

      Sentry.captureException(error);
    }
  }, [invoiceData?.seller?.id]);

  // Update sellers when a new one is added
  const handleSellerAdd = (
    newSeller: SellerData,
    {
      shouldApplyNewSellerToInvoice,
    }: { shouldApplyNewSellerToInvoice: boolean }
  ) => {
    try {
      const newSellerWithId = {
        ...newSeller,
        // Generate a unique ID for the new seller (IMPORTANT!) =)
        id: Date.now().toString(),
      };

      const newSellers = [...sellersSelectOptions, newSellerWithId];

      // Save to localStorage
      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        JSON.stringify(newSellers)
      );

      // Update the sellers state
      setSellersSelectOptions(newSellers);

      // Apply the new seller to the invoice if the user wants to, otherwise just add it to the list and use it later if needed
      if (shouldApplyNewSellerToInvoice) {
        setValue("seller", newSellerWithId);
        setSelectedSellerIndex(newSellerWithId?.id);
      }

      toast.success("Seller added successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("add_seller_success");
      umamiTrackEvent("add_seller_success");
    } catch (error) {
      console.error("Failed to add seller:", error);

      toast.error("Failed to add seller", {
        closeButton: true,
      });

      log.error("add_seller_failed", {
        data: {
          error: error,
        },
      });

      Sentry.captureException(error);
    }
  };

  // Update sellers when edited
  const handleSellerEdit = (editedSeller: SellerData) => {
    try {
      const updatedSellers = sellersSelectOptions.map((seller) =>
        seller.id === editedSeller.id ? editedSeller : seller
      );

      localStorage.setItem(
        SELLERS_LOCAL_STORAGE_KEY,
        JSON.stringify(updatedSellers)
      );

      setSellersSelectOptions(updatedSellers);
      setValue("seller", editedSeller);

      // end edit mode
      setEditingSeller(null);

      toast.success("Seller updated successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("edit_seller_success");
      umamiTrackEvent("edit_seller_success");
    } catch (error) {
      console.error("Failed to edit seller:", error);

      toast.error("Failed to edit seller", {
        closeButton: true,
      });

      log.error("edit_seller_failed", {
        data: {
          error: error,
        },
      });

      Sentry.captureException(error);
    }
  };

  const handleSellerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = event.target.value;

    if (id) {
      setSelectedSellerIndex(id);
      const selectedSeller = sellersSelectOptions.find(
        (seller) => seller.id === id
      );

      if (selectedSeller) {
        setValue("seller", selectedSeller);
      }
    } else {
      // Clear the seller from the form if the user selects the empty option
      setSelectedSellerIndex("");
      setValue("seller", DEFAULT_SELLER_DATA);
    }

    // analytics track event
    openPanel.track("change_seller");
    umamiTrackEvent("change_seller");
  };

  const handleDeleteSeller = () => {
    try {
      setSellersSelectOptions((prevSellers) => {
        const updatedSellers = prevSellers.filter(
          (seller) => seller.id !== selectedSellerIndex
        );

        localStorage.setItem(
          SELLERS_LOCAL_STORAGE_KEY,
          JSON.stringify(updatedSellers)
        );
        return updatedSellers;
      });
      // Clear the selected seller index
      setSelectedSellerIndex("");
      // Clear the seller from the form if it was selected
      setValue("seller", DEFAULT_SELLER_DATA);

      // Close the delete dialog
      setIsDeleteDialogOpen(false);

      toast.success("Seller deleted successfully", {
        richColors: true,
      });

      // analytics track event
      openPanel.track("delete_seller_success");
      umamiTrackEvent("delete_seller_success");
    } catch (error) {
      console.error("Failed to delete seller:", error);

      toast.error("Failed to delete seller", {
        closeButton: true,
      });

      log.error("delete_seller_failed", {
        data: {
          error: error,
        },
      });

      Sentry.captureException(error);
    }
  };

  const activeSeller = sellersSelectOptions.find(
    (seller) => seller.id === selectedSellerIndex
  );

  return (
    <>
      <div className="flex flex-col gap-2">
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
                className={cn(
                  "block h-8 max-w-[200px] text-[12px]",
                  !selectedSellerIndex && "italic text-gray-700"
                )}
                onChange={handleSellerChange}
                value={selectedSellerIndex}
                title={activeSeller?.name}
              >
                <option value="">No seller selected (default)</option>
                {sellersSelectOptions.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </SelectNative>

              {selectedSellerIndex ? (
                <div className="flex items-center gap-2">
                  <CustomTooltip
                    trigger={
                      <Button
                        _variant="outline"
                        _size="sm"
                        onClick={() => {
                          if (activeSeller) {
                            setEditingSeller(activeSeller);
                            setIsSellerDialogOpen(true);
                          }
                        }}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    }
                    content="Edit seller"
                  />
                  <CustomTooltip
                    trigger={
                      <Button
                        _variant="destructive"
                        _size="sm"
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 px-2"
                      >
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
          trigger={
            <Button
              _variant="outline"
              _size="sm"
              onClick={() => {
                if (isLocalStorageAvailable) {
                  setIsSellerDialogOpen(true);
                }
              }}
              aria-disabled={!isLocalStorageAvailable}
              className={cn(
                !isLocalStorageAvailable && "cursor-not-allowed opacity-40"
              )}
            >
              New Seller
              <Plus className="ml-1 h-3 w-3" />
            </Button>
          }
          content={
            isLocalStorageAvailable
              ? "You can save multiple sellers to use them later"
              : "Local storage is not available in your browser. Please enable it or try another browser"
          }
        />
      </div>

      <SellerDialog
        // we need to rerender the dialog when the editingSeller changes
        key={editingSeller?.id}
        isOpen={isSellerDialogOpen}
        onClose={() => {
          setIsSellerDialogOpen(false);
          setEditingSeller(null);
        }}
        handleSellerAdd={handleSellerAdd}
        handleSellerEdit={handleSellerEdit}
        initialData={editingSeller}
        isEditMode={isEditMode}
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
