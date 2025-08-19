import { describe, it, expect } from "vitest";
import {
  compressInvoiceData,
  decompressInvoiceData,
  INVOICE_KEY_COMPRESSION_MAP,
} from "../url-compression";
import {
  type InvoiceData,
  type InvoiceItemData,
  type SellerData,
  type BuyerData,
  invoiceSchema,
  sellerSchema,
  buyerSchema,
  invoiceItemSchema,
} from "@/app/schema";
import { MOCK_INVOICE_DATA, MOCK_INVOICE_ITEM_DATA } from "./data";

describe("URL Compression Utilities", () => {
  describe("compressInvoiceData", () => {
    it("should compress invoice data by remapping keys to shorter identifiers", () => {
      const result = compressInvoiceData(MOCK_INVOICE_DATA);

      // Check that root level keys are mapped
      expect(result).toHaveProperty("a", "en"); // language
      expect(result).toHaveProperty("b", "YYYY-MM-DD"); // dateFormat
      expect(result).toHaveProperty("c", "EUR"); // currency
      expect(result).toHaveProperty("d", "default"); // template
      expect(result).toHaveProperty("e", MOCK_INVOICE_DATA.logo); // logo
      expect(result).toHaveProperty("g", "2024-01-15"); // dateOfIssue
      expect(result).toHaveProperty("h", "2024-01-31"); // dateOfService
      expect(result).toHaveProperty("i", "Standard Invoice"); // invoiceType
      expect(result).toHaveProperty("j", true); // invoiceTypeFieldIsVisible
      expect(result).toHaveProperty("n", 247.23); // total
      expect(result).toHaveProperty("o", true); // vatTableSummaryIsVisible
      expect(result).toHaveProperty("p", "Bank Transfer"); // paymentMethod
      expect(result).toHaveProperty("q", true); // paymentMethodFieldIsVisible
      expect(result).toHaveProperty("r", "2024-01-29"); // paymentDue
      expect(result).toHaveProperty(
        "s",
        "https://checkout.stripe.com/pay/cs_123",
      ); // stripePayOnlineUrl
      expect(result).toHaveProperty("t", "Thank you for your business"); // notes
      expect(result).toHaveProperty("u", true); // notesFieldIsVisible
      expect(result).toHaveProperty("v", true); // personAuthorizedToReceiveFieldIsVisible
      expect(result).toHaveProperty("w", true); // personAuthorizedToIssueFieldIsVisible

      // Check that invoiceNumberObject is mapped
      expect(result).toHaveProperty("f");
      const invoiceNumberObj = result.f as Record<string, unknown>;
      expect(invoiceNumberObj).toHaveProperty("x", "Invoice Number"); // label
      expect(invoiceNumberObj).toHaveProperty("y", "INV-2024-001"); // value
    });

    it("should compress nested seller data", () => {
      const result = compressInvoiceData(MOCK_INVOICE_DATA);

      expect(result).toHaveProperty("k"); // seller
      const seller = result.k as Record<string, unknown>;
      expect(seller).toHaveProperty("z", "seller-123"); // id
      expect(seller).toHaveProperty("A", "ACME Corp"); // name
      expect(seller).toHaveProperty("B", "123 Main St, City, 12345"); // address
      expect(seller).toHaveProperty("C", "VAT123456789"); // vatNo
      expect(seller).toHaveProperty("D", true); // vatNoFieldIsVisible
      expect(seller).toHaveProperty("E", "seller@acme.com"); // email
      expect(seller).toHaveProperty("F", "1234567890123456"); // accountNumber
      expect(seller).toHaveProperty("G", true); // accountNumberFieldIsVisible
      expect(seller).toHaveProperty("H", "ABCDUS33XXX"); // swiftBic
      expect(seller).toHaveProperty("I", true); // swiftBicFieldIsVisible
    });

    it("should compress nested buyer data", () => {
      const result = compressInvoiceData(MOCK_INVOICE_DATA);

      expect(result).toHaveProperty("l"); // buyer
      const buyer = result.l as Record<string, unknown>;
      expect(buyer).toHaveProperty("z", "buyer-456"); // id
      expect(buyer).toHaveProperty("A", "XYZ Ltd"); // name
      expect(buyer).toHaveProperty("B", "456 Oak Ave, Town, 67890"); // address
      expect(buyer).toHaveProperty("C", "VAT987654321"); // vatNo
      expect(buyer).toHaveProperty("D", true); // vatNoFieldIsVisible
      expect(buyer).toHaveProperty("E", "buyer@xyz.com"); // email
    });

    it("should compress items array", () => {
      const result = compressInvoiceData(MOCK_INVOICE_DATA);

      expect(result).toHaveProperty("m"); // items
      const items = result.m as Record<string, unknown>[];
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(1);

      const item = items[0];
      expect(item).toHaveProperty("J", true); // invoiceItemNumberIsVisible
      expect(item).toHaveProperty("A", "Product A"); // name (using buyer/seller name mapping)
      expect(item).toHaveProperty("K", true); // nameFieldIsVisible
      expect(item).toHaveProperty("L", "GTU_01"); // typeOfGTU
      expect(item).toHaveProperty("M", true); // typeOfGTUFieldIsVisible
      expect(item).toHaveProperty("N", 2); // amount
      expect(item).toHaveProperty("O", true); // amountFieldIsVisible
      expect(item).toHaveProperty("P", "pcs"); // unit
      expect(item).toHaveProperty("Q", true); // unitFieldIsVisible
      expect(item).toHaveProperty("R", 100.5); // netPrice
      expect(item).toHaveProperty("S", true); // netPriceFieldIsVisible
      expect(item).toHaveProperty("T", 23); // vat
      expect(item).toHaveProperty("U", true); // vatFieldIsVisible
      expect(item).toHaveProperty("V", 201); // netAmount
      expect(item).toHaveProperty("W", true); // netAmountFieldIsVisible
      expect(item).toHaveProperty("X", 46.23); // vatAmount
      expect(item).toHaveProperty("Y", true); // vatAmountFieldIsVisible
      expect(item).toHaveProperty("Z", 247.23); // preTaxAmount
      expect(item).toHaveProperty("0", true); // preTaxAmountFieldIsVisible
    });

    it("should handle missing optional fields", () => {
      const minimalInvoiceData: Partial<InvoiceData> = {
        language: "en",
        dateFormat: "YYYY-MM-DD",
        currency: "USD",
        template: "stripe",
        dateOfIssue: "2024-01-01",
        dateOfService: "2024-01-01",
        paymentDue: "2024-01-15",
        total: 100,
        seller: {
          name: "Test Seller",
          address: "123 Test St",
          email: "test@seller.com",
          vatNoFieldIsVisible: true,
          accountNumberFieldIsVisible: true,
          swiftBicFieldIsVisible: true,
          notesFieldIsVisible: true,
        } as SellerData,
        buyer: {
          name: "Test Buyer",
          address: "456 Test Ave",
          email: "test@buyer.com",
          vatNoFieldIsVisible: true,
          notesFieldIsVisible: true,
        } as BuyerData,
        items: [
          {
            invoiceItemNumberIsVisible: true,
            name: "Test Item",
            nameFieldIsVisible: true,
            typeOfGTU: "",
            typeOfGTUFieldIsVisible: true,
            amount: 1,
            amountFieldIsVisible: true,
            unit: "pc",
            unitFieldIsVisible: true,
            netPrice: 100,
            netPriceFieldIsVisible: true,
            vat: 0,
            vatFieldIsVisible: true,
            netAmount: 100,
            netAmountFieldIsVisible: true,
            vatAmount: 0,
            vatAmountFieldIsVisible: true,
            preTaxAmount: 100,
            preTaxAmountFieldIsVisible: true,
          },
        ],
        invoiceTypeFieldIsVisible: true,
        vatTableSummaryIsVisible: true,
        paymentMethodFieldIsVisible: true,
        notesFieldIsVisible: true,
        personAuthorizedToReceiveFieldIsVisible: true,
        personAuthorizedToIssueFieldIsVisible: true,
      };

      const result = compressInvoiceData(minimalInvoiceData as InvoiceData);

      expect(result).toHaveProperty("a", "en"); // language
      expect(result).toHaveProperty("c", "USD"); // currency
      expect(result).toHaveProperty("d", "stripe"); // template
      expect(result).toHaveProperty("n", 100); // total

      // Should not have invoiceNumberObject since it's not provided
      expect(result.f).toBeUndefined();
    });

    it("should handle empty arrays", () => {
      const dataWithEmptyItems = {
        ...MOCK_INVOICE_DATA,
        items: [],
      };

      const result = compressInvoiceData(dataWithEmptyItems);
      expect(result).toHaveProperty("m"); // items
      expect(result.m).toEqual([]);
    });
  });

  describe("decompressInvoiceData", () => {
    it("should decompress data by restoring original keys", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const result = decompressInvoiceData(compressedData);

      // Check root level restoration
      expect(result).toHaveProperty("language", "en");
      expect(result).toHaveProperty("dateFormat", "YYYY-MM-DD");
      expect(result).toHaveProperty("currency", "EUR");
      expect(result).toHaveProperty("template", "default");
      expect(result).toHaveProperty("logo", MOCK_INVOICE_DATA.logo);
      expect(result).toHaveProperty("dateOfIssue", "2024-01-15");
      expect(result).toHaveProperty("dateOfService", "2024-01-31");
      expect(result).toHaveProperty("invoiceType", "Standard Invoice");
      expect(result).toHaveProperty("invoiceTypeFieldIsVisible", true);
      expect(result).toHaveProperty("total", 247.23);
      expect(result).toHaveProperty("vatTableSummaryIsVisible", true);
      expect(result).toHaveProperty("paymentMethod", "Bank Transfer");
      expect(result).toHaveProperty("paymentMethodFieldIsVisible", true);
      expect(result).toHaveProperty("paymentDue", "2024-01-29");
      expect(result).toHaveProperty(
        "stripePayOnlineUrl",
        "https://checkout.stripe.com/pay/cs_123",
      );
      expect(result).toHaveProperty("notes", "Thank you for your business");
      expect(result).toHaveProperty("notesFieldIsVisible", true);
      expect(result).toHaveProperty(
        "personAuthorizedToReceiveFieldIsVisible",
        true,
      );
      expect(result).toHaveProperty(
        "personAuthorizedToIssueFieldIsVisible",
        true,
      );
    });

    it("should restore nested invoiceNumberObject", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const result = decompressInvoiceData(compressedData);

      expect(result).toHaveProperty("invoiceNumberObject");
      const invoiceNumberObj = result.invoiceNumberObject as Record<
        string,
        unknown
      >;
      expect(invoiceNumberObj).toHaveProperty("label", "Invoice Number");
      expect(invoiceNumberObj).toHaveProperty("value", "INV-2024-001");
    });

    it("should restore nested seller data", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const result = decompressInvoiceData(compressedData);

      expect(result).toHaveProperty("seller");
      const seller = result.seller;
      expect(seller).toHaveProperty("id", "seller-123");
      expect(seller).toHaveProperty("name", "ACME Corp");
      expect(seller).toHaveProperty("address", "123 Main St, City, 12345");
      expect(seller).toHaveProperty("vatNo", "VAT123456789");
      expect(seller).toHaveProperty("vatNoFieldIsVisible", true);
      expect(seller).toHaveProperty("email", "seller@acme.com");
      expect(seller).toHaveProperty("accountNumber", "1234567890123456");
      expect(seller).toHaveProperty("accountNumberFieldIsVisible", true);
      expect(seller).toHaveProperty("swiftBic", "ABCDUS33XXX");
      expect(seller).toHaveProperty("swiftBicFieldIsVisible", true);
    });

    it("should restore nested buyer data", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const result = decompressInvoiceData(compressedData);

      expect(result).toHaveProperty("buyer");
      const buyer = result.buyer;

      expect(buyer).toHaveProperty("id", "buyer-456");
      expect(buyer).toHaveProperty("name", "XYZ Ltd");
      expect(buyer).toHaveProperty("address", "456 Oak Ave, Town, 67890");
      expect(buyer).toHaveProperty("vatNo", "VAT987654321");
      expect(buyer).toHaveProperty("vatNoFieldIsVisible", true);
      expect(buyer).toHaveProperty("email", "buyer@xyz.com");
    });

    it("should restore items array", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const result = decompressInvoiceData(compressedData);

      expect(result).toHaveProperty("items");
      const items = result.items as Record<string, unknown>[];
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(1);

      const item = items[0];
      expect(item).toHaveProperty("invoiceItemNumberIsVisible", true);
      expect(item).toHaveProperty("name", "Product A");
      expect(item).toHaveProperty("nameFieldIsVisible", true);
      expect(item).toHaveProperty("typeOfGTU", "GTU_01");
      expect(item).toHaveProperty("typeOfGTUFieldIsVisible", true);
      expect(item).toHaveProperty("amount", 2);
      expect(item).toHaveProperty("amountFieldIsVisible", true);
      expect(item).toHaveProperty("unit", "pcs");
      expect(item).toHaveProperty("unitFieldIsVisible", true);
      expect(item).toHaveProperty("netPrice", 100.5);
      expect(item).toHaveProperty("netPriceFieldIsVisible", true);
      expect(item).toHaveProperty("vat", 23);
      expect(item).toHaveProperty("vatFieldIsVisible", true);
      expect(item).toHaveProperty("netAmount", 201);
      expect(item).toHaveProperty("netAmountFieldIsVisible", true);
      expect(item).toHaveProperty("vatAmount", 46.23);
      expect(item).toHaveProperty("vatAmountFieldIsVisible", true);
      expect(item).toHaveProperty("preTaxAmount", 247.23);
      expect(item).toHaveProperty("preTaxAmountFieldIsVisible", true);
    });

    it("should handle compressed data with unknown keys", () => {
      const compressedDataWithUnknownKeys = {
        a: "en", // language
        unknownKey: "unknown value",
        c: "USD", // currency
        anotherUnknown: { nested: "data" },
      };

      const result = decompressInvoiceData(compressedDataWithUnknownKeys);

      expect(result).toHaveProperty("language", "en");
      expect(result).toHaveProperty("currency", "USD");
      expect(result).toHaveProperty("unknownKey", "unknown value");
      expect(result).toHaveProperty("anotherUnknown", { nested: "data" });
    });
  });

  describe("roundtrip compression and decompression", () => {
    it("should perfectly restore original data after compression and decompression", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData).toStrictEqual(MOCK_INVOICE_DATA);
    });

    it("should handle multiple roundtrips without data loss", () => {
      let data = MOCK_INVOICE_DATA;

      // Perform multiple compression/decompression cycles
      for (let i = 0; i < 3; i++) {
        const compressed = compressInvoiceData(data);
        // @ts-expect-error - does not matter in test
        data = decompressInvoiceData(compressed);
      }

      expect(data).toStrictEqual(MOCK_INVOICE_DATA);
    });

    it("should handle data with multiple items", () => {
      const dataWithMultipleItems = {
        ...MOCK_INVOICE_DATA,
        items: [
          MOCK_INVOICE_ITEM_DATA,
          {
            ...MOCK_INVOICE_ITEM_DATA,
            name: "Product B",
            amount: 3,
            netPrice: 50.25,
            vat: "NP" as const,
          },
          {
            ...MOCK_INVOICE_ITEM_DATA,
            name: "Product C",
            amount: 1,
            netPrice: 200,
            vat: "OO" as const,
          },
        ],
      };

      const compressedData = compressInvoiceData(dataWithMultipleItems);
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData).toStrictEqual(dataWithMultipleItems);

      const items = decompressedData.items as InvoiceItemData[];
      expect(items).toHaveLength(3);
      expect(items[0].name).toBe("Product A");

      expect(items[1].name).toBe("Product B");
      expect(items[1].vat).toBe("NP");
      expect(items[1].amount).toBe(3);
      expect(items[1].netPrice).toBe(50.25);

      expect(items[2].name).toBe("Product C");
      expect(items[2].vat).toBe("OO");
      expect(items[2].amount).toBe(1);
      expect(items[2].netPrice).toBe(200);
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const dataWithNulls = {
        ...MOCK_INVOICE_DATA,
        invoiceNumberObject: null,
        logo: null,
        notes: null,
      };

      const compressedData = compressInvoiceData(
        dataWithNulls as unknown as InvoiceData,
      );
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData.invoiceNumberObject).toBeNull();
      expect(decompressedData.logo).toBeNull();
      expect(decompressedData.notes).toBeNull();
    });

    it("should handle undefined values", () => {
      const dataWithUndefined = {
        ...MOCK_INVOICE_DATA,
        invoiceNumberObject: undefined,
        logo: undefined,
        notes: undefined,
      };

      const compressedData = compressInvoiceData(
        dataWithUndefined as unknown as InvoiceData,
      );
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData.invoiceNumberObject).toBeUndefined();
      expect(decompressedData.logo).toBeUndefined();
      expect(decompressedData.notes).toBeUndefined();
    });

    it("should handle empty strings", () => {
      const dataWithEmptyStrings = {
        ...MOCK_INVOICE_DATA,
        logo: "",
        notes: "",
        invoiceType: "",
        seller: {
          ...MOCK_INVOICE_DATA.seller,
          vatNo: "",
          accountNumber: "",
          swiftBic: "",
          notes: "",
        },
      };

      const compressedData = compressInvoiceData(dataWithEmptyStrings);
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData).toEqual(dataWithEmptyStrings);
    });

    it("should handle nested arrays and objects", () => {
      const complexData = {
        ...MOCK_INVOICE_DATA,
        items: [
          {
            ...MOCK_INVOICE_ITEM_DATA,
            customData: {
              nested: {
                deeply: ["array", "of", "strings"],
                number: 42,
                boolean: true,
              },
            },
          },
        ],
      };

      const compressedData = compressInvoiceData(
        complexData as unknown as InvoiceData,
      );
      const decompressedData = decompressInvoiceData(compressedData);

      expect(decompressedData).toEqual(complexData);
    });

    it("should handle primitive values as root", () => {
      const compressedString = compressInvoiceData(
        "test string" as unknown as InvoiceData,
      );
      expect(compressedString).toBe("test string");

      const compressedNumber = compressInvoiceData(
        123 as unknown as InvoiceData,
      );
      expect(compressedNumber).toBe(123);

      const compressedBoolean = compressInvoiceData(
        true as unknown as InvoiceData,
      );
      expect(compressedBoolean).toBe(true);

      const compressedNull = compressInvoiceData(
        null as unknown as InvoiceData,
      );
      expect(compressedNull).toBe(null);
    });

    it("should maintain data types after compression/decompression", () => {
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const decompressedData = decompressInvoiceData(compressedData);

      // Check that numbers remain numbers
      expect(typeof decompressedData.total).toBe("number");
      expect(
        typeof (decompressedData.items as InvoiceItemData[])[0].amount,
      ).toBe("number");
      expect(
        typeof (decompressedData.items as InvoiceItemData[])[0].netPrice,
      ).toBe("number");
      expect(typeof (decompressedData.items as InvoiceItemData[])[0].vat).toBe(
        "number",
      );

      // Check that booleans remain booleans
      expect(typeof decompressedData.vatTableSummaryIsVisible).toBe("boolean");
      expect(
        typeof (decompressedData.items as InvoiceItemData[])[0]
          .nameFieldIsVisible,
      ).toBe("boolean");

      // Check that strings remain strings
      expect(typeof decompressedData.language).toBe("string");
      expect(typeof decompressedData.currency).toBe("string");
      expect(typeof (decompressedData.seller as SellerData).name).toBe(
        "string",
      );
    });

    describe("INVOICE_KEY_COMPRESSION_MAP completeness", () => {
      it("should include all keys from invoice schema types", () => {
        // Get all possible keys from the AllInvoiceKeys type
        // We'll do this by creating a comprehensive mock object and checking each key exists in INVOICE_KEY_COMPRESSION_MAP

        const invoiceRootKeys = Object.keys(
          invoiceSchema.shape,
        ) as (keyof typeof invoiceSchema.shape)[];

        const sellerKeys = Object.keys(
          sellerSchema.shape,
        ) as (keyof typeof sellerSchema.shape)[];

        const buyerKeys = Object.keys(
          buyerSchema.shape,
        ) as (keyof typeof buyerSchema.shape)[];

        const invoiceItemKeys = Object.keys(
          invoiceItemSchema.shape,
        ) as (keyof typeof invoiceItemSchema.shape)[];

        // Combine all keys
        const allKeys = [
          ...invoiceRootKeys,
          ...sellerKeys,
          ...buyerKeys,
          ...invoiceItemKeys,
        ];

        // Check that each key exists in INVOICE_KEY_COMPRESSION_MAP
        const missingKeys: string[] = [];

        allKeys.forEach((key) => {
          if (!(key in INVOICE_KEY_COMPRESSION_MAP)) {
            missingKeys.push(key);
          }
        });

        expect(missingKeys).toEqual([]);

        if (missingKeys.length > 0) {
          console.log(
            "Missing keys in INVOICE_KEY_COMPRESSION_MAP:",
            missingKeys,
          );
        }
      });

      it("should not have duplicate compressed values in INVOICE_KEY_COMPRESSION_MAP", () => {
        const compressedValues = Object.values(INVOICE_KEY_COMPRESSION_MAP);
        const uniqueValues = Array.from(new Set(compressedValues));

        expect(compressedValues).toHaveLength(uniqueValues.length);

        if (compressedValues.length !== uniqueValues.length) {
          const duplicates = compressedValues.filter(
            (value, index) => compressedValues.indexOf(value) !== index,
          );
          console.log("Duplicate compressed values:", duplicates);
        }
      });

      it("should have a INVOICE_KEY_COMPRESSION_MAP entry for every key used in MOCK_INVOICE_DATA", () => {
        // Extract all keys recursively from the mock data
        function getAllKeys(
          obj: unknown,
          keySet = new Set<string>(),
        ): Set<string> {
          if (obj === null || typeof obj !== "object") {
            return keySet;
          }

          if (Array.isArray(obj)) {
            obj.forEach((item) => getAllKeys(item, keySet));
            return keySet;
          }

          Object.keys(obj).forEach((key) => {
            keySet.add(key);
            getAllKeys(obj[key as keyof typeof obj], keySet);
          });

          return keySet;
        }

        const allKeysInMockData = getAllKeys(MOCK_INVOICE_DATA);
        const missingKeys: string[] = [];

        allKeysInMockData.forEach((key) => {
          if (!(key in INVOICE_KEY_COMPRESSION_MAP)) {
            missingKeys.push(key);
          }
        });

        expect(missingKeys).toStrictEqual([]);

        if (missingKeys.length > 0) {
          console.log(
            "Keys in MOCK_INVOICE_DATA missing from INVOICE_KEY_COMPRESSION_MAP:",
            missingKeys,
          );
        }
      });
    });
  });

  describe("size reduction verification", () => {
    it("should reduce the size of JSON when compressed", () => {
      const originalJson = JSON.stringify(MOCK_INVOICE_DATA);
      const compressedData = compressInvoiceData(MOCK_INVOICE_DATA);
      const compressedJson = JSON.stringify(compressedData);

      expect(compressedJson.length).toBeLessThan(originalJson.length);

      // Verify significant size reduction (should be at least 20% smaller)
      const reductionRatio =
        (originalJson.length - compressedJson.length) / originalJson.length;
      expect(reductionRatio).toBeGreaterThan(0.2);
    });

    it("should demonstrate compression effectiveness with multiple items", () => {
      const largeInvoiceData = {
        ...MOCK_INVOICE_DATA,
        items: Array.from({ length: 10 }, (_, index) => ({
          ...MOCK_INVOICE_ITEM_DATA,
          name: `Product ${index + 1}`,
          amount: index + 1,
          netPrice: (index + 1) * 10.5,
        })),
      };

      const originalJson = JSON.stringify(largeInvoiceData);
      const compressedData = compressInvoiceData(largeInvoiceData);
      const compressedJson = JSON.stringify(compressedData);

      expect(compressedJson.length).toBeLessThan(originalJson.length);

      // With more items, compression should be even more effective
      const reductionRatio =
        (originalJson.length - compressedJson.length) / originalJson.length;
      expect(reductionRatio).toBeGreaterThan(0.25);

      // Log the size reduction for visibility
      console.log(`Original size: ${originalJson.length} characters`);
      console.log(`Compressed size: ${compressedJson.length} characters`);
      console.log(`Size reduction: ${(reductionRatio * 100).toFixed(1)}%`);
    });
  });
});
