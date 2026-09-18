# EasyInvoicePDF — Email Sending V1 Plan

## Goal

Ship the smallest production-ready backend that lets an EasyInvoicePDF user:

1. Create an invoice anonymously.
2. Click **Send**.
3. Sign up/sign in with Clerk.
4. Connect one or more Gmail and/or Outlook accounts.
5. Choose which connected mailbox to send from.
6. Send the current invoice PDF as an email attachment.

V1 intentionally has **no database, Drizzle, Polar, recurring invoices, Unkey, API keys, or email history**.

---

## V1 stack

- **Next.js** — existing EasyInvoicePDF frontend.
- **Clerk** — authentication and Google/Microsoft OAuth connections.
- **Hono** — backend API.
- **hono-openapi** — request validation and OpenAPI schema generation.
- **Gmail API** — send from connected Google accounts.
- **Microsoft Graph** — send from connected Microsoft/Outlook accounts.

---

## Architecture

```text
EasyInvoicePDF / Next.js
        │
        │ Clerk session JWT
        ▼
      Hono
        │
        ├── Clerk auth
        ├── OpenAPI validation/docs
        ├── mailbox resolution
        │
        └── sendEmail()
              │
              ├── Clerk OAuth access token
              │
              ├── Gmail API
              │
              └── Microsoft Graph
```

Clerk is the only persistence layer in V1 for identity and connected mailboxes.

---

# 1. Scope

## Included

```text
Clerk
├── authentication
├── Google OAuth
├── Microsoft OAuth
├── multiple Google accounts
├── multiple Microsoft accounts
└── provider OAuth tokens

Hono
├── GET /api/health
├── GET /api/openapi.json
├── GET /api/v1/mailboxes
└── POST /api/v1/emails/send

Email providers
├── Gmail
└── Outlook / Microsoft 365
```

## Explicitly excluded

```text
Database
Drizzle
Polar
Subscriptions
Recurring invoices
Unkey
Public API keys
Email history
Send logs persisted to DB
Server-side invoice persistence
```

---

# 2. Key V1 design decision: multiple mailbox accounts

A Clerk user can connect multiple external accounts from the same provider.

Example:

```text
Clerk user
├── Google
│   ├── personal@gmail.com
│   └── invoices@company.com
│
└── Microsoft
    ├── vlad@outlook.com
    └── billing@company.com
```

EasyInvoicePDF must identify a mailbox using Clerk's **external account ID**, not only the provider.

Never model a sender as:

```ts
provider: "google";
```

because that becomes ambiguous as soon as the user connects two Gmail accounts.

Use:

```ts
type MailboxId = string; // Clerk externalAccount.id
```

The API request should contain:

```ts
externalAccountId: string;
```

The Hono backend resolves the provider, email address, scopes, and OAuth token from Clerk.

---

# 3. Authentication and mailbox authorization

For V1, the user enters the feature by clicking **Send invoice**, so requesting sending scopes immediately is reasonable.

## Google scopes

```text
openid
email
profile
https://www.googleapis.com/auth/gmail.send
```

## Microsoft scopes

```text
openid
email
profile
Mail.Send
```

## First mailbox flow

```text
Anonymous user
      ↓
Create invoice
      ↓
Click Send
      ↓
Choose provider
      │
      ├── Continue with Google
      └── Continue with Microsoft
      ↓
Authentication + send permission
      ↓
Return to EasyInvoicePDF
      ↓
Email composer
```

## Add another mailbox flow

Inside the composer:

```text
From
┌─────────────────────────────┐
│ personal@gmail.com        ✓ │
│ invoices@company.com        │
│ vlad@outlook.com            │
│                             │
│ + Connect Gmail account     │
│ + Connect Outlook account   │
└─────────────────────────────┘
```

Clicking **Connect Gmail account** starts another Clerk Google external-account OAuth flow with `gmail.send`.

Clicking **Connect Outlook account** starts another Microsoft external-account OAuth flow with `Mail.Send`.

After OAuth, return to the Send dialog and automatically select the newly connected account.

---

# 4. Preserve invoice state across OAuth redirects

