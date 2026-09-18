/**
 * Copy overrides for Clerk's prebuilt authentication UI.
 *
 * Clerk's default subtitle — "Welcome back! Please sign in to continue" —
 * describes signing in and nothing else, which leaves the provider's consent
 * screen arriving unannounced. Sending an invoice is the only route into
 * sign-in here, so the send permission is not a surprise to be sprung: saying
 * up front what will be asked for, and that it has to be approved, is what
 * makes the next screen legible.
 *
 * That matters most on Google, which presents "Send email on your behalf" as
 * a checkbox that starts unchecked. Clicking straight through grants nothing,
 * and priming the user here is the only chance to prevent that; the connect
 * view can then explain the miss after the fact.
 *
 * Keys mirror Clerk's own localization resource, so only the strings named
 * here change and everything else keeps Clerk's defaults.
 */
const SEND_PERMISSION_SUBTITLE =
  "Sign in to send invoices from your own mailbox. Google and Microsoft will ask for permission to send email on your behalf - approve it to continue.";

export const clerkLocalization = {
  signIn: {
    start: {
      subtitle: SEND_PERMISSION_SUBTITLE,
    },
  },
  signUp: {
    start: {
      subtitle: SEND_PERMISSION_SUBTITLE,
    },
  },
};
