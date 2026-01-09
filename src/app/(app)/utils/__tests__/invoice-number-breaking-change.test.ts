import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleInvoiceNumberBreakingChange } from "../invoice-number-breaking-change";
import { SUPPORTED_LANGUAGES, type InvoiceData } from "@/app/schema";
import { INVOICE_PDF_TRANSLATIONS } from "@/app/(app)/pdf-i18n-translations/pdf-translations";

// Mock the umami tracking function
vi.mock("@/lib/umami-analytics-track-event", () => ({
  umamiTrackEvent: vi.fn(),
}));

import { umamiTrackEvent } from "@/lib/umami-analytics-track-event";

describe("handleInvoiceNumberBreakingChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("valid input scenarios", () => {
    it("should transform invoiceNumber to invoiceNumberObject with English language", () => {
      const input = {
        invoiceNumber: "INV-2024-001",
        language: "en",
        otherField: "preserved",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toEqual({
        language: "en",
        otherField: "preserved",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.en.invoiceNumber}:`,
          value: "INV-2024-001",
        },
      });

      // Should not contain the old invoiceNumber field
      expect(result).not.toHaveProperty("invoiceNumber");

      // Should track the breaking change event
      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");
      expect(umamiTrackEvent).toHaveBeenCalledTimes(1);
    });

    it("should transform invoiceNumber with Polish language", () => {
      const input = {
        invoiceNumber: "FAKT-001",
        language: "pl",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toEqual({
        language: "pl",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.pl.invoiceNumber}:`,
          value: "FAKT-001",
        },
      });

      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");
    });

    it("should transform invoiceNumber with German language", () => {
      const input = {
        invoiceNumber: "RG-2024-001",
        language: "de",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toEqual({
        language: "de",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.de.invoiceNumber}:`,
          value: "RG-2024-001",
        },
      });

      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");
    });

    it("should preserve all other fields when transforming", () => {
      const input = {
        invoiceNumber: "123",
        language: "en",
        dateOfIssue: "2024-01-15",
        seller: { name: "ACME Corp" },
        buyer: { name: "Client Ltd" },
        items: [{ name: "Product A", amount: 1 }],
        total: 100,
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toEqual({
        language: "en",
        dateOfIssue: "2024-01-15",
        seller: { name: "ACME Corp" },
        buyer: { name: "Client Ltd" },
        items: [{ name: "Product A", amount: 1 }],
        total: 100,
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.en.invoiceNumber}:`,
          value: "123",
        },
      });
    });
  });

  describe("invalid language scenarios", () => {
    it("should fallback to default language when language is invalid", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // do nothing
      });

      const input = {
        invoiceNumber: "INV-001",
        language: "invalid-lang",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      const defaultLanguage = SUPPORTED_LANGUAGES[0];
      expect(result).toEqual({
        language: "invalid-lang",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS[defaultLanguage].invoiceNumber}:`,
          value: "INV-001",
        },
      });

      // Should log error for invalid language
      expect(consoleSpy).toHaveBeenCalledWith(
        "Invalid invoice language:",
        expect.any(Object),
      );

      // Should still track the breaking change event
      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");

      consoleSpy.mockRestore();
    });

    it("should fallback to default language when language is not a string", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // do nothing
      });

      const input = {
        invoiceNumber: "INV-001",
        language: 123,
      };

      const result = handleInvoiceNumberBreakingChange(input);

      const defaultLanguage = SUPPORTED_LANGUAGES[0];
      expect(result).toEqual({
        language: 123,
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS[defaultLanguage].invoiceNumber}:`,
          value: "INV-001",
        },
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");

      consoleSpy.mockRestore();
    });
  });

  describe("no transformation scenarios", () => {
    it("should return unchanged when invoiceNumber field is missing", () => {
      const input = {
        language: "en",
        dateOfIssue: "2024-01-15",
        seller: { name: "ACME Corp" },
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toBe(input);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should return unchanged when language field is missing", () => {
      const input = {
        invoiceNumber: "INV-001",
        dateOfIssue: "2024-01-15",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toBe(input);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should return unchanged when invoiceNumber is not a string", () => {
      const input = {
        invoiceNumber: 123,
        language: "en",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toBe(input);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should transform even when invoiceNumber is empty string", () => {
      const input = {
        invoiceNumber: "",
        language: "en",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(result).toEqual({
        language: "en",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.en.invoiceNumber}:`,
          value: "",
        },
      });

      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");
    });

    it("should return unchanged when input is null", () => {
      const result = handleInvoiceNumberBreakingChange(null);

      expect(result).toBe(null);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should return unchanged when input is undefined", () => {
      const result = handleInvoiceNumberBreakingChange(undefined);

      expect(result).toBe(undefined);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should return unchanged when input is not an object", () => {
      const stringInput = "test";
      const numberInput = 42;
      const booleanInput = true;

      expect(handleInvoiceNumberBreakingChange(stringInput)).toBe(stringInput);
      expect(handleInvoiceNumberBreakingChange(numberInput)).toBe(numberInput);
      expect(handleInvoiceNumberBreakingChange(booleanInput)).toBe(
        booleanInput,
      );

      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });

    it("should return unchanged when input is an array", () => {
      const arrayInput = [1, 2, 3];
      const result = handleInvoiceNumberBreakingChange(arrayInput);

      expect(result).toBe(arrayInput);
      expect(umamiTrackEvent).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle input with existing invoiceNumberObject field", () => {
      const input = {
        invoiceNumber: "OLD-001",
        language: "en",
        invoiceNumberObject: {
          label: "Existing Label:",
          value: "Existing Value",
        },
      } as unknown as InvoiceData;

      const result = handleInvoiceNumberBreakingChange(input);

      // Should overwrite the existing invoiceNumberObject
      expect(result).toEqual({
        language: "en",
        invoiceNumberObject: {
          label: `${INVOICE_PDF_TRANSLATIONS.en.invoiceNumber}:`,
          value: "OLD-001",
        },
      });

      expect(umamiTrackEvent).toHaveBeenCalledWith("breaking_change_detected");
    });

    it("should handle all supported languages correctly", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const input = {
          invoiceNumber: `INV-${lang}`,
          language: lang,
        };

        const result = handleInvoiceNumberBreakingChange(input);

        expect(result).toEqual({
          language: lang,
          invoiceNumberObject: {
            label: `${INVOICE_PDF_TRANSLATIONS[lang].invoiceNumber}:`,
            value: `INV-${lang}`,
          },
        });
      });

      // Should track one event per language
      expect(umamiTrackEvent).toHaveBeenCalledTimes(SUPPORTED_LANGUAGES.length);
    });

    it("should handle special characters in invoiceNumber", () => {
      const input = {
        invoiceNumber: "INV/2024\\001-#@!",
        language: "en",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect((result as InvoiceData).invoiceNumberObject?.value).toBe(
        "INV/2024\\001-#@!",
      );
    });

    it("should handle very long invoiceNumber", () => {
      const longInvoiceNumber = "A".repeat(1000);
      const input = {
        invoiceNumber: longInvoiceNumber,
        language: "en",
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect((result as InvoiceData).invoiceNumberObject?.value).toBe(
        longInvoiceNumber,
      );
    });
  });

  describe("type safety", () => {
    it("should maintain proper typing after transformation", () => {
      const input = {
        invoiceNumber: "INV-001",
        language: "en" as const,
        numericField: 42,
        booleanField: true,
        arrayField: [1, 2, 3],
        objectField: { nested: "value" },
      };

      const result = handleInvoiceNumberBreakingChange(input);

      expect(typeof result).toBe("object");
      expect(result).not.toBe(null);

      if (typeof result === "object" && result !== null) {
        expect("invoiceNumberObject" in result).toBe(true);
        expect("invoiceNumber" in result).toBe(false);

        if ("invoiceNumberObject" in result) {
          const invoiceNumberObject = (result as unknown as InvoiceData)
            .invoiceNumberObject;

          expect(typeof invoiceNumberObject?.label).toBe("string");
          expect(typeof invoiceNumberObject?.value).toBe("string");
        }
      }
    });
  });
});
