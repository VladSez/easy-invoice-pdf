/**
 * Create a small test image in base64 format (1x1 pixel PNG)
 */
export const SMALL_TEST_IMAGE_BASE64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

/**
 * Upload a base64 image to the logo input
 */
export const uploadBase64LogoAsFile = (base64Data: string) => {
  const fileInput = document.querySelector("#logoUpload") as HTMLInputElement;

  if (fileInput) {
    // Convert base64 data to binary string by removing metadata and decoding
    const byteString = atob(base64Data.split(",")[1]);

    // Extract MIME type from base64 metadata (e.g. "image/png")
    const mimeString = base64Data.split(",")[0].split(":")[1].split(";")[0];

    // Create ArrayBuffer to store binary data
    const ab = new ArrayBuffer(byteString.length);

    // Create Uint8Array view to write bytes to ArrayBuffer
    const ia = new Uint8Array(ab);

    // Convert binary string to bytes and write to array
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // Create File object from ArrayBuffer with name and MIME type
    const file = new File([ab], "test-logo.png", { type: mimeString });

    // Create DataTransfer to simulate file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Set file input's files property and trigger change event
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