The user may have spent several minutes editing their invoice before clicking Send.

OAuth must not destroy that state.

Use the existing client-side invoice state persistence.

Recommended flow:

```text
Invoice editor
     ↓
Click Send
     ↓
Persist pending send state locally
     ↓
OAuth redirect
     ↓
Return callback
     ↓
Restore invoice
     ↓
Restore Send dialog
     ↓
Select newly connected mailbox
```

Persist only temporary UI state such as:

```ts
type PendingSendState = {
  returnTo: "send-invoice";
  invoiceId?: string;
  provider?: "google" | "microsoft";
};
```

Do not upload the invoice to a server merely to survive OAuth.

---

# 5. PDF ownership in V1

EasyInvoicePDF already generates the invoice PDF client-side.

Keep that architecture for V1.

```text
Invoice state
     ↓
Existing PDF renderer
     ↓
Blob / File
     ↓
POST multipart/form-data
     ↓
Hono
     ↓
Gmail / Graph
```

This avoids:

- duplicated PDF generation
- server-side React PDF setup
- temporary object storage
- database persistence
- an invoice JSON API contract before it is needed

Recurring invoices will later require server-compatible PDF generation, but that should not block V1.

---

# 6. API surface

Keep the API intentionally tiny.

```text
GET  /api/health
GET  /api/openapi.json
GET  /api/v1/mailboxes
POST /api/v1/emails/send
```

Potential future endpoints such as disconnecting accounts can remain Clerk-driven until there is a real product need.

---

# 7. `GET /api/v1/mailboxes`

Purpose:

Return all connected email-capable Gmail and Microsoft accounts belonging to the authenticated Clerk user.

## Authentication

```text
Authorization: Bearer <Clerk session JWT>
```

## Response

```ts
type Mailbox = {
  id: string;
  provider: "google" | "microsoft";
  email: string;
  label?: string;
  canSend: boolean;
};

type ListMailboxesResponse = {
  data: Mailbox[];
};
```

Example:

```json
{
  "data": [
    {
      "id": "eac_123",
      "provider": "google",
      "email": "personal@gmail.com",
      "canSend": true
    },
    {
      "id": "eac_456",
      "provider": "google",
      "email": "invoices@company.com",
      "canSend": true
    },
    {
      "id": "eac_789",
      "provider": "microsoft",
      "email": "billing@company.com",
      "canSend": true
    }
  ]
}
```

## Server behavior

```text
Clerk session
     ↓
userId
     ↓
Clerk user.externalAccounts
     ↓
filter Google + Microsoft
     ↓
check approved sending scopes
     ↓
normalize provider model
     ↓
return Mailbox[]
```

The frontend should not read raw Clerk external-account structures directly everywhere. Normalize them once in the API.

---

# 8. `POST /api/v1/emails/send`

Use one provider-neutral endpoint.

Do **not** expose:

```text
POST /gmail/send
POST /outlook/send
```

The caller chooses a mailbox, not an implementation.

## Request

```text
POST /api/v1/emails/send
Content-Type: multipart/form-data
Authorization: Bearer <Clerk session JWT>
```

Fields:

```ts
type SendEmailRequest = {
  externalAccountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  invoiceNumber?: string;
  file: File;
};
```

Example conceptual form data:

```text
externalAccountId = eac_456
to = customer@example.com
subject = Invoice INV-2026-001
body = Hi, please find the invoice attached.
invoiceNumber = INV-2026-001
file = invoice.pdf
```

## Success response

```http
HTTP/1.1 202 Accepted
```

```json
{
  "status": "accepted"
}
```

Do not expose Gmail/Graph response shapes to the frontend.

---

# 9. Request pipeline

The send route should do only orchestration.

```text
1. Validate request
2. Authenticate Clerk session
3. Load authenticated Clerk user
4. Find requested externalAccountId
5. Verify the account belongs to this user
6. Verify provider is supported
7. Verify required send scope exists
8. Validate PDF
9. Retrieve fresh provider OAuth token from Clerk
10. Call provider-neutral sendEmail()
11. Map provider response/errors
12. Return 202
```

