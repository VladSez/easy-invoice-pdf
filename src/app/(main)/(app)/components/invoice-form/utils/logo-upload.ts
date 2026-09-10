/**
 * Largest company logo we accept, in bytes.
 *
 * The logo is stored inside the invoice itself (base64, in `localStorage` and in
 * the `?data=` share link), so its size is a hard budget rather than a cosmetic
 * limit.
 */
export const MAX_LOGO_SIZE_IN_BYTES = 3 * 1024 * 1024; // 3MB in bytes

/**
 * Check that a logo file is within {@link MAX_LOGO_SIZE_IN_BYTES}.
 *
 * @param file - The file the user picked.
 * @returns True when the file is at most 3MB.
 */
export function validateImageSize(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    resolve(file.size <= MAX_LOGO_SIZE_IN_BYTES);
  });
}

/**
 * Read a logo file as a base64 `data:` URL, the form the invoice stores it in.
 *
 * @param file - The file the user picked.
 * @returns The file as a `data:<mime>;base64,<...>` string.
 * @throws Rejects with the `FileReader` error event when the file cannot be read.
 */
export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      return resolve(reader.result as string);
    });
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}
