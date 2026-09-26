import { assert, describe, expect, it } from "vitest";

import {
  buildContactsBackupFileName,
  describeImportResult,
  mergeImportedContacts,
  parseContactsBackup,
  serializeContactsBackup,
} from "@/app/(main)/(app)/utils/contacts-backup";
import {
  buyerSchema,
  sellerSchema,
  type BuyerData,
  type SellerData,
} from "@/app/schema";

const SELLER = sellerSchema.parse({
  id: "1700000000000",
  name: "Acme Ltd",
  address: "1 Main Street\nSpringfield",
  vatNo: "PL1234567890",
  email: "billing@acme.test",
  accountNumber: "PL61 1090 1014 0000 0712 1981 2874",
  swiftBic: "WBKPPLPP",
  swiftBicFieldIsVisible: false,
});

const BUYER = buyerSchema.parse({
  id: "1700000000001",
  name: "Globex",
  address: "2 Side Road",
  vatNoLabelText: "Tax ID",
  notesFieldIsVisible: false,
});

const EXPORTED_AT = new Date("2026-09-26T10:00:00.000Z");

let nextId = 0;

function createId() {
  nextId += 1;

  return `generated-${nextId}`;
}

interface BackupFileOptions {
  sellers?: unknown[];
  buyers?: unknown[];
}

function backupFile({ sellers = [], buyers = [] }: BackupFileOptions) {
  return JSON.stringify({ app: "easyinvoicepdf", version: 1, sellers, buyers });
}

describe("serializeContactsBackup", () => {
  it("leaves out visible flags and keeps hidden ones", () => {
    const backup = JSON.parse(
      serializeContactsBackup({
        sellers: [SELLER],
        buyers: [BUYER],
        exportedAt: EXPORTED_AT,
      }),
    ) as { sellers: unknown[]; buyers: unknown[] };

    expect(backup).toMatchObject({
      app: "easyinvoicepdf",
      version: 1,
      exportedAt: "2026-09-26T10:00:00.000Z",
    });

    expect(backup.sellers[0]).toStrictEqual({
      id: "1700000000000",
      name: "Acme Ltd",
      address: "1 Main Street\nSpringfield",
      vatNo: "PL1234567890",
      vatNoLabelText: "VAT no",
      email: "billing@acme.test",
      accountNumber: "PL61 1090 1014 0000 0712 1981 2874",
      swiftBic: "WBKPPLPP",
      swiftBicFieldIsVisible: false,
    });

    expect(backup.buyers[0]).toStrictEqual({
      id: "1700000000001",
      name: "Globex",
      address: "2 Side Road",
      vatNoLabelText: "Tax ID",
      notesFieldIsVisible: false,
    });
  });

  it("round trips through parse and merge without losing anything", () => {
    const text = serializeContactsBackup({
      sellers: [SELLER],
      buyers: [BUYER],
      exportedAt: EXPORTED_AT,
    });

    const parsed = parseContactsBackup(text);

    assert(parsed.success, "the backup should parse");

    const sellers = mergeImportedContacts({
      existing: [],
      imported: parsed.sellers,
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });
    const buyers = mergeImportedContacts({
      existing: [],
      imported: parsed.buyers,
      schema: buyerSchema,
      contactNoun: "buyer",
      createId,
    });

    expect(sellers.contacts).toStrictEqual([SELLER]);
    expect(buyers.contacts).toStrictEqual([BUYER]);
  });

  it.each([
    ["seller", sellerSchema.shape],
    ["buyer", buyerSchema.shape],
  ] as const)(
    "is only lossless while every %s visibility flag defaults to true",
    (_party, shape) => {
      const visibilityFlags = Object.entries(shape).filter(([key]) => {
        return key.endsWith("FieldIsVisible");
      });

      expect(visibilityFlags.length).toBeGreaterThan(0);

      for (const [key, flagSchema] of visibilityFlags) {
        expect({ key, default: flagSchema.parse(undefined) }).toStrictEqual({
          key,
          default: true,
        });
      }
    },
  );
});

describe("buildContactsBackupFileName", () => {
  it("dates the file", () => {
    expect(buildContactsBackupFileName(new Date(2026, 8, 26, 23, 59))).toBe(
      "easyinvoicepdf-contacts-2026-09-26.json",
    );
  });
});