Never trust these values from the browser:

```text
userId
provider
sender email address
OAuth access token
OAuth scopes
```

The browser only supplies `externalAccountId`.

Everything else is resolved server-side from Clerk.

---

# 10. Hono application structure

```text
src/
├── app/
│   └── api/
│       └── [[...route]]/
│           └── route.ts
│
├── server/
│   ├── app.ts
│   │
│   ├── auth/
│   │   ├── clerk.ts
│   │   └── require-user.ts
│   │
│   ├── routes/
│   │   ├── health.ts
│   │   ├── mailboxes.ts
│   │   └── emails.ts
│   │
│   ├── mail/
│   │   ├── get-mailboxes.ts
│   │   ├── get-access-token.ts
│   │   ├── resolve-mailbox.ts
│   │   ├── send-email.ts
│   │   ├── types.ts
│   │   │
│   │   └── providers/
│   │       ├── gmail.ts
│   │       └── outlook.ts
│   │
│   ├── schemas/
│   │   ├── email.ts
│   │   ├── mailbox.ts
│   │   └── error.ts
│   │
│   ├── errors/
│   │   ├── api-error.ts
│   │   └── map-provider-error.ts
│   │
│   └── openapi/
│       └── document.ts
│
└── features/
    └── send-invoice/
        ├── send-invoice-dialog.tsx
        ├── send-invoice-form.tsx
        ├── mailbox-select.tsx
        ├── connect-mailbox.tsx
        └── use-send-invoice.ts
```

---

# 11. Next.js → Hono adapter

Keep Hono mounted inside the existing Next.js deployment for V1.

```text
app/api/[[...route]]/route.ts
        ↓
hono/vercel
        ↓
src/server/app.ts
```

This gives V1 URLs such as:

```text
https://easyinvoicepdf.com/api/v1/mailboxes
https://easyinvoicepdf.com/api/v1/emails/send
```

Later the same Hono app can move to:

```text
https://api.easyinvoicepdf.com/v1/...
```

without moving provider/business logic out of route handlers because that logic already lives in `src/server/mail`.

---

# 12. Hono app composition

Conceptually:

```text
Hono app
├── request ID middleware
├── error handler
├── Clerk middleware
│
├── GET /health
├── GET /openapi.json
│
└── /v1
    ├── GET /mailboxes
    └── POST /emails/send
```

Only application endpoints need Clerk auth.

---

# 13. OpenAPI

Use the same runtime schemas for validation and OpenAPI generation.

Document Clerk Bearer auth:

```yaml
components:
  securitySchemes:
    clerkAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

Routes:

```text
GET /v1/mailboxes
Security: clerkAuth

POST /v1/emails/send
Security: clerkAuth
Content-Type: multipart/form-data
```

Document responses:

```text
200 mailboxes loaded
202 email accepted
400 invalid request
401 unauthorized
404 mailbox not found
409 mailbox reauthorization required
413 invalid/oversized attachment
429 provider rate limited
500 internal error
502 email provider rejected request
```

Expose generated spec at:

```text
GET /api/openapi.json
```

No public Swagger/Scalar UI is required for V1.

---

# 14. Mailbox resolver

Create one server abstraction:

```ts
type Mailbox = {
  id: string;
  provider: "google" | "microsoft";
  email: string;
  label?: string;
  approvedScopes: string[];
};
```

Function:

```ts
async function resolveMailbox(
  userId: string,
  externalAccountId: string,
): Promise<Mailbox>;
```

Responsibilities:

```text
load Clerk user
     ↓
find external account by id
     ↓
verify it belongs to user
     ↓
normalize provider
     ↓
check send scope
     ↓
return normalized mailbox
```

Provider mapping should live in one place.

---

# 15. OAuth access-token resolver

Create:

```ts
async function getMailboxAccessToken(input: {
  userId: string;
  mailbox: Mailbox;
}): Promise<string>;
```

Flow:

```text
Clerk userId
     ↓
provider
     ↓
getUserOauthAccessToken(userId, provider)
     ↓
find token matching externalAccountId
     ↓
