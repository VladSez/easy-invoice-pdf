import type { ContentfulStatusCode } from "hono/utils/http-status";

import { EmailDomainError } from "@/lib/email/types";

export interface AppEnv {
  Variables: {
    requestId: string;
    /**
     * Set by the session check each protected route registers ahead of its
     * validator, so only handlers behind that check may read it.
     */
    userId: string;
  };
}

export function errorResponse(error: EmailDomainError) {
  return { error: { code: error.code, message: error.message } };
}

export function errorStatus(error: EmailDomainError): ContentfulStatusCode {
  return error.status as ContentfulStatusCode;
}

/** Converts Zod validation failures into the API's stable error envelope. */
export const invalidRequestHook = (result: { success: boolean }) =>
  result.success
    ? undefined
    : Response.json(
        errorResponse(
          new EmailDomainError("invalid_request", "Invalid request", 400),
        ),
        { status: 400 },
      );
