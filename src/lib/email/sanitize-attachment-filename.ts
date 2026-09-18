const MAX_ATTACHMENT_FILENAME_LENGTH = 100;
const PDF_EXTENSION = ".pdf";

/** Normalizes an untrusted attachment name to a short PDF-safe filename. */
export function sanitizeAttachmentFilename(value: string) {
  // Explanation of the normalization process:
  // 1. value.normalize("NFKD"): Decomposes unicode characters (e.g., é -> e +  ́ ).
  // 2. .replace(/\p{M}+/gu, ""): Removes all diacritic marks left from the decomposition.
  // 3. .toLowerCase(): Converts the string to lowercase.
  // 4. .replace(/[^a-z0-9._-]+/g, "-"): Replaces any character NOT a-z, 0-9, ., _, or - with a hyphen.
  // 5. .replace(/-{2,}/g, "-"): Replaces multiple consecutive hyphens with a single hyphen.
  // 6. .replace(/^-|-$/g, ""): Removes any leading or trailing hyphens.
  const normalized = value
    .normalize("NFKD") // Decompose accented characters
    .replaceAll(/\p{M}+/gu, "") // Remove diacritics
    .toLowerCase() // Convert to lowercase
    .replaceAll(/[^a-z0-9._-]+/g, "-") // Replace invalid characters with hyphen
    .replaceAll(/-{2,}/g, "-") // Collapse multiple hyphens
    .replaceAll(/^-|-$/g, ""); // Trim leading/trailing hyphens

  const filenameWithoutPdfSuffix = normalized.replaceAll(/(?:\.pdf)+$/g, "");
  const maximumBaseLength =
    MAX_ATTACHMENT_FILENAME_LENGTH - PDF_EXTENSION.length;

  const filenameBase = filenameWithoutPdfSuffix
    .slice(0, maximumBaseLength)
    .replaceAll(/[.-]+$/g, "");

  return `${filenameBase || "invoice"}${PDF_EXTENSION}`;
}