return token
```

This is mandatory for multiple-account support.

Never take the first token returned for a provider.

Incorrect:

```ts
const token = tokens[0];
```

Correct conceptually:

```ts
const token = tokens.find((token) => token.externalAccountId === mailbox.id);
```

Clerk remains responsible for refresh-token handling.

---

# 16. Provider-neutral mail service

Create:

```ts
type SendEmailInput = {
  mailbox: Mailbox;
  accessToken: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachment: {
    filename: string;
    contentType: "application/pdf";
    content: Uint8Array;
  };
};
```

Then:

```text
sendEmail()
   │
   ├── Google
   │     ↓
   │  sendGmail()
   │
   └── Microsoft
         ↓
      sendOutlook()
```

No Gmail or Graph-specific behavior should leak into Hono route handlers.

---

# 17. Gmail implementation

Gmail needs an RFC/MIME message.

```text
Email data
    ↓
MIME multipart/mixed
    ↓
base64url
    ↓
POST Gmail messages.send
```

Message structure:

```text
From
To
Cc
Bcc
Subject
MIME-Version

multipart/mixed
├── text/plain
└── application/pdf
```

Create a dedicated MIME builder and test it independently.

Do not build MIME directly in the route handler.

---

# 18. Outlook implementation

Microsoft Graph is JSON-based.

```text
POST /v1.0/me/sendMail
```

Payload conceptually:

```text
message
├── subject
├── body
├── toRecipients
├── ccRecipients
├── bccRecipients
└── attachments
    └── fileAttachment
         ├── invoice.pdf
         └── contentBytes
```

Normalize a successful Graph `202` into the same EasyInvoicePDF response used for Gmail:

```json
{
  "status": "accepted"
}
```

---

# 19. PDF validation

Validate before calling either provider.

Requirements:

```text
file exists
file is non-empty
content type is application/pdf
filename is safe
size <= 10 MB
first bytes indicate PDF
```

Check the PDF signature:

```text
%PDF-
```

Do not trust only the browser-provided MIME type.

---

# 20. Email-input validation

Validate:

```text
to: at least one recipient
cc/bcc: valid email addresses
subject: max length
body: max length
recipient count: bounded
```

Suggested V1 limits:

```text
To + Cc + Bcc <= 20 recipients
Subject <= 200 characters
Body <= 20,000 characters
PDF <= 10 MB
```

These are EasyInvoicePDF product limits, independent of provider limits.

---

# 21. Header injection protection

Gmail MIME construction makes this especially important.

Reject or normalize CR/LF characters in values that become MIME headers:

```text
subject
filename
sender metadata
```

Recipients should be parsed and serialized through validated email-address handling rather than interpolated blindly.

---

# 22. Error contract

Use one stable API error structure.

```ts
type ApiError = {
  error: {
    code:
      | "unauthorized"
      | "invalid_request"
      | "mailbox_not_found"
      | "mailbox_reauthorization_required"
      | "invalid_attachment"
      | "provider_rate_limited"
      | "provider_rejected_request"
      | "internal_error";
    message: string;
  };
};
```

Suggested mapping:

```text
400 invalid_request
401 unauthorized
404 mailbox_not_found
409 mailbox_reauthorization_required
413 invalid_attachment
429 provider_rate_limited
502 provider_rejected_request
500 internal_error
```

Do not return raw Google or Microsoft API payloads to the client.

---

# 23. Reauthorization handling

A connected mailbox may exist while the required sending permission is missing or expired/revoked.

Example:

```text
GET /mailboxes
→ mailbox canSend = false
```

or:

```text
POST /emails/send
→ 409 mailbox_reauthorization_required
```

Frontend behavior:

```text
Mailbox needs reconnecting

[Reconnect Google]
```

or:

```text
Mailbox needs reconnecting

