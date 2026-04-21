import { Header } from "@/app/(components)/header";
import { GITHUB_URL, STATIC_ASSETS_URL } from "@/config";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title:
    "Terms of Service | EasyInvoicePDF - Free & Open-Source Invoice Generator",
  description:
    "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool; no server-side invoice data storage.",
  keywords: [
    "terms of service",
    "easyinvoicepdf",
    "invoice generator",
    "legal",
  ],
  authors: [{ name: "Uladzislau Sazonau" }],
  creator: "Uladzislau Sazonau",
  publisher: "Uladzislau Sazonau",
  alternates: {
    canonical: "https://easyinvoicepdf.com/tos",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Terms of Service | EasyInvoicePDF",
    description:
      "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool.",
    siteName: "EasyInvoicePDF.com | Free Invoice Generator",
    type: "website",
    locale: "en_US",
    url: "https://easyinvoicepdf.com/tos",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | EasyInvoicePDF",
    description:
      "Terms of Service for EasyInvoicePDF.com. Browser-based invoice PDF tool.",
    creator: "@vlad_sazon",
    images: [
      {
        url: `${STATIC_ASSETS_URL}/easy-invoice-opengraph-image.png?v=1755773879597`,
        type: "image/png",
        width: 1200,
        height: 630,
        alt: "EasyInvoicePDF.com - Free Invoice Generator with Live PDF Preview",
      },
    ],
  },
};

export default function TermsOfServicePage() {
  return (
    <>
      <Header
        locale={"en"}
        translations={{
          navLinks: {
            features: "Features",
            faq: "FAQ",
            github: "GitHub",
            githubUrl: GITHUB_URL,
          },
          switchLanguageText: "Switch Language",
          goToAppText: "Open app",
          startInvoicingButtonText: "Start Invoicing",
          changelogLinkText: "Changelog",
          termsOfServiceLinkText: "Terms of Service",
        }}
        hideLanguageSwitcher={true}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <article className="prose prose-gray max-w-none dark:prose-invert prose-headings:scroll-mt-20 prose-headings:font-semibold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-xl prose-p:leading-relaxed prose-p:text-gray-600 prose-strong:text-gray-900 prose-li:text-gray-600 prose-hr:border-gray-200 dark:prose-headings:text-gray-100 dark:prose-p:text-gray-300 dark:prose-strong:text-gray-100 dark:prose-li:text-gray-300 dark:prose-hr:border-gray-700">
            <h1>Terms of Service</h1>
            <p>
              <strong>Effective date:</strong> April 17, 2026
            </p>

            <h2>1. Overview</h2>
            <p>
              EasyInvoicePDF (&quot;the Service&quot;) is a browser-based tool
              that allows users to generate invoice PDFs. By using the Service,
              you agree to these Terms.
            </p>
            <hr />

            <h2>2. Nature of the Service</h2>
            <p>
              The Service is <strong>not</strong> accounting, bookkeeping,
              invoicing, or tax compliance software. It is a simple PDF
              generation tool.
            </p>
            <p>The Service:</p>
            <ul>
              <li>
                does not guarantee compliance with any local, national, or
                international laws or tax regulations
              </li>
              <li>
                does not store or process user data on servers (all data is
                handled locally in your browser)
              </li>
              <li>does not act as a system of record for invoices</li>
              <li>does not provide accounting, tax, or legal advice</li>
            </ul>
            <hr />

            <h2>3. User Responsibility</h2>
            <p>You are solely responsible for:</p>
            <ul>
              <li>
                ensuring that any generated invoices comply with applicable laws
                and regulations
              </li>
              <li>
                verifying the accuracy and completeness of all data entered
              </li>
              <li>maintaining your own records, backups, and documentation</li>
              <li>
                determining whether the output is suitable for your intended use
              </li>
            </ul>
            <hr />

            <h2>4. No Professional Relationship</h2>
            <p>
              Use of the Service does not create any accountant-client,
              advisor-client, legal, or fiduciary relationship between you and
              the Service or its operator.
            </p>
            <hr />

            <h2>5. No Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied, including but not limited to:
            </p>
            <ul>
              <li>fitness for a particular purpose</li>
              <li>accuracy, reliability, or availability</li>
              <li>compliance with legal, tax, or regulatory requirements</li>
            </ul>
            <hr />

            <h2>6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <ul>
              <li>
                The Service and its operator shall not be liable for any direct,
                indirect, incidental, special, consequential, or punitive
                damages arising from use or inability to use the Service.
              </li>
              <li>
                This includes, but is not limited to, financial loss, business
                interruption, tax penalties, regulatory fines, or data loss.
              </li>
            </ul>
            <p>
              If liability is found despite these terms, it shall be limited to
              the amount you paid to use the Service (if any).
            </p>
            <hr />

            <h2>7. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless the Service and
              its operator from and against any claims, liabilities, damages,
              losses, and expenses (including reasonable legal fees) arising out
              of:
            </p>
            <ul>
              <li>
                your use of the Service in violation of applicable laws or
                regulations
              </li>
              <li>your violation of these Terms</li>
              <li>
                any data, content, or information you input into the Service
              </li>
              <li>your use of any documents generated through the Service</li>
            </ul>
            <hr />

            <h2>8. No Data Storage</h2>
            <p>
              All data entered into the Service remains in your browser. We do
              not store, transmit, or retain invoice data on any servers.
            </p>
            <p>You are responsible for saving and backing up your data.</p>
            <hr />

            <h2>9. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                use the Service for unlawful, fraudulent, or misleading purposes
              </li>
              <li>
                attempt to reverse engineer, disrupt, or misuse the Service
              </li>
              <li>
                use the Service in a way that violates applicable laws or
                regulations
              </li>
            </ul>
            <hr />

            <h2>10. Changes to the Service</h2>
            <p>
              We may modify, suspend, or discontinue the Service at any time
              without notice or liability.
            </p>
            <hr />

            <h2>11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              Service constitutes acceptance of the updated Terms.
            </p>
            <hr />

            <h2>12. Contact</h2>
            <p>
              For questions, contact:{" "}
              <a href="mailto:vlad@mail.easyinvoicepdf.com">
                vlad@mail.easyinvoicepdf.com
              </a>
            </p>
          </article>
        </div>
      </div>
    </>
  );
}
