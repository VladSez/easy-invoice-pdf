import type { z } from "zod";

import { DEFAULT_BUYER_DATA, DEFAULT_SELLER_DATA } from "@/app/constants";
import {
  BUYERS_LOCAL_STORAGE_KEY,
  SELLERS_LOCAL_STORAGE_KEY,
  buyerSchema,
  sellerSchema,
  type BuyerData,
  type LocalStorageKey,
  type SellerData,
} from "@/app/schema";

/**
 * The two sides of an invoice. Sellers and buyers are saved, listed, edited and deleted
 * the same way; everything that differs between them is in {@link PARTY_CONFIG}.
 */
export type Party = "seller" | "buyer";

interface PartyDataMap {
  seller: SellerData;
  buyer: BuyerData;
}

export type PartyData<P extends Party> = PartyDataMap[P];

interface PartyConfig<P extends Party> {
  /** Capitalized name, as used in toasts: "Seller added successfully". */
  label: string;
  /** Where the saved list lives in `localStorage`. */
  storageKey: LocalStorageKey;
  /** Every saved entry must pass it; entries that do not are dropped on load. */
  schema: z.ZodType<PartyData<P>>;
  /** What the invoice shows when no saved party is selected. */
  defaultData: PartyData<P>;
}

export const PARTY_CONFIG: { [P in Party]: PartyConfig<P> } = {
  seller: {
    label: "Seller",
    storageKey: SELLERS_LOCAL_STORAGE_KEY,
    schema: sellerSchema,
    defaultData: DEFAULT_SELLER_DATA,
  },
  buyer: {
    label: "Buyer",
    storageKey: BUYERS_LOCAL_STORAGE_KEY,
    schema: buyerSchema,
    defaultData: DEFAULT_BUYER_DATA,
  },
};
