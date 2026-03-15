import { type InvoiceData } from "@/app/schema";
import { SellerManagement } from "@/components/seller-management";
import { memo, useState } from "react";
import { type UseFormSetValue } from "react-hook-form";

interface SellerInformationProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const SellerInformation = memo(function SellerInformation({
  setValue,
  invoiceData,
  isMobile,
}: SellerInformationProps) {
  const [selectedSellerId, setSelectedSellerId] = useState("");

  return (
    <SellerManagement
      setValue={setValue}
      invoiceData={invoiceData}
      selectedSellerId={selectedSellerId}
      setSelectedSellerId={setSelectedSellerId}
      isMobile={isMobile}
    />
  );
});