[Reconnect Outlook]
```

After reauthorization, retry only after explicit user action rather than blindly repeating the send request.

---

# 24. Send-dialog UX

Recommended V1 UI:

```text
┌──────────────────────────────────┐
│ Send invoice                     │
│                                  │
│ From                             │
│ [ personal@gmail.com          ▼ ]│
│                                  │
│ To                               │
│ [ customer@example.com         ] │
│                                  │
│ Subject                          │
│ [ Invoice INV-2026-001         ] │
│                                  │
│ Message                          │
│ [ Hi, please find the invoice ] │
│                                  │
│ Attachment                       │
│ 📄 INV-2026-001.pdf              │
│                                  │
│                         [ Send ] │
└──────────────────────────────────┘
```

Mailbox dropdown:

```text
personal@gmail.com          Google ✓
invoices@company.com        Google
billing@company.com         Outlook
──────────────────────────────────
+ Connect Gmail account
+ Connect Outlook account
```

---

# 25. Default mailbox behavior without a database

Since V1 has no database, EasyInvoicePDF cannot persist a server-side default mailbox.

Use browser-local preference:

```text
localStorage
└── preferredExternalAccountId
```

Rules:

1. If the preferred account still exists and can send, select it.
2. Otherwise select the first send-capable mailbox.
3. When the user manually changes sender, update the local preference.
4. If the mailbox disappears from Clerk, clear the stale preference.

This gives a good UX without introducing persistence solely for one preference.

---

# 26. Connecting additional accounts

Multiple-account support should be explicit in the UI, not hidden inside Clerk's generic account-management page.

Create client actions such as:

```ts
connectGoogleMailbox();
connectMicrosoftMailbox();
```

Their job is to:

```text
persist pending send UI state
     ↓
start Clerk external-account OAuth
     ↓
request provider send scope
     ↓
return to current invoice
     ↓
refresh /v1/mailboxes
     ↓
select new externalAccountId
```

Do not identify a newly added mailbox by email string if Clerk gives you an external account ID.

---

# 27. Same email connected twice

Treat Clerk's external account ID as canonical.

If two external-account records happen to expose the same email address, do not collapse them client-side based only on email.

The unique identifier remains:

```text
externalAccountId
```

Display labels can include provider information if needed:

```text
work@example.com · Google
work@example.com · Microsoft
```

---

# 28. Testing

## Unit tests

Test:

```text
email request schema
mailbox normalization
scope checks
Gmail MIME builder
Gmail base64url encoding
Graph payload builder
provider error mapping
PDF validation
header injection protection
```

## Route tests

Use `app.request()` and mock Clerk/provider HTTP calls.

Required cases:

```text
unauthenticated → 401
unknown externalAccountId → 404
external account belongs to another user → 404/401-safe behavior
unsupported provider → 404/400
mailbox without send scope → 409
invalid recipient → 400
non-PDF → 400/413
oversized PDF → 413
Gmail success → 202
Outlook success → 202
Gmail 429 → 429
Graph 429 → 429
provider 5xx → 502
```

## Multiple-account tests

Explicitly test:

```text
two Gmail accounts connected
send using Gmail account A
send using Gmail account B
correct Clerk token selected for each externalAccountId

Gmail + Outlook connected
send from Google
send from Microsoft
correct provider adapter selected

remove/revoke one mailbox
other mailbox continues working
```

## E2E

Use dedicated test accounts:

```text
Google account A
Google account B
Microsoft account A
```

Verify:

```text
connect Google A
connect Google B
connect Microsoft
switch sender
send from each mailbox
recipient receives PDF
message appears under correct provider account's Sent folder
invoice state survives each OAuth redirect
```

---

# 29. Observability

Generate a request ID for every API request.

Log:

```text
requestId
Clerk userId
provider
externalAccountId
recipientCount
attachmentSize
provider HTTP status
duration
```

Never log:

```text
OAuth access tokens
PDF contents
email body
raw MIME message
full provider responses containing sensitive content
```

Use the external account ID in logs so multiple-mailbox bugs are diagnosable.

---

# 30. No automatic retries in V1

Without persistence there is no strong idempotency guarantee.

Failure scenario:

```text
Hono sends Gmail message successfully
        ↓
connection dies before frontend receives 202
        ↓
frontend retries automatically
        ↓
