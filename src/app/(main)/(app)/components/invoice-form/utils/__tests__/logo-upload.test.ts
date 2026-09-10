// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  convertFileToBase64,
  MAX_LOGO_SIZE_IN_BYTES,
  validateImageSize,
} from "../logo-upload";

/**
 * Build a File of an exact byte length without allocating it.
 *
 * `validateImageSize` only ever reads `.size`, and the boundary cases are
 * megabytes wide, so a stubbed size keeps the tests cheap and exact.
 */
function createFileOfSize(sizeInBytes: number): File {
  const file = new File([], "logo.png", { type: "image/png" });

  Object.defineProperty(file, "size", { value: sizeInBytes });

  return file;
}

describe("MAX_LOGO_SIZE_IN_BYTES", () => {
  it("is 3MB, matching the limit shown to the user in the upload field", () => {
    expect(MAX_LOGO_SIZE_IN_BYTES).toBe(3_145_728);
  });
});

describe("validateImageSize", () => {
  it("accepts a file comfortably under the limit", async () => {
    await expect(validateImageSize(createFileOfSize(1024))).resolves.toBe(true);
  });

  it("accepts an empty file", async () => {
    await expect(validateImageSize(createFileOfSize(0))).resolves.toBe(true);
  });

  it("accepts a file exactly on the limit", async () => {
    await expect(
      validateImageSize(createFileOfSize(MAX_LOGO_SIZE_IN_BYTES)),
    ).resolves.toBe(true);
  });

  it("rejects a file one byte over the limit", async () => {
    await expect(
      validateImageSize(createFileOfSize(MAX_LOGO_SIZE_IN_BYTES + 1)),
    ).resolves.toBe(false);
  });

  it("rejects a file far over the limit", async () => {
    await expect(
      validateImageSize(createFileOfSize(MAX_LOGO_SIZE_IN_BYTES * 10)),
    ).resolves.toBe(false);
  });
});

describe("convertFileToBase64", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves a data URL carrying the file's MIME type", async () => {
    const file = new File(["hello"], "logo.png", { type: "image/png" });

    const result = await convertFileToBase64(file);

    expect(result).toBe(`data:image/png;base64,${btoa("hello")}`);
  });

  it("round trips the file contents", async () => {
    const contents = "some file contents";
    const file = new File([contents], "logo.webp", { type: "image/webp" });

    const result = await convertFileToBase64(file);
    const [, base64] = result.split(",");

    expect(result.startsWith("data:image/webp;base64,")).toBe(true);
    expect(atob(base64)).toBe(contents);
  });

  it("handles an empty file", async () => {
    const file = new File([], "logo.jpg", { type: "image/jpeg" });

    await expect(convertFileToBase64(file)).resolves.toBe(
      "data:image/jpeg;base64,",
    );
  });

  it("rejects when the file cannot be read", async () => {
    const error = new Event("error");

    // happy-dom's FileReader never fails on an in-memory File, so the failure
    // path is exercised with a stand-in that only ever errors.
    class FailingFileReader extends EventTarget {
      result = null;

      readAsDataURL() {
        queueMicrotask(() => {
          return this.dispatchEvent(error);
        });
      }
    }

    vi.stubGlobal("FileReader", FailingFileReader);

    const file = new File(["hello"], "logo.png", { type: "image/png" });

    await expect(convertFileToBase64(file)).rejects.toBe(error);
  });
});
