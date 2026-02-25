import QRCode from "qrcode";

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
    const dataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 200, // Generate at 2x resolution for crisp rendering
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