duplicate invoice email
```

Therefore:

- do not automatically retry `POST /emails/send`
- show a clear ambiguous-failure state if necessary
- let the user decide whether to retry

A future persistent send-attempt/idempotency model can solve this when recurring invoices are introduced.

---

# 31. Implementation order

## Phase 1 — API foundation

1. Install/configure Hono in the existing Next.js application.
2. Add `GET /api/health`.
3. Configure `hono-openapi`.
4. Add shared error schema.
5. Add `GET /api/openapi.json`.
6. Add request-ID/error middleware.

## Phase 2 — Clerk

7. Configure Clerk production environment.
8. Configure Google OAuth application.
9. Configure Microsoft OAuth application.
10. Request `gmail.send` for mail-enabled Google connections.
11. Request `Mail.Send` for mail-enabled Microsoft connections.
12. Start Google OAuth verification early.
13. Add Clerk middleware to Hono.
14. Add authenticated-user helper.

## Phase 3 — Multiple mailbox accounts

15. Implement normalized `Mailbox` model.
16. Implement Clerk external-account → mailbox normalization.
17. Implement required-scope checks.
18. Implement `GET /api/v1/mailboxes`.
19. Implement token lookup by `externalAccountId`.
20. Add Google "connect another account" flow.
21. Add Microsoft "connect another account" flow.
22. Preserve Send dialog state across OAuth redirects.
23. Add browser-local preferred sender.

## Phase 4 — Email providers

24. Implement PDF validation.
25. Implement Gmail MIME builder.
26. Implement Gmail adapter.
27. Implement Microsoft Graph adapter.
28. Implement provider-neutral `sendEmail()`.
29. Implement provider error normalization.

## Phase 5 — Send API

30. Define multipart send schema.
31. Document it through OpenAPI.
32. Implement `POST /api/v1/emails/send`.
33. Resolve the selected external account from Clerk.
34. Verify ownership and scopes.
35. Retrieve the matching OAuth access token.
36. Send through the correct adapter.
37. Return normalized `202 Accepted`.

## Phase 6 — Frontend

38. Add **Send** next to existing PDF/download actions.
39. Add unauthenticated provider chooser.
40. Add Send dialog.
41. Add mailbox selector.
42. Add **Connect Gmail account**.
43. Add **Connect Outlook account**.
44. Refresh mailbox list after connection.
45. Automatically select the newly connected mailbox.
46. Generate PDF with the existing client-side renderer.
47. Submit multipart request to Hono.
48. Add success/error states.
49. Add reconnect UX for `mailbox_reauthorization_required`.

## Phase 7 — Testing/release

50. Add unit tests.
51. Add Hono route tests.
52. Add multiple-account test cases.
53. Run real Gmail + Outlook E2E tests.
54. Verify OAuth redirect state restoration.
55. Verify OpenAPI spec.
56. Add production logging/monitoring.
57. Release behind a feature flag if desired.

---

# 32. Definition of done

V1 is complete when a brand-new anonymous EasyInvoicePDF user can:

```text
create invoice
     ↓
click Send
     ↓
sign up with Google or Microsoft
     ↓
approve send permission
     ↓
return to unchanged invoice
     ↓
open composer
     ↓
send invoice.pdf
     ↓
connect another Gmail/Outlook mailbox
     ↓
switch From account
     ↓
send from that mailbox too
```

and all of this works with:

```text
Clerk
Hono
hono-openapi
Gmail API
Microsoft Graph
```

with **no EasyInvoicePDF database or persistent backend storage**.

---

# 33. Future migration path

V1 deliberately leaves clean extension points.

```text
V1
├── Clerk
├── Hono
├── OpenAPI
└── Send email

V2+
├── Drizzle/Postgres
│   ├── recurring invoices
│   └── execution history
│
├── Polar
│   └── paid entitlements
│
├── Unkey
│   └── public API keys + limits
│
└── server-side invoice generation
```

The important reusable seam is:

```text
sendInvoice()
     ↓
generate/receive PDF
     ↓
sendEmail()
     ↓
Gmail / Graph
```

When recurring invoices arrive, server-side generation can be inserted before `sendEmail()` without redesigning mailbox auth or provider adapters.
