/**
 * Shared by the Swagger UI page at `/api/docs` (src/app/api/docs/page.tsx) and
 * the Hono app that serves the document (src/server/api/openapi.ts).
 *
 * Kept dependency-free so the browser bundle for the docs page does not pull in
 * the server's OpenAPI wiring just to learn where the document lives.
 */
export const OPENAPI_DOCUMENT_PATH = "/api/openapi.json";
