"use client";

import { pdf } from "@react-pdf/renderer/lib/react-pdf.browser";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useState } from "react";
import { toast } from "sonner";

import { InvoicePdfTemplate } from "@/app/(app)/components/invoice-templates/invoice-pdf-default-template";
import {
  LANGUAGE_TO_LABEL,
  SUPPORTED_LANGUAGES,
  type InvoiceData,
  type SupportedLanguages,
} from "@/app/schema";
import { MultiSelect } from "@/components/ui/multi-select";
import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

const SUPPORTED_LANGUAGES_OPTIONS = SUPPORTED_LANGUAGES.map((language) => {
  return {
    label: LANGUAGE_TO_LABEL[language],
    value: language,
  };
});

// TODO: add later when PRO version is released, this is PRO FEATURE =)
// TODO: allow to select languages that user wants to download. Use select multiple component https://github.com/sersavan/shadcn-multi-select-component but style it like a button when merging PR on github with multiple options to select from dropdown
/**
 * This component is used to download all PDFs in multiple languages
 */
export function InvoicePDFDownloadMultipleLanguages({
  invoiceData,
  qrCodeDataUrl,
}: {
  invoiceData: InvoiceData;
  qrCodeDataUrl: string;
}) {
  const language = invoiceData.language;

  const [selectedLanguages, setSelectedLanguages] = useState<
    SupportedLanguages[]
  >([language]);

  // Reset the selection to the invoice language whenever the invoice language
  // changes. Adjusting state during render (instead of in an effect) avoids the
  // extra render pass that would otherwise show the stale selection first.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [previousLanguage, setPreviousLanguage] = useState(language);
  if (language && language !== previousLanguage) {
    setPreviousLanguage(language);
    setSelectedLanguages([language]);
  }

  const generateAndZipPDFs = async (
    selectedLanguages: SupportedLanguages[],
  ) => {
    try {
      // Generate PDF documents for each selected language
      const pdfPromises = selectedLanguages.map((lang) => {
        const document = (
          <InvoicePdfTemplate
            invoiceData={{ ...invoiceData, language: lang }}
            qrCodeDataUrl={qrCodeDataUrl}
          />
        );
        return pdf(document).toBlob();
      });

      // Wait for all PDFs to generate
      const pdfBlobs = await Promise.all(pdfPromises);

      // Track analytics
      umamiTrackEvent("generate_multiple_pdfs_zip");

      const invoiceNumber = `${invoiceData?.invoiceNumberObject?.label} ${invoiceData?.invoiceNumberObject?.value}`;

      // If only one language is selected, download directly without zipping
      if (pdfBlobs.length === 1) {
        const fileName = `invoice-${selectedLanguages[0]}-${invoiceNumber.replace("/", "-")}.pdf`;
        saveAs(pdfBlobs[0], fileName);
        return;
      }

      const invoiceNumberFormatted = invoiceNumber.replace("/", "-");

      // Create zip file for multiple languages
      const zip = new JSZip();

      // Add each PDF to the zip
      selectedLanguages.forEach((lang, index) => {
        zip.file(
          `invoice-${lang}-${invoiceNumberFormatted}.pdf`,
          pdfBlobs[index],
        );
      });

      // 'en-de-fr'
      const languages = selectedLanguages.join("-");

      // Generate and download zip
      const zipContent = await zip.generateAsync({ type: "blob" });
      const zipFileName = `invoice-${invoiceNumber}-${languages}-archive.zip`;

      saveAs(zipContent, zipFileName);
    } catch (error) {
      toast.error("Error generating PDF archive");
      console.error(error);
    }
  };

  return (
    <>
      <MultiSelect
        options={SUPPORTED_LANGUAGES_OPTIONS}
        onValueChange={(value) => {
          setSelectedLanguages(value as SupportedLanguages[]);
        }}
        selectedLanguages={selectedLanguages}
        setSelectedLanguages={setSelectedLanguages}
        placeholder="Download PDF"
        variant="inverted"
        maxCount={3}
        handleDownload={() => {
          return generateAndZipPDFs(
            selectedLanguages.map((lang) => {
              return lang;
            }),
          );
        }}
      />
    </>
  );
}
