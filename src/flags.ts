import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

/**
 * Local development has no Vercel credentials to evaluate against, so the flag
 * would be stuck off for anyone working on the feature — including a fork with
 * no Vercel account at all. In that build only, an environment variable stands
 * in for the dashboard. It is not the production switch and is ignored on a
 * deployment, where NODE_ENV is always "production".
 */
const isLocalDevelopment = process.env.NODE_ENV === "development";

/**
 * Whether Send invoice is available to this request.
 *
 * Managed in the Vercel dashboard rather than baked into the build, so the
 * feature can be enabled for a subset of users, or switched off entirely,
 * without waiting for a deployment.
 *
 * Evaluation is server-side only. Client components receive the value through
 * `SendInvoiceProvider`, and it is read only where the route is already
 * dynamic — never in the root layout, which would turn every statically
 * rendered SEO page into a dynamic one.
 *
 * `defaultValue` is what a request gets when Vercel Flags cannot be reached:
 * the feature stays off rather than rendering against a Clerk instance that
 * may not be configured.
 */
export const sendInvoiceFlag = flag<boolean>({
  key: "send-invoice",
  description:
    "Send an invoice by email from the user's own Gmail or Outlook mailbox.",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  ...(isLocalDevelopment
    ? { decide: () => process.env.SEND_INVOICE_DEV === "true" }
    : { adapter: vercelAdapter() }),
});