describe("parseContactsBackup", () => {
  it.each([
    ["text that is not JSON", "not json {"],
    ["an array", "[]"],
    ["another app's JSON", JSON.stringify({ app: "other", version: 1 })],
    [
      "a version that is not a number",
      JSON.stringify({ app: "easyinvoicepdf", version: "1" }),
    ],
    [
      "a list that is not an array",
      JSON.stringify({ app: "easyinvoicepdf", version: 1, sellers: {} }),
    ],
  ])("rejects %s", (_description, text) => {
    expect(parseContactsBackup(text)).toStrictEqual({
      success: false,
      error: "This file is not an EasyInvoicePDF sellers & buyers backup.",
    });
  });

  it("rejects a backup from a newer version", () => {
    const result = parseContactsBackup(
      JSON.stringify({ app: "easyinvoicepdf", version: 2, sellers: [SELLER] }),
    );

    expect(result).toStrictEqual({
      success: false,
      error:
        "This backup was made by a newer version of EasyInvoicePDF. Reload the page and try again.",
    });
  });

  it("rejects a backup with nothing in it", () => {
    expect(parseContactsBackup(backupFile({}))).toStrictEqual({
      success: false,
      error: "This backup has no sellers or buyers in it.",
    });
  });

  it("accepts a backup with only one of the two lists", () => {
    const result = parseContactsBackup(
      JSON.stringify({ app: "easyinvoicepdf", version: 1, buyers: [BUYER] }),
    );

    expect(result).toStrictEqual({
      success: true,
      sellers: [],
      buyers: [BUYER],
    });
  });
});

