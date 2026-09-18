# Send Invoice provider readiness

Keep the `send-invoice` flag off in Production until both providers pass these
external launch checks. Enabling it for your own account first — through
targeting in the Vercel dashboard — is the intended way to work through them.

## Clerk

- [ ] Configure production domain, legal links, session settings, and redirect
      URLs for `/sso-callback` and the root return URL `/`.
- [ ] Enable multiple external accounts and verify that each Clerk external
      account ID maps to exactly one selectable mailbox and OAuth token.
- [ ] Test new users, returning users, denied consent, revoked access, and the
      standard Clerk account button.

## Gmail

- [ ] Use a dedicated production Google Cloud project and configure it through
      Clerk's Google social connection.
- [ ] Request only identity scopes plus
      `https://www.googleapis.com/auth/gmail.send`.
- [ ] Complete Google's sensitive-scope verification and test two Gmail
      accounts, exact sender identity, Unicode, Sent mail, and token renewal.

## Microsoft

- [ ] Configure Clerk's Microsoft connection for organizational and personal
      accounts.
- [ ] Request delegated `Mail.Send`; do not request application `Mail.Send` or
      `Mail.Send.Shared`.
- [ ] Test Outlook.com, Microsoft 365, two linked accounts, tenant consent,
      missing mailbox, Unicode, Sent Items, and token renewal.

## Cross-provider

- [ ] Test both invoice templates and PDFs near the 2.5 MB limit.
- [ ] Confirm the API rejects a mailbox ID belonging to another user.
- [ ] Confirm missing send scopes show reconnect rather than attempting delivery.
- [ ] Confirm interrupted requests never retry automatically and the UI tells
      users to check Sent before retrying.
