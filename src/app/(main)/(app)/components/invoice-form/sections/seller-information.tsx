import { memo, useState } from "react";
import { type Control, type UseFormSetValue } from "react-hook-form";

import { SavedContactCard } from "@/app/(main)/(app)/components/invoice-form/sections/components/contact-fields";
import { PartyFields } from "@/app/(main)/(app)/components/invoice-form/sections/components/party-fields";
import { SellerManagement } from "@/app/(main)/(app)/components/invoice-form/sections/components/seller/seller-management";
import { type InvoiceData, type SellerData } from "@/app/schema";
import { AccordionContent } from "@/components/ui/accordion";

interface SellerInformationProps {
  control: Control<InvoiceData>;
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const SellerInformation = memo(function SellerInformation({
  control,
  setValue,
  invoiceData,
  isMobile,
}: SellerInformationProps) {
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const isSellerSelected = !!selectedSellerId;

  const currentFormValues = {
    name: invoiceData.seller.name,
    address: invoiceData.seller.address,
    vatNo: invoiceData.seller.vatNo,
    vatNoLabelText: invoiceData.seller.vatNoLabelText,
    email: invoiceData.seller.email,
    emailFieldIsVisible: invoiceData.seller.emailFieldIsVisible,
    accountNumber: invoiceData.seller.accountNumber,
    swiftBic: invoiceData.seller.swiftBic,
    vatNoFieldIsVisible: invoiceData.seller.vatNoFieldIsVisible,
    accountNumberFieldIsVisible: invoiceData.seller.accountNumberFieldIsVisible,
    swiftBicFieldIsVisible: invoiceData.seller.swiftBicFieldIsVisible,
    notes: invoiceData.seller.notes,
    notesFieldIsVisible: invoiceData.seller.notesFieldIsVisible,
  } satisfies Partial<SellerData>;

  return (
    <div>
      <div className="relative flex items-end justify-end gap-2">
        <SellerManagement
          setValue={setValue}
          invoiceData={invoiceData}
          selectedSellerId={selectedSellerId}
          setSelectedSellerId={setSelectedSellerId}
          formValues={currentFormValues}
          isMobile={isMobile}
        />
      </div>
      <AccordionContent className="">
        {isSellerSelected ? (
          <div className="mt-5">
            <SavedContactCard control={control} party="seller" />
          </div>
        ) : (
          <div className="mt-5">
            <PartyFields
              party="seller"
              placement="invoice"
              control={control}
              names={{
                name: "seller.name",
                address: "seller.address",
                vatNoLabelText: "seller.vatNoLabelText",
                vatNo: "seller.vatNo",
                vatNoFieldIsVisible: "seller.vatNoFieldIsVisible",
                email: "seller.email",
                emailFieldIsVisible: "seller.emailFieldIsVisible",
                bank: {
                  accountNumber: "seller.accountNumber",
                  accountNumberFieldIsVisible:
                    "seller.accountNumberFieldIsVisible",
                  swiftBic: "seller.swiftBic",
                  swiftBicFieldIsVisible: "seller.swiftBicFieldIsVisible",
                },
                notes: "seller.notes",
                notesFieldIsVisible: "seller.notesFieldIsVisible",
              }}
            />
          </div>
        )}
      </AccordionContent>
    </div>
  );
});
