/** Renders the Send Invoice privacy and OAuth data-use disclosures. */
export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div
        data-info="blur-transition-overlay"
        className="pointer-events-none absolute left-0 right-0 top-[25px] h-24 bg-gradient-to-b from-slate-100 to-slate-50 blur-2xl"
      />
      <div className="container relative mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <article className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-xl prose-p:leading-relaxed prose-p:text-gray-600 prose-strong:text-gray-900 prose-li:text-gray-600 prose-hr:border-gray-200 dark:prose-headings:text-gray-100 dark:prose-p:text-gray-300 dark:prose-strong:text-gray-100 dark:prose-li:text-gray-300 dark:prose-hr:border-gray-700">
          <h1>Privacy Policy</h1>
          <p>
            <strong>Effective date:</strong> August 10, 2026
          </p>

          <h2>Invoice data</h2>
          <p>
            Invoice drafts are stored in your browser. EasyInvoicePDF does not
            keep invoice records or sent PDFs on its servers. When you use Send,
            the browser-rendered PDF and message are transmitted to our
            application only long enough to validate and submit them to the
            email provider you selected.
          </p>

          <h2>Account and connected email data</h2>
          <p>
            Clerk stores the account identity, session data, connected mailbox
            details, OAuth tokens, and granted scopes needed to authenticate you
            and send only when you ask. EasyInvoicePDF does not maintain a
            separate account database and does not request permission to read
            your mailbox.
          </p>
          <p>
            You may connect multiple Gmail and Outlook accounts. When you open
            the sender selector, the provider may return an email address so you
            can distinguish those accounts. Provider-issued account IDs and
            OAuth tokens are never exposed in that interface. The external
            account ID is used only to select the exact mailbox.
          </p>
          <p>
            Gmail sending uses the <code>gmail.send</code> scope. Outlook
            sending uses delegated <code>Mail.Send</code>. Your invoice and
            recipient are shared with Google or Microsoft, respectively, to
            perform the send.
          </p>

          <h2>Google API data</h2>
          <p>
            EasyInvoicePDF&apos;s use and transfer to any other app of
            information received from Google APIs will adhere to the Google API
            Services User Data Policy, including Limited Use requirements.
          </p>
          <p>
            Read the official{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </a>
            .
          </p>

          <h2>Security, retention, and logs</h2>
          <ul>
            <li>OAuth tokens and connected accounts are managed by Clerk.</li>
            <li>No invoice history or duplicate-send records are stored.</li>
            <li>
              Operational logs may contain request IDs and error categories, but
              must not contain invoice content, recipients, message bodies, or
              OAuth tokens.
            </li>
            <li>
              Account and provider connection data remains until it is revoked,
              unlinked, or deletion is requested.
            </li>
          </ul>

          <h2>Analytics</h2>
          <p>
            Product analytics record coarse actions such as opening Send,
            connecting a provider, or a successful send. They do not include
            recipient addresses, invoice fields, subject lines, message bodies,
            or tokens.
          </p>

          <h2>Your choices and data deletion</h2>
          <p>
            You can sign out from the account menu. You can also revoke access
            in your Google Account or Microsoft Account security settings. To
            unlink an individual email account, delete your EasyInvoicePDF
            account data, or ask a privacy question, email{" "}
            <a href="mailto:vlad@mail.easyinvoicepdf.com">
              vlad@mail.easyinvoicepdf.com
            </a>
            . We will verify the request before removing data managed for the
            account through Clerk.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy as the Service changes. The effective date
            above identifies the latest version.
          </p>
        </article>
      </div>
    </div>
  );
}
