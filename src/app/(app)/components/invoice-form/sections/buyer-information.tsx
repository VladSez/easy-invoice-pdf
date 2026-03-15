"use client";

import { type InvoiceData } from "@/app/schema";
import { BuyerManagement } from "@/components/buyer-management";
import { memo, useState } from "react";
import { type UseFormSetValue } from "react-hook-form";

interface BuyerInformationProps {
  setValue: UseFormSetValue<InvoiceData>;
  invoiceData: InvoiceData;
  isMobile: boolean;
}

export const BuyerInformation = memo(function BuyerInformation({
  setValue,
  invoiceData,
  isMobile,
}: BuyerInformationProps) {
  const [selectedBuyerId, setSelectedBuyerId] = useState("");

  return (
    <BuyerManagement
      setValue={setValue}
      invoiceData={invoiceData}
      selectedBuyerId={selectedBuyerId}
      setSelectedBuyerId={setSelectedBuyerId}
      isMobile={isMobile}
    />
  );
});
