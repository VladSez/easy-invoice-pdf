import type { Breadcrumb, Event } from "@sentry/nextjs";

/**
 * Query params that carry user data and must never reach Sentry.
 *
 * `data` holds the compressed invoice (seller/buyer details, addresses, VAT ids,
 * line items), see `src/utils/url-compression.ts`.
 */
const SENSITIVE_QUERY_PARAMS = ["data"] as const;

/**
 * Replaces the value of a sensitive param, so the event still tells us an invoice
 * URL was involved without carrying the invoice itself. Matches what Sentry's own
 * server-side scrubbing uses.
 */
const REDACTED_VALUE = "[Filtered]";

/** `URLSearchParams` percent-encodes the brackets, undo that so it stays readable in Sentry. */
const ENCODED_REDACTED_VALUE = encodeURIComponent(REDACTED_VALUE);

/** Span/context attribute keys that hold a full URL. */
const URL_ATTRIBUTE_KEYS = [
  "url",
  "url.full",
  "http.url",
  "http.target",
] as const;

/** Span/context attribute keys that hold a bare query string. */
const QUERY_ATTRIBUTE_KEYS = ["url.query", "http.query"] as const;

/** Breadcrumb data keys that hold a URL (`from`/`to` come from navigation breadcrumbs). */
const BREADCRUMB_URL_KEYS = ["url", "from", "to"] as const;

/**
 * Redact sensitive params in a bare query string (no leading `?`).
 *
 * Returns the input untouched when there is nothing to redact, so unrelated
 * params keep their original encoding.
 */
function scrubQueryString(queryString: string) {
  if (!queryString) {
    return queryString;
  }

  const hasLeadingQuestionMark = queryString.startsWith("?");
  const rawQuery = hasLeadingQuestionMark ? queryString.slice(1) : queryString;

  const params = new URLSearchParams(rawQuery);

  const hasSensitiveParam = SENSITIVE_QUERY_PARAMS.some((param) =>
    params.has(param),
  );

  if (!hasSensitiveParam) {
    return queryString;
  }

  for (const param of SENSITIVE_QUERY_PARAMS) {
    if (params.has(param)) {
      params.set(param, REDACTED_VALUE);
    }
  }

  const scrubbedQuery = params
    .toString()
    .replaceAll(ENCODED_REDACTED_VALUE, REDACTED_VALUE);

  return hasLeadingQuestionMark ? `?${scrubbedQuery}` : scrubbedQuery;
}

/**
 * Redact sensitive params in a URL, keeping everything else intact.
 *
 * Works with absolute URLs, relative paths and hashes:
 * `/en?data=abc&foo=1#bar` -> `/en?data=[Filtered]&foo=1#bar`
 */
export function scrubUrl(url: string) {
  if (!url?.includes("?")) {
    return url;
  }

  const hashIndex = url.indexOf("#");
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);
  const urlWithoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);

  const queryIndex = urlWithoutHash.indexOf("?");

  // The `?` we matched on lives inside the hash, nothing to scrub
  if (queryIndex === -1) {
    return url;
  }

  const base = urlWithoutHash.slice(0, queryIndex);
  const scrubbedQuery = scrubQueryString(urlWithoutHash.slice(queryIndex + 1));

  return scrubbedQuery ? `${base}?${scrubbedQuery}${hash}` : `${base}${hash}`;
}

function scrubAttributes(attributes: Record<string, unknown> | undefined) {
  if (!attributes) {
    return;
  }

  for (const key of URL_ATTRIBUTE_KEYS) {
    const value = attributes[key];

    if (typeof value === "string") {
      attributes[key] = scrubUrl(value);
    }
  }

  for (const key of QUERY_ATTRIBUTE_KEYS) {
    const value = attributes[key];

    if (typeof value === "string") {
      attributes[key] = scrubQueryString(value);
    }
  }
}

function scrubBreadcrumb(breadcrumb: Breadcrumb) {
  const data = breadcrumb.data;

  if (!data) {
    return;
  }

  for (const key of BREADCRUMB_URL_KEYS) {
    const value: unknown = data[key];

    if (typeof value === "string") {
      data[key] = scrubUrl(value);
    }
  }
}

/**
 * Redact sensitive query params in every place Sentry stores a URL on an event:
 * the request url/query string, the referrer header, breadcrumbs and span data.
 *
 * Used as the `beforeSend` and `beforeSendTransaction` hook. Mutates and returns
 * the event, as Sentry expects.
 */
export function scrubSensitiveUrlParamsFromEvent<T extends Event>(event: T): T {
  const request = event.request;

  if (request) {
    if (typeof request.url === "string") {
      request.url = scrubUrl(request.url);
    }

    if (typeof request.query_string === "string") {
      request.query_string = scrubQueryString(request.query_string);
    }

    const headers = request.headers;

    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === "referer" && typeof value === "string") {
          headers[key] = scrubUrl(value);
        }
      }
    }
  }

  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      scrubBreadcrumb(breadcrumb);
    }
  }

  scrubAttributes(event.contexts?.trace?.data);

  if (event.spans) {
    for (const span of event.spans) {
      scrubAttributes(span.data);
    }
  }

  return event;
}

/**
 * Sentry `beforeBreadcrumb` hook: scrubs URLs as breadcrumbs are recorded, so
 * they are already clean if they get attached to a later event.
 */
export function scrubSensitiveUrlParamsBeforeBreadcrumb(
  breadcrumb: Breadcrumb,
): Breadcrumb {
  scrubBreadcrumb(breadcrumb);

  return breadcrumb;
}
