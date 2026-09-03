import {
  scrubSensitiveUrlParamsBeforeBreadcrumb,
  scrubSensitiveUrlParamsFromEvent,
} from "@/lib/sentry/scrub-sensitive-url-params";

interface IsSentryEnabledArgs {
  /**
   * The opt-in flag: `SENTRY_ENABLED` on the server/edge,
   * `NEXT_PUBLIC_SENTRY_ENABLED` in the browser.
   */
  enabledFlag: string | undefined;
  /**
   * `CI`, so a server started inside a CI job never reports. Omitted in the browser:
   * Next only inlines `NEXT_PUBLIC_*` into the client bundle, so reading it there
   * would always be `undefined` anyway.
   */
  ci?: string | undefined;
}

/**
 * Decides whether Sentry should start up at all.
 *
 * Deliberately env-agnostic: production and preview deployments both report, and the
 * flag in `.env.local` is what turns reporting on for local development. Browser
 * traffic from the e2e suite is excluded separately (the suite runs against a preview
 * deployment, so no env var can tell it apart from a human browsing that same
 * deployment) — see `@/lib/sentry/sentry-e2e-flags`.
 */
export function isSentryEnabled({ enabledFlag, ci }: IsSentryEnabledArgs) {
  if (enabledFlag !== "true") {
    return false;
  }

  if (ci === "true") {
    return false;
  }

  return true;
}

/**
 * Which flag turns each runtime on, so the startup line below names the one to flip.
 */
const SENTRY_ENABLED_FLAG_BY_RUNTIME = {
  browser: "NEXT_PUBLIC_SENTRY_ENABLED",
  server: "SENTRY_ENABLED",
  edge: "SENTRY_ENABLED",
} as const;

type SentryRuntime = keyof typeof SENTRY_ENABLED_FLAG_BY_RUNTIME;

/**
 * Terminal styling, built from the escape's char code rather than a literal escape
 * byte, which is invisible in an editor and easily mangled by tooling.
 */
const ESCAPE = String.fromCodePoint(27);
/** Bold white on red, to read as a warning rather than as a status line. */
const ANSI_BADGE = `${ESCAPE}[1;97;41m`;
/** Bold yellow, for the message that follows the badge. */
const ANSI_MESSAGE = `${ESCAPE}[1;93m`;
const ANSI_RESET = `${ESCAPE}[0m`;

/**
 * Announces, once per runtime startup, that this session reports to Sentry.
 *
 * An enabled SDK is otherwise invisible until something turns up in the dashboard,
 * which makes it easy to forget the flag is on and to mistake real local errors for
 * production noise. Deliberately loud — warning level, warning signs, red badge —
 * because a quiet grey line is exactly what gets scrolled past.
 *
 * Local only: `NODE_ENV` is "production" in every deployed build, where the line would
 * be pure log spam on each cold start (and `next.config.mjs` strips `console` there
 * anyway).
 */
export function logSentryEnabledLocally(runtime: SentryRuntime) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const flag = SENTRY_ENABLED_FLAG_BY_RUNTIME[runtime];
  const detail = `${runtime} SDK is on: errors from this session go to your real Sentry project. Set ${flag}="false" in .env.local to stop.`;

  // `%c` styling is a browser-console feature, the terminal would print it literally.
  //
  // Note the level differs by runtime, and deliberately so: `console.warn` here is
  // swallowed in the edge runtime (the server line prints, the edge one silently does
  // not), while in the browser it is what buys the native yellow warning row. The ANSI
  // badge below is loud enough on its own.
  if (typeof window === "undefined") {
    console.info(
      `${ANSI_BADGE} 🚨 SENTRY ON 🚨 ${ANSI_RESET}${ANSI_MESSAGE} ⚠️  ${detail} ${ANSI_RESET}`,
    );

    return;
  }

  // two `%c` segments so the badge and the message keep their own background and read
  // as one continuous banner
  console.warn(
    `%c 🚨 SENTRY ON 🚨 %c ⚠️ ${detail} `,
    "background:#b91c1c;color:#fff;font-weight:800;font-size:13px;padding:5px 8px;border-radius:4px 0 0 4px",
    "background:#fde68a;color:#7c2d12;font-weight:700;font-size:13px;padding:5px 8px;border-radius:0 4px 4px 0",
  );
}

/**
 * `Sentry.init()` options shared by the browser, server and edge runtimes.
 *
 * Runtime-specific options (Session Replay is browser-only, for example) stay in
 * the config file they belong to.
 */
export const SENTRY_SHARED_INIT_OPTIONS = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Sample % of transactions: performance/cost balance for a production deploy.
  tracesSampleRate: 0.2,

  debug: false,

  // Privacy: the invoice data lives in the `?data=` query param, redact it in
  // every URL we report (request url, referrer, breadcrumbs, spans)
  beforeSend: scrubSensitiveUrlParamsFromEvent,
  beforeSendTransaction: scrubSensitiveUrlParamsFromEvent,
  beforeBreadcrumb: scrubSensitiveUrlParamsBeforeBreadcrumb,
} as const;
