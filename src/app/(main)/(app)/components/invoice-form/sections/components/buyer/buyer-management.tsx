import { Plus, Trash2, Pencil, AlertCircleIcon } from "lucide-react";
import { useId, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";

import { ContactsBackupMenu } from "@/app/(main)/(app)/components/invoice-form/sections/components/contacts-backup-menu";
import { usePartyActions } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-party-actions";
import { useSavedParties } from "@/app/(main)/(app)/components/invoice-form/sections/hooks/use-saved-parties";
import { type InvoiceData, type BuyerData } from "@/app/schema";
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

import { BuyerDialog } from "./buyer-dialog";

interface BuyerManagementProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  selectedBuyerId: string;
  setSelectedBuyerId: (id: string) => void;
  formValues?: Partial<BuyerData>;
  isMobile: boolean;
}

/**
 * BuyerManagement Component
 *
 * Manages buyer data for invoices including:
 * - Loading and displaying saved buyers from localStorage
 * - Creating new buyers via a dialog form
 * - Editing existing buyer details
 * - Deleting buyers with confirmation
 * - Auto-populating invoice form fields when a buyer is selected
 *
 * When a buyer is selected from the dropdown, their details are populated into the
 * invoice form and the form fields become read-only. Users must use the Edit Buyer
 * button to modify saved buyer information.
 *
 * @param setValue - React Hook Form setter to update invoice form values
 * @param invoiceData - Current invoice data including buyer information
 * @param selectedBuyerId - ID of the currently selected buyer
 * @param setSelectedBuyerId - Callback to update the selected buyer ID
 * @param formValues - Current buyer form values (optional)
 */
export function BuyerManagement({
  setValue,
  invoiceData,
  selectedBuyerId,
  setSelectedBuyerId,
  formValues,
  isMobile,
}: BuyerManagementProps) {
  const [isBuyerDialogOpen, setIsBuyerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // The saved buyer being edited in the dialog; `null` while adding a new one
  const [editingBuyer, setEditingBuyer] = useState<BuyerData | null>(null);

  const buyerSelectId = useId();

  const isLocalStorageAvailable = useIsLocalStorageAvailable();

  const isEditMode = Boolean(editingBuyer);

  const { savedParties: savedBuyers, saveParties } = useSavedParties({
    party: "buyer",
    invoicePartyId: invoiceData?.buyer?.id,
    setSelectedId: setSelectedBuyerId,
  });

  const { addParty, editParty, deleteSelectedParty, selectParty } =
    usePartyActions({
      party: "buyer",
      savedParties: savedBuyers,
      saveParties,
      selectedId: selectedBuyerId,
      setSelectedId: setSelectedBuyerId,
      applyToInvoice: (buyer) => {
        setValue("buyer", buyer);
      },
      isMobile,
    });

  const activeBuyer = savedBuyers.find((buyer) => {
    return buyer.id === selectedBuyerId;
  });

  const hasBuyers = savedBuyers.length > 0;

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-col gap-2",
          hasBuyers
            ? "rounded-md border p-4 shadow shadow-slate-400/10"
            : "mt-3",
        )}
      >
        {hasBuyers ? (
          <div className="w-full space-y-1">
            <div className="flex items-center gap-1">
              <Label htmlFor={buyerSelectId} className="">
                Select Buyer
              </Label>
            </div>
            <div className="flex w-full gap-2">
              <SelectNative
                id={buyerSelectId}
                className={cn(
                  "block h-8 w-full text-[12px]",
                  !selectedBuyerId && "italic text-gray-700",
                )}
                onChange={(event) => {
                  selectParty(event.target.value);
                }}
                value={selectedBuyerId}
                title={activeBuyer?.name}
              >
                <option value="">No buyer selected (default)</option>
                {savedBuyers.map((buyer) => {
                  return (
                    <option key={buyer.id} value={buyer.id}>
                      {buyer.name}
                    </option>
                  );
                })}
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
                        className="size-8 px-2"
                      >
                        <span className="sr-only">Edit buyer</span>
                        <Pencil className="size-3.5" />
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
                        className="size-8 px-2"
                      >
                        <span className="sr-only">Delete buyer</span>
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                    content="Delete buyer"
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

                    // open buyer dialog
                    setIsBuyerDialogOpen(true);
                  } else {
                    toast.error("Unable to add buyer", {
                      id: "unable-to-add-buyer-error-toast",
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
                      future invoices. All data is saved locally in your
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
                      enable it or try another browser to save buyer
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

      <BuyerDialog
        // we need to rerender the dialog when the editingBuyer changes
        key={editingBuyer?.id}
        isOpen={isBuyerDialogOpen}
        onClose={() => {
          setIsBuyerDialogOpen(false);
          setEditingBuyer(null);
        }}
        handleBuyerAdd={(newBuyer, { shouldApplyNewBuyerToInvoice }) => {
          addParty({
            partyData: newBuyer,
            shouldApplyToInvoice: shouldApplyNewBuyerToInvoice,
          });
        }}
        handleBuyerEdit={(editedBuyer) => {
          if (editParty(editedBuyer)) {
            // end edit mode
            setEditingBuyer(null);
          }
        }}
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
