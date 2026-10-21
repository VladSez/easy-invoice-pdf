# Paid tier: privacy policy and ToS draft

Status: **draft, not legal advice.** Have it reviewed before launch. It ships with the dashboard launch (M4–M5), not with M0.

The free app's promise doesn't change. These texts add a second, clearly separate product with its own rules.

## What changes on `/tos`

Section 8, "No Data Storage", is replaced by two sections:

> **8. Free invoice generator (easyinvoicepdf.com)**
> The free invoice generator needs no account. Everything you enter stays in your browser. We do not store, transmit or retain that invoice data on any server. You are responsible for saving and backing up your data.
>
> **9. EasyInvoicePDF accounts (app.easyinvoicepdf.com and api.easyinvoicepdf.com)**
> If you create an account, we store the data you choose to save there (see the Privacy Policy) so we can provide the dashboard, the API and the AI-assistant (MCP) integration. Using the free generator never sends data to your account, even while you are signed in.

New sections to add:

- **Accounts.** You must give accurate sign-in details and keep access to your email and Google account secure. You are responsible for everything done with your account, its API keys and the AI assistants you connect.
- **API keys and connected assistants.** API keys and assistant connections act on your behalf. Revoke them from the dashboard if they leak. We can disable keys or connections that break the acceptable-use rules or the rate limits.
- **Paid plans and billing.** Purchases are processed by **Polar** (polar.sh), which is the merchant of record and the seller of record for your purchase. Polar's terms apply to payment, taxes, invoices for your subscription, refunds and chargebacks. You manage or cancel your subscription in the customer portal linked from the dashboard. Cancelling stops renewal at the end of the paid period.
- **Usage limits.** Plans include limits (for example, PDF renders per month). Requests beyond them can be refused or, on plans with usage pricing, billed through Polar.
- **Ending your account.** You can delete your account at any time. We can suspend or close accounts that break these terms, and we'll give notice where possible so you can export your data first.

## Privacy policy (new page, `/privacy`)

**Who is responsible.** The data controller is [legal name and address, to be filled in]. Contact: vlad@mail.easyinvoicepdf.com.

**The free generator.** No account, nothing stored on our servers. We use privacy-friendly, cookie-free analytics (Umami) to count page views, and error reporting (Sentry) with invoice contents removed.

**What we store when you have an account**

| Data                                                           | Why                                   | Kept for                                                  |
| -------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------- |
| Email, name, profile picture (if you sign in with Google)      | sign-in, account emails               | until you delete your account                             |
| Invoices, sellers and buyers you save                          | to provide the dashboard, API and MCP | until you delete them or your account                     |
| API keys (stored only as a one-way hash), connected assistants | to authenticate requests              | until revoked or the account is deleted                   |
| Usage records (render counts, timestamps)                      | limits and usage billing              | [N] months, then aggregated                               |
| Request logs (route, status, timing, never invoice contents)   | security and debugging                | [N] days                                                  |
| Billing status from Polar (plan, subscription state)           | to unlock paid features               | as long as the account exists, plus what tax law requires |

We do not store your card details: Polar processes payments. We do not sell data or use invoice contents to train models.

**Processors** (fill in regions once hosting is chosen): database host [Neon / Railway], API host [Vercel / Railway], email (Resend), rate limiting (Upstash), error tracking (Sentry, with request bodies scrubbed), payments (Polar, as an independent merchant of record), sign-in (Google, only if you choose it).

**AI assistants you connect.** When you connect an assistant such as Claude, ChatGPT or Cursor through MCP, the invoice data it requests goes to that assistant's provider under _their_ terms. You choose which assistants to connect, and you can revoke them at any time.

**Your rights.**

- **Export:** download every saved invoice as JSON from the dashboard. The format is the same one the free generator imports.
- **Deletion:** deleting your account removes your invoices, keys, connections and usage records from the live database right away, and from backups within [N] days.
- **Access, correction, objection, complaint:** email us, or contact your data protection authority.

**Legal bases (GDPR).** Contract (providing the account), legitimate interest (security, abuse prevention, error tracking), legal obligation (tax records kept by Polar).

## Copy updates elsewhere

- Landing page, `/about`, `/how-it-works`: keep "no sign-up, your data stays in your browser" for the free generator, and add one line that an optional account with a dashboard and API exists.
- Dashboard sign-up screen: a link to the privacy policy and ToS, and a sentence saying invoices saved in the dashboard are stored on our servers.

## Coverage check

- Storage: the "What we store" table, ToS section 9.
- Deletion: "Your rights", "Ending your account".
- Export: "Your rights".
- Polar as merchant of record: "Paid plans and billing", "Processors".
