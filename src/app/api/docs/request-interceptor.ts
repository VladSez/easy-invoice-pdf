/**
 * Attaches a Clerk session token to the requests Swagger UI sends.
 *
 * Clerk session tokens expire 60 seconds after they are minted, so a token
 * pasted into Swagger's `Authorize` dialog is usually dead by the time a
 * request with a file upload has been filled in — which reads as an endpoint
 * that "always" returns 401. Minting one per request through `getToken()`
 * removes that whole class of confusing failures: ClerkJS refreshes the session
 * in the background and hands out a current token each time.
 */

/**
 * The part of Swagger's request object this touches. Every field is optional
 * because Swagger types it as a bare index signature.
 */
export interface SwaggerRequest {
  url?: string;
  headers?: Record<string, string>;
  [key: string]: unknown;
}

export function createRequestInterceptor({
  getToken,
  getOrigin,
}: {
  getToken: () => Promise<string | null>;
  /**
   * This app's origin, read per request because the interceptor runs in the
   * browser while the component around it also renders on the server.
   */
  getOrigin: () => string;
}) {
  return async (request: SwaggerRequest): Promise<SwaggerRequest> => {
    // An OpenAPI document can name external servers, and Swagger sends
    // whichever URL the operation resolves to. A session token is a bearer
    // credential for this app, so it must never be attached to a request
    // leaving this origin.
    if (typeof request.url !== "string") {
      return request;
    }

    const origin = getOrigin();

    let requestOrigin: string;
    try {
      requestOrigin = new URL(request.url, origin).origin;
    } catch {
      // An unparseable URL is not this origin, so send it untouched.
      return request;
    }

    if (requestOrigin !== origin) {
      return request;
    }

    const token = await getToken();

    // Leaving the header alone keeps a manually entered token working when
    // there is no session in this browser.
    if (token) {
      request.headers = {
        ...request.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    return request;
  };
}
