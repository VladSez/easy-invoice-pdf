import { STATIC_ASSETS_URL } from "@/config";

export const SEO_LANDING_SLUGS = [
  "invoice-generator-no-login",
  "open-source-invoice-generator",
  "stripe-invoice-alternative",
  "invoice-template-pdf",
] as const;

export type SeoLandingSlug = (typeof SEO_LANDING_SLUGS)[number];

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoSection {
  title: string;
  /** Short lead before body content */
  lead?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ComparisonTable {
  /** Optional intro copy shown above the comparison table */
  intro?: string;
  columnLabels: [string, string, string];
  rows: { feature: string; thisTool: string; other: string }[];
}

export interface SeoLandingDefinition {
  slug: SeoLandingSlug;
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  hero: {
    h1: string;
    subheading: string;
    bullets: string[];
    ctaLabel: string;
    ctaHref: string;
    heroImage: string;
  };
  sections: SeoSection[];
  comparisonTable?: ComparisonTable;
  faq: SeoFaqItem[];
}

const DEFAULT_INVOICE_TEMPLATE_HREF = "/?template=default";

export const SEO_LANDING_DEFINITIONS = {
  "invoice-generator-no-login": {
    slug: "invoice-generator-no-login",
    metadata: {
      title: "Create Free Invoices Online - No Login Required",
      description:
        "Generate professional invoices in seconds with EasyInvoicePDF. No account, no signup, no tracking. Free, open-source, browser-based. Start creating your PDF.",
      keywords:
        "free invoice generator no login, easy invoice, create invoice PDF, generate PDF invoice, invoice PDF without account, no signup invoice maker, instant invoice PDF, browser invoice generator",
    },
    hero: {
      h1: "Create Free Invoices Online - No Login Required",
      subheading:
        "Generate professional PDFs in seconds. No account, no signup, no tracking. Start creating now.",
      bullets: [
        "Create invoices in 60 seconds",
        "No login. No email. No tracking.",
        "Download PDF instantly",
        "Free and open-source forever",
      ],
      ctaLabel: "Create Invoice Now",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/default-template-v1.png`,
    },
    sections: [
      {
        title: "Why no-login matters",
        lead: "Most tools force you to create an account before you can even download an invoice. That slows you down and adds unnecessary friction.",
        paragraphs: ["This tool skips all of that:"],
        bullets: [
          "No registration",
          "Your data never leaves your browser - complete privacy",
          "No hidden paywalls",
          "Just open, fill, download.",
        ],
      },
      {
        title: "Who is this for",
        bullets: [
          "Freelancers who need a quick invoice",
          "Developers generating invoices on the fly",
          "Small businesses avoiding complex tools",
          "Anyone who just needs a PDF invoice now",
        ],
      },
      {
        title: "Features",
        bullets: [
          "Generate professional PDFs in seconds",
          "Templates designed to impress clients",
          "Customize tax labels, currencies, line items - your way",
          "Create invoices online, no app download needed",
        ],
      },
      {
        title: "Compare to other tools",
        lead: "Unlike tools like QuickBooks or Zoho:",
        bullets: [
          "No onboarding",
          "No subscriptions",
          "No unnecessary features",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need an account to create invoices?",
        answer:
          "No. Open the app and start generating invoices immediately. No email, no password required. Save invoices as PDF files or share via links when supported.",
      },
      {
        question: "Is my data stored?",
        answer:
          "No. Everything runs locally in your browser. Your invoice data is not uploaded to a server for normal editing and PDF generation.",
      },
      {
        question: "Is it really free?",
        answer:
          "Yes. EasyInvoicePDF is free to use with no paywalls, no premium tiers, and no signup gate. The project is open-source on GitHub.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the app, fill in bill-from, bill-to, line items, and totals, then download the PDF. Most invoices take about a minute and cost nothing.",
      },
      {
        question: "Can I create invoices without downloading software?",
        answer:
          "Yes. It runs in your browser with no install step. Use it on desktop or mobile as long as JavaScript is enabled.",
      },
      {
        question: "Can I customize the invoice template?",
        answer:
          "Yes. Edit fields, tax labels, currency, notes, and template options before you generate the PDF.",
      },
    ],
  },
  "open-source-invoice-generator": {
    slug: "open-source-invoice-generator",
    metadata: {
      title: "Free Open-Source Invoice Generator - Easy to Use",
      description:
        "Generate PDF invoices instantly in your browser. Fully open-source, customizable code, self-hostable. Free forever, no vendor lock-in. Open the app and try it.",
      keywords:
        "open source invoice generator, self-hosted invoice PDF, easy invoice PDF, free invoice software github, customizable invoice template, AGPL invoice tool",
    },
    hero: {
      h1: "Free Open-Source Invoice Generator - Easy to Use & Customize",
      subheading:
        "Fully open-source, customizable code, self-hostable. No vendor lock-in. Start generating now.",
      bullets: [
        "Generate PDFs instantly",
        "Fully open-source code",
        "Self-host or use online",
        "No vendor lock-in",
      ],
      ctaLabel: "Start Generating Invoices",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/str-tmp-v2.png`,
    },
    sections: [
      {
        title: "Why open-source matters",
        lead: "Most invoicing tools lock you into their ecosystem.",
        paragraphs: ["This one does not:"],
        bullets: [
          "Fully open-source",
          "No vendor lock-in",
          "Transparent codebase",
          "You control everything.",
        ],
      },
      {
        title: "What you can do",
        bullets: [
          "Generate invoices instantly",
          "Customize templates and fields before export",
          "Fork and modify the code for your workflow",
          "Self-host if you need full control",
        ],
      },
      {
        title: "Built for developers",
        lead: "Unlike traditional tools like Stripe or QuickBooks, this is designed with developers in mind:",
        bullets: [
          "Simple architecture you can read quickly",
          "Easy to extend with familiar web tooling",
          "Works with structured invoice data",
          "No bloated UI - just the invoice editor and PDF",
        ],
      },
      {
        title: "Self-hosting option",
        lead: "Want full control?",
        paragraphs: ["You can run your own version:"],
        bullets: [
          "Host on your own server",
          "Customize branding",
          "Keep all data private",
        ],
      },
      {
        title: "Use cases",
        bullets: [
          "Indie hackers",
          "SaaS builders",
          "Agencies",
          "Privacy-focused users",
        ],
      },
    ],
    faq: [
      {
        question: "Is it really open-source?",
        answer:
          "Yes. The source is public on GitHub. You can inspect, fork, and adapt it for compliant open-source use.",
      },
      {
        question: "Can I use it commercially?",
        answer: "Yes, if you comply with AGPL 3.0 license.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the hosted app, fill in your invoice fields, preview the PDF live, then download. No signup step is required.",
      },
      {
        question: "Can I create invoices without downloading software?",
        answer:
          "Yes. It is a web app that runs in the browser. You do not need a desktop installer.",
      },
      {
        question: "Can I customize the invoice template?",
        answer:
          "Yes. Adjust fields, tax labels, currency, notes, and template options in the UI before generating the PDF.",
      },
    ],
  },
  "stripe-invoice-alternative": {
    slug: "stripe-invoice-alternative",
    metadata: {
      title: "Free Stripe Invoice Alternative - Generate PDFs",
      description:
        "Create invoices without Stripe setup. Instant PDF generation, no account required. Fast, free alternative to Stripe invoicing. Try it free. No signup needed.",
      keywords:
        "stripe invoice alternative, invoice without stripe, create invoice without stripe, simple PDF invoice, no stripe dashboard, free stripe invoice alternative",
    },
    hero: {
      h1: "Create Invoices Without Stripe - Fast & Free Alternative",
      subheading:
        "Generate professional PDFs instantly. No account setup, no payment processing needed. Try it free.",
      bullets: [
        "Create invoices without Stripe",
        "Instant PDF generation",
        "No account setup required",
        "Free forever",
      ],
      ctaLabel: "Create Invoice Without Stripe",
      ctaHref: "/?template=stripe",
      heroImage: `${STATIC_ASSETS_URL}/seo-content/stripe-template-v1.png`,
    },
    sections: [
      {
        title: "Why not use Stripe?",
        lead: "Stripe is powerful - but often overkill if you just need a simple invoice.",
        paragraphs: ["Common issues:"],
        bullets: [
          "Requires account setup before you can invoice",
          "Complex dashboard when you only need a PDF",
          "Built for full payment processing, not quick one-off PDFs",
        ],
      },
      {
        title: "A simpler approach",
        paragraphs: [
          "This tool focuses on one thing: generating clean, professional invoices fast.",
          "No account setup, no product configuration, and no integrations required.",
        ],
      },
      {
        title: "When to use this instead",
        lead: "Use this tool if:",
        bullets: [
          "You do not need online payments",
          "You just want a PDF invoice",
          "You need something fast",
        ],
      },
      {
        title: "Who this is for",
        bullets: ["Freelancers", "Consultants", "Developers", "Side projects"],
      },
    ],
    comparisonTable: {
      intro:
        "EasyInvoicePDF does one thing well: fast, free invoice PDFs. Stripe does everything - payments, subscriptions, invoicing. If you just need invoices, here is why we are different.",
      columnLabels: ["Feature", "EasyInvoicePDF.com", "Stripe"],
      rows: [
        { feature: "No login", thisTool: "✅ Yes", other: "❌ No" },
        { feature: "Instant PDF", thisTool: "✅ Yes", other: "Varies" },
        { feature: "Open-source", thisTool: "✅ Yes", other: "❌ No" },
        { feature: "Free forever", thisTool: "✅ Yes", other: "Paid plans" },
      ],
    },
    faq: [
      {
        question: "Can I accept payments?",
        answer:
          "No. EasyInvoicePDF focuses on invoice layout and PDF export. Collect payments with your bank, card processor, or another tool, then document them here.",
      },
      {
        question: "Can I still use Stripe later?",
        answer:
          "Yes. This is a lightweight PDF workflow, not a billing platform lock-in. You can adopt Stripe or any processor whenever you want.",
      },
      {
        question: "Do I need an account to create invoices?",
        answer:
          "No. Open the app, fill in your invoice, and download the PDF. No email or password is required.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Use the editor to add line items, tax, and client details, preview the PDF, then download. Most users finish in under a minute.",
      },
      {
        question: "Can I create invoices without downloading software?",
        answer:
          "Yes. It runs in your browser with no installer. Works on desktop and mobile browsers that support modern JavaScript.",
      },
    ],
  },
  "invoice-template-pdf": {
    slug: "invoice-template-pdf",
    metadata: {
      title: "Free Invoice Template - PDF Download Instantly",
      description:
        "Generate professional invoice PDFs in seconds. No design skills needed, instant download, free forever. No signup required. Easy invoice PDF in your browser.",
      keywords:
        "free invoice template PDF, professional invoice PDF, printable invoice template, easy invoice PDF, invoice PDF download, invoice layout generator, PDF billing template",
    },
    hero: {
      h1: "Free Invoice Template PDF - Easy to Create & Download",
      subheading:
        "Generate professional invoices in seconds. No design skills needed, instant download, completely free.",
      bullets: [
        "Professional template included",
        "Generate PDF in seconds",
        "No design skills needed",
        "Download instantly, always free",
      ],
      ctaLabel: "Generate Invoice PDF",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/
def-tmp-v2.png`,
    },
    sections: [
      {
        title: "Why use a PDF invoice template",
        lead: "PDF invoices are:",
        bullets: [
          "Universally accepted by clients and accounting teams",
          "Easy to share without layout shifts",
          "Consistent across devices and printers",
        ],
        paragraphs: ["No formatting issues, no surprises."],
      },
      {
        title: "What is included",
        bullets: [
          "Pre-designed invoice layout ready to fill in",
          "Automatic totals calculation as you edit line items",
          "Tax labels and currency support for international work",
          "Downloadable PDF you can send immediately",
        ],
      },
      {
        title: "Who it is for",
        bullets: ["Freelancers", "Contractors", "Agencies", "Small businesses"],
      },
      {
        title: "Skip manual templates",
        lead: "Instead of editing Word or Excel templates:",
        bullets: [
          "No formatting headaches",
          "No broken layouts",
          "No manual calculations",
        ],
      },
      {
        title: "Better than traditional tools",
        lead: "Compared to tools like QuickBooks or Wave:",
        bullets: [
          "Generate PDFs faster for one-off invoices",
          "Simpler flow when you only need a document",
          "No login required to get started",
        ],
      },
    ],
    faq: [
      {
        question: "Can I customize the template?",
        answer:
          "Yes. Edit every field, tax label, currency, notes, and line items before you generate the PDF so it matches your brand voice.",
      },
      {
        question: "Is it free?",
        answer:
          "Yes. Generating and downloading invoice PDFs in the hosted app is free with no paywall or forced signup.",
      },
      {
        question: "Do I need software?",
        answer:
          "No. It runs in your browser. You only need a modern browser and an internet connection to load the page.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the generator, pick the template, enter your billing details, then download the finished PDF. No signup is required.",
      },
      {
        question: "Can I create invoices without downloading software?",
        answer:
          "Yes. Skip desktop installs - everything happens online with instant preview.",
      },
      {
        question: "Is there a free invoice generator that is truly free?",
        answer:
          "EasyInvoicePDF stays free to use with no forced account wall. You get PDF export and editing without a subscription.",
      },
    ],
  },
} as const satisfies Record<SeoLandingSlug, SeoLandingDefinition>;