describe("mergeImportedContacts", () => {
  it("adds new entries after the existing ones", () => {
    const newSeller = { ...SELLER, id: "2", name: "Initech" };

    const result = mergeImportedContacts({
      existing: [SELLER],
      imported: [newSeller],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result).toStrictEqual({
      contacts: [SELLER, newSeller],
      addedCount: 1,
      duplicateCount: 0,
      invalidEntries: [],
      nameConflicts: [],
    });
  });

  it("keeps the saved entry when an imported one has the same id", () => {
    const editedHere = { ...SELLER, name: "Acme Ltd (renamed)" };

    const result = mergeImportedContacts({
      existing: [editedHere],
      imported: [SELLER],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result.contacts).toStrictEqual([editedHere]);
    expect(result.duplicateCount).toBe(1);
  });

  it("skips an entry with the same details under a different id", () => {
    const result = mergeImportedContacts({
      existing: [SELLER],
      imported: [{ ...SELLER, id: "saved-in-another-browser" }],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result.contacts).toStrictEqual([SELLER]);
    expect(result.duplicateCount).toBe(1);
  });

  it("compares details after defaults and trimming are applied", () => {
    const result = mergeImportedContacts<BuyerData>({
      existing: [{ ...BUYER, vatNoLabelText: "VAT no" }],
      imported: [
        {
          ...BUYER,
          id: undefined,
          vatNoLabelText: undefined,
          name: "  Globex  ",
        },
      ],
      schema: buyerSchema,
      contactNoun: "buyer",
      createId,
    });

    expect(result.addedCount).toBe(0);
    expect(result.duplicateCount).toBe(1);
  });

  it("skips duplicates within the file itself", () => {
    const result = mergeImportedContacts({
      existing: [],
      imported: [SELLER, SELLER, { ...SELLER, id: undefined }],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result.contacts).toStrictEqual([SELLER]);
    expect(result.addedCount).toBe(1);
    expect(result.duplicateCount).toBe(2);
  });

  it("gives an entry without an id a new one", () => {
    const result = mergeImportedContacts<BuyerData>({
      existing: [],
      imported: [{ ...BUYER, id: undefined }],
      schema: buyerSchema,
      contactNoun: "buyer",
      createId: () => {
        return "fresh-id";
      },
    });

    expect(result.contacts).toStrictEqual([{ ...BUYER, id: "fresh-id" }]);
  });

  it("does not add a different contact under a name that is already saved", () => {
    const sameNameElsewhere = {
      ...SELLER,
      id: "2",
      address: "5 New Road",
    };

    const result = mergeImportedContacts({
      existing: [SELLER],
      imported: [sameNameElsewhere],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result).toStrictEqual({
      contacts: [SELLER],
      addedCount: 0,
      duplicateCount: 0,
      invalidEntries: [],
      nameConflicts: [
        {
          label: "“Acme Ltd”",
          entry: sameNameElsewhere,
          issues: [
            {
              field: "name",
              message: "A seller with this name is already saved",
            },
          ],
        },
      ],
    });
  });

  it("compares names the way the add dialog does: trimmed, case-sensitive", () => {
    const result = mergeImportedContacts<SellerData>({
      existing: [SELLER],
      imported: [
        { ...SELLER, id: "2", name: "  Acme Ltd ", address: "Elsewhere" },
        { ...SELLER, id: "3", name: "ACME LTD", address: "Elsewhere" },
      ],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result.nameConflicts).toHaveLength(1);
    expect(result.addedCount).toBe(1);
  });

  it("adds only the first of two different contacts sharing a name in the file", () => {
    const base = { ...BUYER, id: undefined };

    const result = mergeImportedContacts<BuyerData>({
      existing: [],
      imported: [
        { ...base, address: "Road 1" },
        { ...base, address: "Road 2" },
      ],
      schema: buyerSchema,
      contactNoun: "buyer",
      createId,
    });

    expect(result.addedCount).toBe(1);
    expect(result.contacts[0]?.address).toBe("Road 1");
    expect(result.nameConflicts[0]?.issues).toStrictEqual([
      { field: "name", message: "A buyer with this name is already saved" },
    ]);
  });

  it("imports the valid entries and reports the invalid ones", () => {
    const result = mergeImportedContacts<SellerData>({
      existing: [],
      imported: [
        { ...SELLER, email: "not-an-email" },
        SELLER,
        { address: "No name" },
        "not even an object",
      ],
      schema: sellerSchema,
      contactNoun: "seller",
      createId,
    });

    expect(result.contacts).toStrictEqual([SELLER]);
    expect(result.invalidEntries).toStrictEqual([
      {
        label: "“Acme Ltd”",
        entry: { ...SELLER, email: "not-an-email" },
        issues: [{ field: "email", message: "Invalid email address" }],
      },
      {
        label: "Entry #3",
        entry: { address: "No name" },
        issues: [{ field: "name", message: "Required" }],
      },
      {
        label: "Entry #4",
        entry: "not even an object",
        issues: [
          { message: "Invalid input: expected object, received string" },
        ],
      },
    ]);
  });

  it("reports every problem with an entry, not just the first", () => {
    const result = mergeImportedContacts<BuyerData>({
      existing: [],
      imported: [{ email: "nope", notes: 42 }],
      schema: buyerSchema,
      contactNoun: "buyer",
      createId,
    });

    expect(
      result.invalidEntries[0]?.issues.map(({ field }) => {
        return field;
      }),
    ).toStrictEqual(["name", "address", "email", "notes"]);
  });
});

describe("describeImportResult", () => {
  it("names only the lists that gained entries", () => {
    expect(
      describeImportResult({
        addedSellerCount: 0,
        addedBuyerCount: 1,
        duplicateCount: 0,
        invalidCount: 0,
        nameConflictCount: 0,
      }),
    ).toStrictEqual({
      tone: "success",
      title: "Imported 1 buyer",
      description: null,
    });

    expect(
      describeImportResult({
        addedSellerCount: 2,
        addedBuyerCount: 1,
        duplicateCount: 0,
        invalidCount: 0,
        nameConflictCount: 0,
      }),
    ).toStrictEqual({
      tone: "success",
      title: "Imported 2 sellers and 1 buyer",
      description: null,
    });
  });

  it("warns when some entries were imported and some were invalid", () => {
    expect(
      describeImportResult({
        addedSellerCount: 2,
        addedBuyerCount: 0,
        duplicateCount: 1,
        invalidCount: 1,
        nameConflictCount: 0,
      }),
    ).toStrictEqual({
      tone: "warning",
      title: "Imported 2 sellers",
      description:
        "1 entry already saved, skipped. 1 entry has invalid data and was not imported.",
    });
  });

  it("says nothing was imported when invalid entries are the reason", () => {
    expect(
      describeImportResult({
        addedSellerCount: 0,
        addedBuyerCount: 0,
        duplicateCount: 0,
        invalidCount: 3,
        nameConflictCount: 0,
      }),
    ).toStrictEqual({
      tone: "error",
      title: "Nothing was imported",
      description: "3 entries have invalid data and were not imported.",
    });
  });

  it("reports names that are already saved", () => {
    expect(
      describeImportResult({
        addedSellerCount: 1,
        addedBuyerCount: 0,
        duplicateCount: 0,
        invalidCount: 1,
        nameConflictCount: 2,
      }),
    ).toStrictEqual({
      tone: "warning",
      title: "Imported 1 seller",
      description:
        "1 entry has invalid data and was not imported. 2 entries use names already saved and were not imported.",
    });

    expect(
      describeImportResult({
        addedSellerCount: 0,
        addedBuyerCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        nameConflictCount: 1,
      }),
    ).toStrictEqual({
      tone: "error",
      title: "Nothing was imported",
      description: "1 entry uses a name already saved and was not imported.",
    });
  });

  it("keeps 'Nothing new to import' for a file that is all already saved", () => {
    expect(
      describeImportResult({
        addedSellerCount: 0,
        addedBuyerCount: 0,
        duplicateCount: 2,
        invalidCount: 0,
        nameConflictCount: 0,
      }),
    ).toStrictEqual({
      tone: "success",
      title: "Nothing new to import",
      description: "2 entries already saved, skipped.",
    });
  });
});
