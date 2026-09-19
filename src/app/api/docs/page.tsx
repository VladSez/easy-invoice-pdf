import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { sendInvoiceFlag } from "@/flags";

import { SwaggerDocs } from "./swagger-docs";

/**
 * Local API explorer for the Hono send API.
 *
 * Rendered from Next rather than served by Hono so it can mint a token per
 * request with `getToken()`, which needs a `ClerkProvider` — mounted here
 * because this route sits outside the (app) group that carries one. It keeps
 * the `/api/docs` URL because Next matches this static `docs` segment ahead of
 * the `[[...route]]` catch-all that mounts Hono, so the request never reaches
 * the Hono app.
 *
 * It is available on the same terms as the schema it reads: development only
 * (see src/server/api/openapi.ts) and only while the send feature is on, since
 * there is no API to explore otherwise.
 */
export const metadata: Metadata = {
  title: "Send API docs",
  robots: { index: false, follow: false },
};

export default async function ApiDocsPage() {
  const isApiDocsEnabled =
    process.env.NODE_ENV === "development" && (await sendInvoiceFlag());

  if (!isApiDocsEnabled) {
    notFound();
  }

  return (
    <ClerkProvider>
      <SwaggerDocs />
    </ClerkProvider>
  );
}
