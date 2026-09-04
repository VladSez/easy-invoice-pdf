import { expect, test } from "@playwright/test";

/**
 * `GET /api/generate-invoice` generates the monthly invoice, emails it and uploads
 * it to Google Drive, so it is guarded by a bearer token. We only test the
 * **rejected** paths here — the happy path has real side effects (emails, uploads)
 * and is covered by unit tests instead.
 */
test.describe("Generate invoice API route", () => {
  // this is a plain HTTP test, no need to run it once per browser project
  test.beforeEach(({}, testInfo) => {
    // eslint-disable-next-line playwright/no-skipped-test -- HTTP only test, Desktop Chrome only
    test.skip(
      testInfo.project.name !== "Desktop Chrome",
      "API route test does not depend on the browser",
    );
  });

  test("responds with 401 when the Authorization header is missing", async ({
    request,
  }) => {
    const response = await request.get("/api/generate-invoice");

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("responds with 401 when the bearer token is wrong", async ({
    request,
  }) => {
    const response = await request.get("/api/generate-invoice", {
      headers: { Authorization: "Bearer definitely-not-the-auth-token" },
    });

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  test("responds with 401 for a non-bearer Authorization header", async ({
    request,
  }) => {
    const response = await request.get("/api/generate-invoice", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });
});
