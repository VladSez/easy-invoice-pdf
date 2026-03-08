import QRCode, { type QRCodeErrorCorrectionLevel } from "qrcode";

/**
 * The minimum pixel width for the generated QR code image.
 * Ensures that the QR code is always large enough to be easily scannable,
 * regardless of how short the encoded data is.
 */
const MIN_WIDTH = 300;

/**
 * The maximum pixel width for the generated QR code image.
 * Prevents the QR code from becoming overly large for very long strings,
 * balancing file size and readability.
 */
const MAX_WIDTH = 500;

/**
 * The length threshold (number of characters) to determine when to lower the
 * QR code's error correction level.
 * For inputs longer than this value, a lower error correction level ("L") is used
 * to prevent the QR code from becoming too dense and difficult to scan.
 */
const LONG_INPUT_THRESHOLD = 300;

/**
 * Calculates the pixel width for the QR code image based on the length of the input data.
 * Ensures that the QR code maintains module size (pixels per module) so the code remains scannable,
 * especially for longer inputs which require more modules.
 *
 * @param {number} dataLength - The length of the data string to be encoded in the QR code.
 * @returns {number} The calculated width (in pixels) for the QR code image, clamped between MIN_WIDTH and MAX_WIDTH.
 */
function getQrPixelWidth(dataLength: number): number {
  const scaled = Math.ceil((dataLength / 100) * 100) + 200;
  return Math.min(Math.max(scaled, MIN_WIDTH), MAX_WIDTH);
}

/**
 * Determines the QR code error correction level based on the length of input data.
 *
 * Uses a lower error correction level ("L") for very long input to prevent the QR code from becoming unreasonably dense,
 * and medium level ("M") for normal-length data to balance robustness and code size.
 *
 * @param dataLength - The length of the data string to be encoded in the QR code.
 * @returns The error correction level ("L" or "M") for QR code generation.
 */
function getErrorCorrectionLevel(
  dataLength: number,
): QRCodeErrorCorrectionLevel {
  return dataLength > LONG_INPUT_THRESHOLD ? "L" : "M";
}

/**
 * Generate a QR code as a base64 data URL
 *
 * @param data - The string data to encode in the QR code
 * @returns Promise<string> - Base64 data URL of the QR code image
 */
export async function generateQrCodeDataUrl(data: string): Promise<string> {
  if (!data || data.trim() === "") {
    return "";
  }

  try {
    const errorCorrectionLevel = getErrorCorrectionLevel(data.length);
    const pixelWidth = getQrPixelWidth(data.length);

    const dataUrl = await QRCode.toDataURL(data, {
      type: "image/png",
      errorCorrectionLevel,
      margin: 2,
      width: pixelWidth,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}
