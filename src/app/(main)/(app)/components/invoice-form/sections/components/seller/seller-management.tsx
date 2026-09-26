import { Plus, Trash2, Pencil, AlertCircleIcon } from "lucide-react";
import { useId, useState, type Dispatch, type SetStateAction } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";

import { ContactsBackupMenu } from "@/app/(main)/(app)/components/invoice-form/sections/components/contacts-backup-menu";
import { SellerDialog } from "@/app/(main)/(app)/components/invoice-form/sections/components/seller/seller-dialog";
import { usePartyActions } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-party-actions";
import { useSavedParties } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-saved-parties";
import { type InvoiceData, type SellerData } from "@/app/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectNative } from "@/components/ui/select-native";
import { CustomTooltip } from "@/components/ui/tooltip";
import { useIsLocalStorageAvailable } from "@/lib/use-is-local-storage-available";
import { cn } from "@/lib/utils";

interface SellerManagementProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  selectedSellerId: string;
  setSelectedSellerId: Dispatch<SetStateAction<string>>;
  formValues?: Partial<SellerData>;
  isMobile: boolean;
}

/**
 * SellerManagement Component
 *
 * Manages seller data for invoices including:
 * - Loading and displaying saved sellers from localStorage
 * - Creating new sellers via a dialog form
 * - Editing existing seller details
 * - Deleting sellers with confirmation
 * - Auto-populating invoice form fields when a seller is selected
 *
 * When a seller is selected from the dropdown, their details are populated into the
 * invoice form and the form fields become read-only. Users must use the Edit Seller
 * button to modify saved seller information.
 *
 * @param setValue - React Hook Form setter to update invoice form values
 * @param invoiceData - Current invoice data including seller information
 * @param selectedSellerId - ID of the currently selected seller
 * @param setSelectedSellerId - Callback to update the selected seller ID
 * @param formValues - Current seller form values (optional)
 */
export function SellerManagement({
  setValue,
  invoiceData,
  selectedSellerId,
  setSelectedSellerId,
  formValues,
  isMobile,
}: SellerManagementProps) {
  const [isSellerDialogOpen, setIsSellerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // The saved seller being edited in the dialog; `null` while adding a new one
  const [editingSeller, setEditingSeller] = useState<SellerData | null>(null);

  const sellerSelectId = useId();

  const isLocalStorageAvailable = useIsLocalStorageAvailable();

  const isEditMode = Boolean(editingSeller);

  const { savedParties: savedSellers, saveParties } = useSavedParties({
    party: "seller",
    invoicePartyId: invoiceData?.seller?.id,
    setSelectedId: setSelectedSellerId,
  });

  const { addParty, editParty, deleteSelectedParty, selectParty } =
    usePartyActions({
      party: "seller",
      savedParties: savedSellers,
      saveParties,
      selectedId: selectedSellerId,
      setSelectedId: setSelectedSellerId,
      applyToInvoice: (seller) => {
        setValue("seller", seller);
      },
      isMobile,
    });

  const activeSeller = savedSellers.find((seller) => {
    return seller.id === selectedSellerId;
  });

  const hasSellers = savedSellers.length > 0;

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col gap-2",
          hasSellers
            ? "rounded-md border p-4 shadow shadow-slate-400/10"
            : "mt-3",
        )}
      >
        {hasSellers ? (
          <div className="w-full space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor={sellerSelectId} className="">
                Select Seller
              </Label>
            </div>
            <div className="flex w-full gap-2">
              <SelectNative
                id={sellerSelectId}
                className={cn(
                  "block h-8 w-full text-[12px]",
                  !selectedSellerId && "italic text-gray-700",
                )}
                onChange={(event) => {
                  selectParty(event.target.value);
                }}
                value={selectedSellerId}
                title={activeSeller?.name}
              >
                <option value="">No seller selected (default)</option>
                {savedSellers.map((seller) => {
                  return (
                    <option key={seller.id} value={seller.id}>
                      {seller.name}
                    </option>
                  );
                })}
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
                        className="size-8 px-2"
                      >
                        <span className="sr-only">Edit seller</span>
                        <Pencil className="size-3.5" />
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
                        className="size-8 px-2"
                      >
                        <span className="sr-only">Delete seller</span>
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                    content="Delete seller"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <CustomTooltip
            side="bottom"
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
                            Local storage is not available in your browser.
                            Please enable it or try another browser.
                          </p>
                        </>
                      ),
                      position: isMobile ? "top-center" : "bottom-right",
                    });
                  }
                }}
                aria-disabled={!isLocalStorageAvailable} // better UX than 'disabled'
                className="flex-1"
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
                      Store multiple sellers to easily reuse their information
                      in future invoices. All data is saved locally in your
                      browser.
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
                      enable it or try another browser to save seller
                      information.
                    </p>
                  </div>
                </div>
              )
            }
          />
          <ContactsBackupMenu isMobile={isMobile} />
        </div>
      </div>

      <SellerDialog
        // we need to rerender the dialog when the editingSeller changes
        key={editingSeller?.id}
        isOpen={isSellerDialogOpen}
        onClose={() => {
          setIsSellerDialogOpen(false);
          setEditingSeller(null);
        }}
        handleSellerAdd={(newSeller, { shouldApplyNewSellerToInvoice }) => {
          addParty({
            partyData: newSeller,
            shouldApplyToInvoice: shouldApplyNewSellerToInvoice,
          });
        }}
        handleSellerEdit={(editedSeller) => {
          if (editParty(editedSeller)) {
            // end edit mode
            setEditingSeller(null);
          }
        }}
        initialData={editingSeller}
        isEditMode={isEditMode}
        formValues={formValues}
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
              onClick={() => {
                if (deleteSelectedParty()) {
                  setIsDeleteDialogOpen(false);
                }
              }}
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
