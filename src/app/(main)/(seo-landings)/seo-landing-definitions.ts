import {
  STATIC_ASSETS_URL,
  VIDEO_DEMO_HERO_YOUTUBE_URL,
  VIDEO_LIVE_PREVIEW_YOUTUBE_URL,
  VIDEO_MULTI_LANGUAGE_YOUTUBE_URL,
  VIDEO_NORDIC_INVOICE_YOUTUBE_URL,
} from "@/config";

export const SEO_LANDING_SLUGS = [
  "invoice-generator-no-login",
  "open-source-invoice-generator",
  "stripe-invoice-alternative",
  "invoice-template-pdf",
  "multi-language-invoice-generator",
  "swedish-invoice-generator",
  "norwegian-invoice-generator",
] as const;

export type SeoLandingSlug = (typeof SEO_LANDING_SLUGS)[number];

interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoSection {
  title: string;
  /** Short lead before body content */
  lead?: string;
  /** Show comparison table */
  showComparisonTable?: boolean;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ComparisonTable {
  /** Heading above the table. Say what the two columns are being compared on. */
  heading?: string;
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
    /**
     * Shown in the hero, and used as the poster frame when {@link heroVideo} is set.
     */
    heroImage: string;
    /**
     * An optional demo to show in the hero instead of the still image.
     *
     * Every field is here because Google's video rich results need it: the landing's
     * JSON-LD graph turns this into a `VideoObject`, and a clip embedded in an iframe is
     * otherwise invisible to both search engines and answer engines.
     */
    heroVideo?: {
      /** `https://www.youtube.com/embed/<id>`, what the iframe loads. */
      embedUrl: string;
      /** `https://www.youtube.com/watch?v=<id>`, the canonical page for the clip. */
      watchUrl: string;
      /** The video's own title, as published. */
      title: string;
      /** One sentence on what the clip shows. */
      description: string;
      /** Publication timestamp, ISO 8601. Required for video rich results. */
      uploadDate: string;
      /** Poster frame, e.g. `https://i.ytimg.com/vi/<id>/maxresdefault.jpg`. */
      thumbnailUrl: string;
    };
  };
  sections: SeoSection[];
  /**
   * A short table of plain facts, shown directly under the hero.
   *
   * Two columns of label and value, which is the shape both a reader skimming for one
   * number and a model answering a question about the page can lift without parsing prose.
   */
  factsTable?: {
    heading: string;
    rows: { label: string; value: string }[];
  };
  comparisonTable?: ComparisonTable;
  faq: SeoFaqItem[];
}

const DEFAULT_INVOICE_TEMPLATE_HREF = "/?template=default";

export const SEO_LANDING_DEFINITIONS = {
  "invoice-generator-no-login": {
    slug: "invoice-generator-no-login",
    metadata: {
      title: "Free Invoice Generator - No Login, No Signup",
      description:
        "A free invoice generator with no account to make. Fill in the form, watch the PDF redraw beside it, download the file. No login, no email, no credit card.",
      keywords:
        "invoice generator, free invoice generator, invoice generator tool, invoice maker, invoice builder, create invoice free, free bill generator, invoice generator no login, no signup invoice maker, free invoice forms, bill template, browser invoice generator, ad-free invoice generator",
    },
    hero: {
      h1: "Free Invoice Generator - No Login Required",
      subheading:
        "Fill in the form, watch the PDF redraw beside it, then download the file. No account, no email, no credit card. The invoice is rendered on your own machine, so nothing you type is uploaded.",
      bullets: [
        "A finished PDF in about a minute",
        "No account, no email, no credit card",
        "12 languages and 122 currencies",
        "Free and open source under AGPL-3.0",
        "No ads and no tracking pixels",
      ],
      ctaLabel: "Create and Download a PDF",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/default-template-v1.png`,
      heroVideo: {
        embedUrl: VIDEO_DEMO_HERO_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=wkecHuXWLSQ",
        title: "EasyInvoicePDF: Full demo #invoice #oss #freelancelife",
        description:
          "A full walkthrough of filling in an invoice and downloading it as a PDF, without an account.",
        uploadDate: "2026-09-10T12:38:00-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/wkecHuXWLSQ/maxresdefault.jpg",
      },
    },
    factsTable: {
      heading: "The generator at a glance",
      rows: [
        { label: "Account required", value: "No email, no password, no card" },
        {
          label: "Time to a finished PDF",
          value: "About a minute for a typical invoice",
        },
        {
          label: "Where the PDF is built",
          value: "In your browser. The invoice data never reaches a server.",
        },
        {
          label: "Templates",
          value: "A default layout and a Stripe-style one",
        },
        { label: "Languages on the PDF", value: "12" },
        {
          label: "Currencies",
          value: "122, picked separately from the language",
        },
        { label: "Company logo", value: "JPEG, PNG or WebP, up to 3MB" },
        { label: "Ads and trackers", value: "None" },
        { label: "Price", value: "Free, and the source is on GitHub" },
      ],
    },
    sections: [
      {
        title: "What skipping the login saves you",
        lead: "Most invoice generators want an email before they hand over the PDF. That is a signup form, a confirmation mail and one more password, all standing in front of a document you needed an hour ago.",
        paragraphs: [
          "Here there is no account to make. Open the page and an empty invoice is already in the form.",
        ],
        bullets: [
          "No signup form, no confirmation email, no password to store",
          "No trial that expires and locks the invoice you already wrote",
          "No marketing list to unsubscribe from later",
          "The invoice you last edited stays in your browser, so a refresh does not lose it",
        ],
      },
      {
        title: "The PDF is built on your own machine",
        lead: "JavaScript in your browser renders the file. Your client's name, your rates and your bank details stay on your device, which is why no account is needed to hold them.",
        bullets: [
          "Nothing is uploaded during normal editing or PDF generation",
          "Nothing to delete afterwards, because nothing was stored elsewhere",
          "The share link packs the whole invoice into the URL rather than a database row",
          "No tracking pixels and no third-party ad scripts on the page",
        ],
      },
      {
        title: "Make the invoice look like yours",
        bullets: [
          "Two layouts: a plain default one and a Stripe-style one",
          "Upload a logo as JPEG, PNG or WebP up to 3MB, and it prints on either",
          "Rename the tax label to VAT, GST, Sales Tax, Moms or whatever applies to you",
          "Pick from 12 languages for the PDF and 122 currencies, independently",
          "Line items total themselves as you type, tax included",
          "The total is written out in words, following the grammar of the language you picked",
        ],
      },
      {
        title: "When an invoicing suite is more than you need",
        showComparisonTable: true,
        lead: "QuickBooks, Zoho and Wave are accounting platforms. They track, reconcile and file, and they charge a subscription for it.",
        paragraphs: [
          "That is worth the setup when the books are the job. It is a lot of software to sign up for when you owe one client one PDF this week.",
          "Use this when the invoice is the whole task, and keep the accounting suite for the accounting.",
        ],
      },
      {
        title: "Create an invoice and download the PDF",
        lead: "Four steps, and nothing to install.",
        bullets: [
          "Open the generator. An empty invoice is already loaded.",
          "Fill in who is billing whom, then add your line items. The totals follow.",
          "Watch the preview beside the form redraw with each change.",
          "Press Download PDF. The file is in your downloads folder, ready to send.",
        ],
      },
    ],
    comparisonTable: {
      heading: "Against a typical invoicing tool",
      intro:
        "Most invoice tools are accounts first and documents second. This compares how long it takes to hold a finished PDF.",
      columnLabels: ["", "EasyInvoicePDF.com", "Typical invoicing tool"],
      rows: [
        {
          feature: "Works without an account",
          thisTool: "✅ Yes",
          other: "❌ No",
        },
        {
          feature: "Finished PDF in about a minute",
          thisTool: "✅ Yes",
          other: "⚠️ After signup",
        },
        {
          feature: "Invoice data stays on your device",
          thisTool: "✅ Yes",
          other: "❌ No",
        },
        {
          feature: "Languages on the PDF",
          thisTool: "✅ 12",
          other: "⚠️ Usually one",
        },
        {
          feature: "Ads or tracking pixels",
          thisTool: "❌ None",
          other: "⚠️ Varies",
        },
        { feature: "Price", thisTool: "✅ Free", other: "⚠️ Paid plans" },
      ],
    },
    faq: [
      {
        question: "Do I need to create an account?",
        answer:
          "No. Open the app and the form is already there. There is no email step, no password and no credit card, and you can download the PDF or send a share link straight away.",
      },
      {
        question: "Is it really free?",
        answer:
          "Yes. There is no paywall, no premium tier and no card on file. The project is open source on GitHub under AGPL-3.0, so you can also read the code or run your own copy.",
      },
      {
        question: "Where does my invoice data go?",
        answer:
          "Nowhere. The form and the PDF both run in your browser, and the invoice is kept in your browser's local storage so it survives a refresh. Normal editing and PDF generation upload nothing.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the app, fill in the bill-from and bill-to blocks, add your line items, and press Download PDF. The totals and tax calculate themselves, and a typical invoice takes about a minute.",
      },
      {
        question: "Does the invoice maker work on a phone?",
        answer:
          "Yes. It runs in any modern mobile browser with no app to install, and the PDF viewer opens on the same screen so you can check the file before downloading it.",
      },
      {
        question: "Can I put my company logo on the invoice?",
        answer:
          "Yes. Upload a JPEG, PNG or WebP up to 3MB and it appears on both the default and the Stripe-style template. Like everything else, the image stays in your browser.",
      },
      {
        question: "Can I use it to write a receipt?",
        answer:
          "It builds invoices, and an invoice with the Paid field set to the full amount reads as a record of a completed payment. There is no separate receipt document, and no accounting or compliance guarantee comes with it.",
      },
      {
        question: "Does it have ads?",
        answer:
          "No. There are no ads, no tracking pixels and no third-party ad scripts, which is also why the page loads quickly.",
      },
    ],
  },
  "open-source-invoice-generator": {
    slug: "open-source-invoice-generator",
    metadata: {
      title: "Open Source Invoice Generator - Free, Self-Hostable",
      description:
        "A free invoice generator you can read, fork and self-host. AGPL-3.0 on GitHub, the PDF is rendered in your browser, and there is no account to make.",
      keywords:
        "open source invoice generator, free invoice software github, self-hosted invoice PDF, AGPL invoice tool, invoice generator, invoice builder, customizable invoice template, open source billing software, ad-free invoice generator",
    },
    hero: {
      h1: "Open-Source Invoice Generator - Free and Self-Hostable",
      subheading:
        "The whole generator is on GitHub under AGPL-3.0. Use the hosted copy, fork it, or run it on your own server. Either way the PDF is rendered in the browser and no account is involved.",
      bullets: [
        "AGPL-3.0, source public on GitHub",
        "Fork it or host it yourself",
        "PDF rendered in your browser",
        "12 languages and 122 currencies",
        "No account, no ads",
      ],
      ctaLabel: "Create and Download a PDF",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/str-tmp-v2.png`,
      heroVideo: {
        embedUrl: VIDEO_LIVE_PREVIEW_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=pWkb_JcKouU",
        title: "EasyInvoicePDF: Live PDF Preview #invoice #oss #freelancelife",
        description:
          "The PDF preview updating as the invoice form is filled in, rendered in the browser.",
        uploadDate: "2026-09-08T15:54:32-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/pWkb_JcKouU/maxresdefault.jpg",
      },
    },
    factsTable: {
      heading: "The project at a glance",
      rows: [
        { label: "License", value: "AGPL-3.0" },
        {
          label: "Source",
          value: "Public on GitHub, with issues and pull requests open",
        },
        { label: "Built with", value: "Next.js, TypeScript, React and Zod" },
        {
          label: "How the PDF is made",
          value: "react-pdf, running in the browser rather than on a server",
        },
        {
          label: "Self-hosting",
          value: "Clone it, install with pnpm, deploy anywhere Next.js runs",
        },
        { label: "Account required", value: "No" },
        { label: "Languages on the PDF", value: "12" },
        { label: "Currencies", value: "122" },
        { label: "Price", value: "Free, hosted and self-hosted alike" },
      ],
    },
    sections: [
      {
        title: "What open source changes for an invoice tool",
        showComparisonTable: true,
        lead: "You can read the code that builds your PDF. That is a different kind of privacy claim from a page that tells you your data is safe.",
        bullets: [
          "The rendering code is in the repository, so you can check what ends up in the file",
          "Fork it when the default layout is wrong for your market",
          "Run your own copy when a hosted tool is not allowed where you work",
          "If this project stops being maintained, your copy still builds",
        ],
      },
      {
        title: "Written to be read",
        paragraphs: [
          "The invoice schema is one Zod file, and every form field, PDF template and share link derives its types from it. Adding a field is a change in one place that the compiler then chases through everything downstream.",
          "The templates are React components. Changing a column heading, a font weight or the order of the totals is an edit to JSX, not to a template language you have to learn first.",
          "Both PDF templates render from the same invoice data, so a change you make to one has an obvious counterpart in the other.",
        ],
      },
      {
        title: "Host it yourself",
        lead: "The copy at easyinvoicepdf.com and a copy on your own server run the same code.",
        bullets: [
          "Clone the repository and install the dependencies with pnpm",
          "Deploy anywhere Next.js runs",
          "Change the default template, the fonts or the wording for your own business",
          "Keep it inside your own network when that is what your policy requires",
        ],
      },
      {
        title: "Create an invoice and download the PDF",
        lead: "Four steps on the hosted copy, and the same four on yours.",
        bullets: [
          "Open the generator. An empty invoice is already loaded.",
          "Fill in the seller and buyer blocks, then add your line items.",
          "Watch the preview beside the form redraw with each change.",
          "Press Download PDF, or send your client a share link instead.",
        ],
      },
    ],
    comparisonTable: {
      heading: "Open source compared",
      intro:
        "Most invoicing tools are closed products with an export button. This compares what changes when the code is public.",
      columnLabels: ["", "EasyInvoicePDF.com", "Closed invoicing tools"],
      rows: [
        {
          feature: "Source code public",
          thisTool: "✅ AGPL-3.0",
          other: "❌ No",
        },
        { feature: "Host it yourself", thisTool: "✅ Yes", other: "❌ No" },
        {
          feature: "PDF built on your device",
          thisTool: "✅ Yes",
          other: "⚠️ Usually server-side",
        },
        {
          feature: "Works without an account",
          thisTool: "✅ Yes",
          other: "❌ No",
        },
        {
          feature: "Still works if the company folds",
          thisTool: "✅ Your copy builds",
          other: "❌ No",
        },
        { feature: "Price", thisTool: "✅ Free", other: "⚠️ Paid plans" },
      ],
    },
    faq: [
      {
        question: "Is it really open source?",
        answer:
          "Yes. The source is public on GitHub under AGPL-3.0, and you can read it, fork it and adapt it within the terms of that license.",
      },
      {
        question: "Can I use it commercially?",
        answer:
          "Yes, as long as you comply with AGPL-3.0. That includes offering the corresponding source to anyone you make a modified version available to over a network.",
      },
      {
        question: "Can I self-host it?",
        answer:
          "Yes. Clone the repository, install with pnpm, and deploy it anywhere Next.js runs. The hosted copy carries no feature that a self-hosted one lacks.",
      },
      {
        question: "What is it built with?",
        answer:
          "Next.js and TypeScript, with React Hook Form and Zod behind the invoice form, and react-pdf generating the document in the browser rather than on a server.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the app, fill in the invoice fields, watch the PDF preview update as you type, then press Download PDF. There is no signup step on the hosted copy or on your own.",
      },
      {
        question: "Can I create invoices without installing anything?",
        answer:
          "Yes. It is a web app, so a modern browser is all you need. Installing is only for people who want to run their own copy.",
      },
      {
        question: "Can I change the template?",
        answer:
          "In the app you can adjust fields, tax labels, currency, language, dates and notes before generating the PDF. In a fork you can change the layout itself, since the templates are React components.",
      },
      {
        question: "Does it have ads?",
        answer:
          "No. There are no ads, tracking pixels or third-party ad networks, on the hosted copy or in the source.",
      },
    ],
  },
  "stripe-invoice-alternative": {
    slug: "stripe-invoice-alternative",
    metadata: {
      title: "Free Stripe Invoice Alternative - PDF, No Account",
      description:
        "Need the invoice rather than the payment stack? Fill in a Stripe-style invoice, add your logo, and download the PDF. No Stripe account, no dashboard, free.",
      keywords:
        "stripe invoice alternative, invoice without stripe, create invoice without stripe, stripe style invoice template, invoice generator with logo, simple PDF invoice, invoice billing software, business billing software, wave accounting alternative, zoho billing alternative, ad-free invoicing",
    },
    hero: {
      h1: "Create a Stripe-Style Invoice Without Stripe",
      subheading:
        "The Stripe-style template is here as a layout you fill in and download. No payments account, no products to configure, no dashboard to learn. Add your logo, pick the currency, press Download PDF.",
      bullets: [
        "The Stripe-style invoice layout",
        "No Stripe account and no dashboard",
        "Your logo on the invoice",
        "122 currencies and 12 languages",
        "Free, with no signup",
      ],
      ctaLabel: "Create a Stripe-Style Invoice",
      ctaHref: "/?template=stripe",
      heroImage: `${STATIC_ASSETS_URL}/seo-content/stripe-template-v1.png`,
    },
    factsTable: {
      heading: "What you get, and what you do not",
      rows: [
        {
          label: "Stripe account",
          value: "Not needed, and nothing is sent to Stripe",
        },
        {
          label: "What you get",
          value: "An invoice PDF, downloaded or sent as a share link",
        },
        {
          label: "What you do not get",
          value: "Card payments, subscriptions, reminders, reconciliation",
        },
        {
          label: "Templates",
          value: "The Stripe-style layout, plus a plainer default one",
        },
        { label: "Your logo", value: "JPEG, PNG or WebP, up to 3MB" },
        { label: "Currencies", value: "122" },
        { label: "Languages on the PDF", value: "12" },
        { label: "Price", value: "Free" },
      ],
    },
    sections: [
      {
        title: "When Stripe is more than the invoice needs",
        lead: "Stripe Invoicing sits on top of a payments account. Before it prints anything there is a business profile to complete, products or prices to define, and a dashboard to find your way around.",
        paragraphs: [
          "That is the right trade when you are collecting card payments on a schedule. It is a lot of setup for a one-off document that a client will pay by bank transfer anyway.",
        ],
      },
      {
        title: "What this does instead",
        showComparisonTable: true,
        paragraphs: [
          "One job: lay out an invoice and render it to PDF. The form is on one side, the finished document on the other, and it redraws as you type.",
          "You still get paid the way you already get paid. Put your bank details, your payment link or your terms in the payment fields and send the file.",
        ],
      },
      {
        title: "The Stripe-style template",
        lead: "The second template follows the layout people recognise from Stripe invoices, which is the one most accounts teams have already seen.",
        bullets: [
          "Your logo at the top, as a JPEG, PNG or WebP up to 3MB",
          "Long-form dates, such as December 17, 2025",
          "Amounts formatted the way the invoice language writes them, so SEK prints as 1 234,56 kr",
          "To pay, Paid and Left to pay, so a part-paid invoice is still legible",
          "The total repeated in words, in whichever of the 12 languages you picked",
        ],
      },
      {
        title: "This is not billing software",
        paragraphs: [
          "Wave, Zoho Billing and QuickBooks do the accounting around an invoice: ledgers, tax filing, reminders and reconciliation. This does none of that, and it makes no compliance guarantees.",
          "If you already run one of those and need a clean PDF for a client outside it, this is faster than opening the suite. If what you need is the ledger, keep the suite.",
        ],
      },
      {
        title: "Create the invoice and download it",
        lead: "Four steps, and nothing to set up first.",
        bullets: [
          "Open the generator with the Stripe-style template selected.",
          "Upload your logo and fill in the seller and buyer blocks.",
          "Add your line items and watch the preview redraw as the totals change.",
          "Press Download PDF, or send your client a share link.",
        ],
      },
    ],
    comparisonTable: {
      heading: "Against Stripe Invoicing",
      intro:
        "Stripe Invoicing is part of a payments platform. This is a document generator. The difference shows up in what you have to set up before a PDF exists.",
      columnLabels: ["", "EasyInvoicePDF.com", "Stripe Invoicing"],
      rows: [
        {
          feature: "Account before the first invoice",
          thisTool: "❌ None",
          other: "✅ Required",
        },
        {
          feature: "Business details verified first",
          thisTool: "❌ No",
          other: "✅ Yes",
        },
        { feature: "Stripe-style layout", thisTool: "✅ Yes", other: "✅ Yes" },
        {
          feature: "Invoice data stays on your device",
          thisTool: "✅ Yes",
          other: "❌ No",
        },
        {
          feature: "Collects card payments",
          thisTool: "❌ No",
          other: "✅ Yes",
        },
        { feature: "Price", thisTool: "✅ Free", other: "⚠️ Paid" },
      ],
    },
    faq: [
      {
        question: "Do I need a Stripe account?",
        answer:
          "No. Nothing here touches Stripe. The template borrows the layout, and the PDF is built in your browser.",
      },
      {
        question: "Can I accept payments through it?",
        answer:
          "No. It lays out the invoice and exports the PDF. Collect the money through your bank, your card processor or a payment link you paste into the payment fields, then record it on the invoice.",
      },
      {
        question: "Is this the same document Stripe produces?",
        answer:
          "It is a look-alike layout, not a Stripe product, and it carries no Stripe branding. The shape and typography will be familiar to anyone who has processed a Stripe invoice.",
      },
      {
        question: "Can I put my own logo on it?",
        answer:
          "Yes. Upload a JPEG, PNG or WebP up to 3MB and it prints at the top of the Stripe-style template, and on the default template too.",
      },
      {
        question: "Can I move to Stripe later?",
        answer:
          "Yes. Nothing here is a billing platform you have to migrate off. Adopt Stripe or any other processor whenever the invoicing volume justifies it.",
      },
      {
        question: "Is this billing software like Wave or Zoho?",
        answer:
          "No. Those are accounting suites that keep ledgers, chase payments and help with filing. This produces an invoice PDF and stops there.",
      },
      {
        question: "Do I need an account here?",
        answer:
          "No. There is no signup and no email step, and the invoice never leaves your browser during normal editing and PDF generation.",
      },
      {
        question: "Does it have ads?",
        answer:
          "No. No ads, no tracking pixels and no third-party scripts, which keeps the page fast.",
      },
    ],
  },
  "invoice-template-pdf": {
    slug: "invoice-template-pdf",
    metadata: {
      title: "Free Invoice Template - Fill It In, Download a PDF",
      description:
        "A free invoice template that fills itself in. Type into the form, the PDF redraws beside it, download it. No Word formatting, no Google Docs table, no signup.",
      keywords:
        "free invoice template PDF, invoice template word, invoice format word, word document invoice template, invoice template google docs, bill template google docs, billing template google docs, invoice template canva, small business invoice template, bill template, billing template free, free sample invoice, free invoice example, printable invoice template, invoice PDF download",
    },
    hero: {
      h1: "Free Invoice Template - Fill It In and Download a PDF",
      subheading:
        "A Word or Google Docs invoice template is a document you keep repairing. This one is a form: type into the fields, watch the PDF redraw beside them, and download it when it reads right.",
      bullets: [
        "No formulas and no broken tables",
        "Totals and tax calculate as you type",
        "Two layouts, your logo on either",
        "12 languages and 122 currencies",
        "Free, with no signup",
      ],
      ctaLabel: "Fill In and Download a PDF",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/def-tmp-v2.png`,
      heroVideo: {
        embedUrl: VIDEO_DEMO_HERO_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=wkecHuXWLSQ",
        title: "EasyInvoicePDF: Full demo #invoice #oss #freelancelife",
        description:
          "A full walkthrough of filling in an invoice and downloading it as a PDF, without an account.",
        uploadDate: "2026-09-10T12:38:00-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/wkecHuXWLSQ/maxresdefault.jpg",
      },
    },
    factsTable: {
      heading: "The template at a glance",
      rows: [
        { label: "What you get", value: "A PDF, generated in your browser" },
        {
          label: "What you fill in",
          value: "A web form, not a document you have to edit",
        },
        { label: "Totals and tax", value: "Calculated as you type" },
        {
          label: "Layouts",
          value: "A plain default one and a Stripe-style one",
        },
        { label: "Your logo", value: "JPEG, PNG or WebP, up to 3MB" },
        { label: "Languages on the PDF", value: "12" },
        { label: "Currencies", value: "122" },
        {
          label: "Date formats",
          value: "14 in English, including ISO 2025-12-17",
        },
        { label: "Account required", value: "No" },
        { label: "Price", value: "Free, and the source is on GitHub" },
      ],
    },
    sections: [
      {
        title: "Why a Word or Google Docs invoice template goes wrong",
        showComparisonTable: true,
        lead: "Downloading an invoice template as a .docx, or copying one into Google Docs, works the first time. The trouble starts on the second invoice.",
        bullets: [
          "The totals are typed by hand, so an edited line item leaves a wrong number behind it",
          "Adding a row to the line-item table pushes the footer onto a second page",
          "Fonts substitute on a machine that does not have yours, and the columns shift",
          "Your client gets a .docx they can edit, or a PDF export with margins you did not choose",
          "Changing the currency or the tax label means finding every place you typed it",
        ],
      },
      {
        title: "What a form gives you instead",
        paragraphs: [
          "Here the layout is fixed and only the content is yours. Line items add and remove as rows, the subtotal, tax and total recalculate on every keystroke, and the preview beside the form is the file you are about to download.",
          "There is no document to break, because you never edit one.",
        ],
      },
      {
        title: "What is on the invoice",
        bullets: [
          "Seller and buyer blocks, with tax numbers and bank account details",
          "Line items carrying description, quantity, unit, net price, tax rate and totals",
          "A tax summary, then To pay, Paid and Left to pay",
          "Invoice number, issue date, date of service and payment due date",
          "Payment method, notes, and the total written out in words",
        ],
      },
      {
        title: "Change what the template says",
        bullets: [
          "Rename the tax label to VAT, GST, Sales Tax, Moms or MVA",
          "Pick any of 122 currencies, each with its own symbol and separators",
          "Pick any of 12 languages, and every printed label changes with it",
          "Choose the date format, including ISO 2025-12-17 for cross-border work",
          "Upload a logo up to 3MB as JPEG, PNG or WebP",
          "Hide the fields you do not use, so the PDF has no empty rows",
        ],
      },
      {
        title: "Built for the invoice you send a few times a month",
        paragraphs: [
          "A small business sending a handful of invoices a month does not need a ledger to produce them. Fill the form, download the PDF, email it, and file the copy wherever the rest of your paperwork lives.",
          "The invoice you last edited stays in your browser, so next month you open the page, change the number, the dates and the line items, and download again. That is the part a .docx template never got right.",
        ],
      },
      {
        title: "Fill it in and download the PDF",
        lead: "Four steps, and nothing to install.",
        bullets: [
          "Open the template. An empty invoice is already loaded.",
          "Fill in the seller and buyer blocks, then add your line items.",
          "Watch the totals and the preview update as you type.",
          "Press Download PDF. The file is ready to email.",
        ],
      },
    ],
    comparisonTable: {
      heading: "A form against a document template",
      intro:
        "Both end in a PDF. The difference shows up between the first invoice and the tenth.",
      columnLabels: ["", "This template", "Word or Google Docs template"],
      rows: [
        {
          feature: "Totals calculate themselves",
          thisTool: "✅ Yes",
          other: "❌ Typed by hand",
        },
        {
          feature: "Layout survives an extra line item",
          thisTool: "✅ Yes",
          other: "⚠️ Often not",
        },
        {
          feature: "Same result on every machine",
          thisTool: "✅ Yes",
          other: "⚠️ Fonts substitute",
        },
        {
          feature: "Tax label and currency set in one place",
          thisTool: "✅ Yes",
          other: "❌ Retyped everywhere",
        },
        {
          feature: "Languages on the document",
          thisTool: "✅ 12",
          other: "❌ Translate it yourself",
        },
        {
          feature: "Output",
          thisTool: "✅ PDF, always",
          other: "⚠️ Export step",
        },
      ],
    },
    faq: [
      {
        question: "Is this better than a Word invoice template?",
        answer:
          "For anything past the first invoice, yes. A .docx template makes you retype the totals, repair the table when you add a line item, and export to PDF at the end. Here the totals follow the line items and the PDF is what you are already looking at.",
      },
      {
        question: "Can I use it instead of a Google Docs invoice template?",
        answer:
          "Yes, and for the same reasons. Google Docs invoice templates share the .docx problems, and a document shared by link can be edited by whoever opens it. This produces a finished PDF you send as a file.",
      },
      {
        question: "Can I get the invoice as a Word or Excel file?",
        answer:
          "No. The output is a PDF, which is what clients and accounts teams expect and what renders the same everywhere. If your workflow needs an editable file, this is the wrong tool.",
      },
      {
        question: "Can I customise the template?",
        answer:
          "Yes. Edit every field, the tax label, the currency, the language, the date format and the notes before you generate the PDF, and hide the fields you do not use.",
      },
      {
        question: "Can I add my company logo?",
        answer:
          "Yes. Upload a JPEG, PNG or WebP up to 3MB and it prints on both the default and the Stripe-style layout. The image stays in your browser.",
      },
      {
        question: "Is it free?",
        answer:
          "Yes. Filling in the template and downloading the PDF costs nothing, with no paywall and no signup. The source is on GitHub under AGPL-3.0.",
      },
      {
        question: "How do I create a free invoice?",
        answer:
          "Open the template, fill in the billing details and line items, check the preview, then press Download PDF. Most invoices take about a minute.",
      },
      {
        question: "Can I reuse it next month?",
        answer:
          "Yes. The invoice you last edited stays in your browser's local storage, so reopening the page brings it back. Change the invoice number, the dates and the line items, then download again.",
      },
      {
        question: "Does it have ads?",
        answer:
          "No. There are no ads, tracking pixels or third-party scripts on the page.",
      },
    ],
  },
  "multi-language-invoice-generator": {
    slug: "multi-language-invoice-generator",
    metadata: {
      title: "Multi-Language Invoice Generator - Free PDF, 12 Languages",
      description:
        "Create a professional invoice in Swedish, Norwegian, German, Spanish, Polish and seven more languages. Labels, dates and the amount in words are all localized. Free, no signup.",
      keywords:
        "multi language invoice generator, invoice in different languages, multilingual invoice template, swedish invoice generator, norwegian invoice generator, german invoice template, spanish invoice generator, invoice amount in words, foreign language invoice, international invoice PDF",
    },
    hero: {
      h1: "Invoice Generator in 12 Languages - Free PDF",
      subheading:
        "Pick a language and the whole invoice follows: every label, the date format, the tax wording and the amount written out in words. Free, in your browser, with no signup.",
      bullets: [
        "12 languages, including Swedish and Norwegian",
        "Dates and tax wording follow each language",
        "Amount in words, grammatically correct",
        "122 currencies, chosen separately",
        "Free and open-source. No login.",
      ],
      ctaLabel: "Invoice in Your Language",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/default-template-v1.png`,
      heroVideo: {
        embedUrl: VIDEO_MULTI_LANGUAGE_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=ITMeKohyz3I",
        title:
          "EasyInvoicePDF: 10 languages and 100+ currencies support #invoice #oss #freelancelife",
        description:
          "A walkthrough of picking an invoice language and currency, and the PDF changing with them.",
        uploadDate: "2026-09-08T16:36:13-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/ITMeKohyz3I/maxresdefault.jpg",
      },
    },
    sections: [
      {
        title: "Why the invoice language matters",
        lead: "Your client's accountant reads the invoice too. One that arrives in the language their books are kept in is faster to approve and less likely to come back with questions.",
        bullets: [
          "Local tax wording your client's bookkeeper recognises",
          "Dates that cannot be misread by a month",
          "A document that looks native, not machine-translated",
          "Useful whenever you invoice across a border",
        ],
      },
      {
        title: "Every label on the PDF is translated",
        lead: "Switching the language rewrites the whole document rather than the word for invoice alone.",
        bullets: [
          "Seller and buyer blocks, tax number and account labels",
          "Line item columns: description, quantity, unit, net price, tax and totals",
          "The tax summary table and payment totals",
          "Payment method and due date",
          "Signature lines and the page footer",
        ],
      },
      {
        title: "The amount in words, written correctly",
        lead: "Many invoices repeat the total in words. Getting that right needs the language's grammar rather than a dictionary lookup, so each language carries its own rules instead of a shared template.",
        bullets: [
          "Swedish compounds it into one word: ettusentvåhundratrettiofyra",
          "Norwegian spaces it and adds og: ett tusen to hundre og trettifire",
          "German runs it together: eintausendzweihundertvierunddreißig",
          "Polish and Russian decline it: tysiąc dwieście trzydzieści cztery",
          "French, Italian, Spanish, Portuguese, Dutch and Ukrainian each follow their own",
        ],
      },
      {
        title: "Dates in each language's own convention",
        lead: "The same day, written the way each language writes it, down to the punctuation that is easy to get wrong.",
        bullets: [
          "German: 17. Dezember 2025",
          "Spanish and Portuguese: 17 de diciembre de 2025",
          "Russian and Ukrainian: 17 декабря 2025 г.",
          "Swedish and Dutch: 17 december 2025",
          "Or pick any numeric format, including ISO 2025-12-17",
        ],
      },
      {
        title: "The tax label follows the language",
        lead: "VAT is called something different almost everywhere, and the invoice uses the local term automatically:",
        bullets: [
          "Moms in Swedish, MVA in Norwegian, MwSt. in German",
          "TVA in French, IVA in Italian, Spanish and Portuguese",
          "BTW in Dutch, НДС in Russian, ПДВ in Ukrainian",
          "Or type your own: GST, Sales Tax, or whatever your jurisdiction uses",
        ],
      },
      {
        title: "All 12 languages",
        lead: "English, Polski, Nederlands, Français, Deutsch, Italiano, Norsk bokmål, Português, Русский, Español, Svenska, Українська.",
        paragraphs: [
          "Swedish and Norwegian are the most recent additions, which makes the generator a practical option for Nordic freelancers who bill clients at home and abroad.",
          "The language of the PDF is independent of the language you use the app in, and of the currency. Invoice a German client in EUR while working in English, or send a Swedish invoice in USD.",
        ],
      },
      {
        title: "Currency is a separate choice",
        showComparisonTable: true,
        bullets: [
          "122 currencies, each with its own symbol and formatting",
          "Number and decimal separators follow the invoice language",
          "Zero-decimal currencies such as JPY are handled correctly",
          "Change the currency without touching the language, and the reverse",
        ],
      },
      {
        title: "Create your invoice and download it",
        bullets: [
          "Open the generator. Nothing to install, and no account.",
          "Pick your language from the dropdown; the form relabels itself",
          "Fill in your client and line items, watching the live PDF preview",
          "Download the PDF, or send a share link",
        ],
      },
    ],
    comparisonTable: {
      heading: "Language support compared",
      intro:
        "Plenty of invoicing tools offer a language setting that only changes their own interface. This compares what changes on the PDF itself.",
      columnLabels: [
        "On the PDF",
        "EasyInvoicePDF.com",
        "Typical invoice tool",
      ],
      rows: [
        {
          feature: "Every label translated",
          thisTool: "✅ Yes",
          other: "⚠️ Often partial",
        },
        {
          feature: "Amount in words",
          thisTool: "✅ 12 languages",
          other: "❌ Rarely",
        },
        {
          feature: "Local date convention",
          thisTool: "✅ Per language",
          other: "⚠️ One format",
        },
        {
          feature: "Local tax wording",
          thisTool: "✅ Automatic",
          other: "⚠️ Manual",
        },
        { feature: "Account required", thisTool: "❌ No", other: "✅ Usually" },
        { feature: "Free", thisTool: "✅ Always", other: "⚠️ Paid plans" },
      ],
    },
    faq: [
      {
        question: "Which languages can I create an invoice in?",
        answer:
          "Twelve: English, Polish, Dutch, French, German, Italian, Norwegian, Portuguese, Russian, Spanish, Swedish and Ukrainian. Swedish and Norwegian are the newest additions.",
      },
      {
        question: "Does changing the language change the currency?",
        answer:
          "No. Language and currency are separate choices, so you can send a Swedish invoice in EUR or a German one in USD. Number formatting follows the invoice language, and 122 currencies are available.",
      },
      {
        question: "Is the amount in words translated too?",
        answer:
          "Yes, and it follows each language's grammar rather than a word-for-word swap. Swedish compounds it into a single word, Norwegian spaces it and inserts og, and the Slavic languages decline it. This is the part most invoice tools leave in English.",
      },
      {
        question: "Can I change the date format?",
        answer:
          "Each language starts with the format it conventionally uses, and you can switch to any other from the dropdown, including ISO 2025-12-17, which is unambiguous for cross-border invoices.",
      },
      {
        question: "Can I use my own word for VAT?",
        answer:
          "Yes. The tax label defaults to the term the selected language uses: Moms, MVA, MwSt., TVA, IVA, BTW, НДС or ПДВ. You can replace it with GST, Sales Tax, or whatever your jurisdiction requires.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No. There is no signup, no email and no credit card. The invoice is built and rendered to PDF entirely in your browser, so the data never reaches a server.",
      },
      {
        question: "Is it really free?",
        answer:
          "Yes. The generator is free and open-source, with no paid tier gating the languages. You can inspect the code on GitHub or host it yourself.",
      },
      {
        question: "Can I send the same invoice in two languages?",
        answer:
          "Switch the language and download again. The invoice content stays as you entered it, and only the generated labels change, so each download gives you a separate PDF.",
      },
    ],
  },
  "swedish-invoice-generator": {
    slug: "swedish-invoice-generator",
    metadata: {
      title: "Swedish Invoice Generator - Free PDF in SEK",
      description:
        "Create a Swedish invoice PDF with SEK amounts, moms wording and Swedish labels on every field. The total is written out in Swedish. Free, no account.",
      keywords:
        "swedish invoice generator, invoice generator sweden, faktura mall, fakturamall gratis, swedish invoice template, invoice in SEK, moms invoice, swedish krona invoice, faktura pdf, invoice for swedish clients",
    },
    hero: {
      h1: "Create a Swedish invoice in SEK",
      subheading:
        "Set the invoice language to Swedish and every printed label changes with it: the seller and buyer blocks, the moms wording, the dates, and the total written out in words. Set the currency to SEK for Swedish krona. Nothing to install, and no account to make.",
      bullets: [
        "Swedish labels on every field of the PDF",
        "SEK amounts, formatted 1 234,56 kr",
        "Total in words: ettusentvåhundratrettiofyra",
        "Free and open source",
      ],
      ctaLabel: "Create a Swedish Invoice",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/default-template-v1.png`,
      heroVideo: {
        embedUrl: VIDEO_NORDIC_INVOICE_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=cFFR-Y_obcU",
        title: "EasyInvoicePDF: Swedish and Norwegian Invoice Generator",
        description:
          "A walkthrough of creating an invoice in Swedish and in Norwegian, with SEK and NOK amounts.",
        uploadDate: "2026-09-14T16:04:04-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/cFFR-Y_obcU/maxresdefault.jpg",
      },
    },
    factsTable: {
      heading: "Swedish invoices at a glance",
      rows: [
        { label: "Invoice language", value: "Swedish (Svenska)" },
        { label: "Currency", value: "SEK, the Swedish krona, printed as kr" },
        {
          label: "Tax wording",
          value: "Moms on the line items, Momssats in the tax summary",
        },
        { label: "Tax number label", value: "Momsreg.nr" },
        {
          label: "Date on the invoice",
          value: "2025-12-17, or 17 december 2025 on the Stripe-style template",
        },
        {
          label: "Total in words",
          value: "ettusentvåhundratrettiofyra for 1234",
        },
        { label: "Account required", value: "No" },
        { label: "Price", value: "Free, and the source is on GitHub" },
      ],
    },
    sections: [
      {
        title: "What changes when you pick Swedish",
        lead: "Choosing Swedish rewrites the PDF itself, not only the app around it. Each printed label comes from a Swedish translation rather than an English string with a Swedish title on top.",
        bullets: [
          "Säljare and Köpare head the seller and buyer blocks",
          "Momsreg.nr labels the tax number, Kontonummer the bank account",
          "The line items run Benämning vara/tjänst, Antal, Enhet, Nettopris",
          "Moms and Momssats carry the tax, and SUMMA closes the table",
          "Att betala, Betalt and Kvar att betala hold the totals",
          "Betalningsmetod and Förfallodatum sit under the payment details",
        ],
      },
      {
        title: "Swedish krona, and every other currency",
        lead: "Currency is a setting of its own, so the language you print in never limits who you can bill.",
        paragraphs: [
          "On the Stripe-style template, SEK follows Swedish convention. A space between thousands, a comma before the decimals, and kr after the figure gives 1 234,56 kr. The default template prints the same amount as 1 234.56 SEK.",
          "You can keep Swedish wording and charge in euros, dollars or Norwegian kroner. All 122 currencies stay available, each with its own symbol.",
        ],
      },
      {
        title: "The total, written out in Swedish",
        lead: "Swedish invoices commonly repeat the total in words under the figure, and Swedish writes those words as a single compound.",
        paragraphs: [
          "The generator spells 1234 as ettusentvåhundratrettiofyra. That includes the detail Swedish spelling depends on. Ett and tusen join as ettusen, because Swedish writes a tripled consonant as two.",
          "Most invoice tools that offer a Swedish interface still print this line in English, or skip it. Here it follows the grammar of whichever of the 12 languages you pick.",
        ],
      },
      {
        title: "Dates, already in Swedish order",
        showComparisonTable: true,
        lead: "Sweden writes dates the ISO way, which is also what the default template uses, so nothing needs adjusting.",
        paragraphs: [
          "An invoice issued on 17 December 2025 is dated 2025-12-17 on the default template and 17 december 2025 on the Stripe-style one. Twelve other formats sit in the dropdown if a client expects something else.",
        ],
      },
      {
        title: "Create a Swedish invoice",
        lead: "Four steps, and nothing to download:",
        bullets: [
          "Open the generator and set Invoice PDF Language to Swedish",
          "Set the currency to SEK",
          "Fill in your details and line items, watching the preview update",
          "Download the PDF, or send your client a link to it",
        ],
      },
    ],
    comparisonTable: {
      heading: "Swedish support compared",
      intro:
        "Many invoice tools translate their own interface and leave the document in English. This compares what reaches your client.",
      columnLabels: [
        "On the PDF",
        "EasyInvoicePDF.com",
        "Typical invoice tool",
      ],
      rows: [
        {
          feature: "Swedish labels",
          thisTool: "✅ Every field",
          other: "⚠️ Often partial",
        },
        {
          feature: "Moms wording",
          thisTool: "✅ Automatic",
          other: "⚠️ Manual",
        },
        {
          feature: "Total in Swedish words",
          thisTool: "✅ Yes",
          other: "❌ Rarely",
        },
        {
          feature: "SEK formatting",
          thisTool: "✅ 1 234,56 kr",
          other: "⚠️ Varies",
        },
        { feature: "Account required", thisTool: "❌ No", other: "✅ Usually" },
        { feature: "Price", thisTool: "✅ Free", other: "⚠️ Paid plans" },
      ],
    },
    faq: [
      {
        question:
          "Can I write the invoice in Swedish but charge in another currency?",
        answer:
          "Yes. Language and currency are separate settings, so Swedish wording works with any of the 122 currencies. Billing a German client in euros while keeping Swedish labels takes one dropdown.",
      },
      {
        question: "Does the invoice say moms or VAT?",
        answer:
          "Moms. Picking Swedish sets the tax label to Moms on the line items and Momssats in the summary table. You can replace it with your own wording, and the generator uses that everywhere the tax appears.",
      },
      {
        question: "How is the total written out in Swedish?",
        answer:
          "As one compound word. The generator spells 1234 as ettusentvåhundratrettiofyra, joining ett and tusen into ettusen the way Swedish spelling requires.",
      },
      {
        question: "Which date format does a Swedish invoice use?",
        answer:
          "The default template dates the invoice 2025-12-17, which matches Swedish practice. The Stripe-style template writes 17 december 2025. Both can be changed to any of the other formats.",
      },
      {
        question: "How are SEK amounts formatted?",
        answer:
          "The Stripe-style template prints 1 234,56 kr, with a space between thousands and a comma before the decimals. The default template prints 1 234.56 SEK.",
      },
      {
        question: "Do I need an account to create a Swedish invoice?",
        answer:
          "No. There is no signup and no email step. The PDF is built in your browser, so the invoice data never reaches a server.",
      },
      {
        question: "Is this accounting software?",
        answer:
          "No. It produces invoice PDFs and does not file, track or reconcile anything, and it makes no compliance guarantees. Check the result against your own bookkeeping requirements.",
      },
    ],
  },
  "norwegian-invoice-generator": {
    slug: "norwegian-invoice-generator",
    metadata: {
      title: "Norwegian Invoice Generator - Free PDF in NOK",
      description:
        "Create a Norwegian invoice PDF with NOK amounts, MVA wording and Norwegian labels on every field. The total is written out in Bokmål. Free, no account.",
      keywords:
        "norwegian invoice generator, invoice generator norway, faktura mal, fakturamal gratis, norwegian invoice template, invoice in NOK, MVA invoice, norwegian krone invoice, faktura pdf norge, invoice for norwegian clients",
    },
    hero: {
      h1: "Create a Norwegian invoice in NOK",
      subheading:
        "Set the invoice language to Norwegian and every printed label changes with it: the seller and buyer blocks, the MVA wording, the dates, and the total written out in words. Set the currency to NOK for Norwegian kroner. Nothing to install, and no account to make.",
      bullets: [
        "Norwegian Bokmål labels on every field of the PDF",
        "NOK amounts, formatted 1 234,56 kr",
        "Total in words: ett tusen to hundre og trettifire",
        "Free and open source",
      ],
      ctaLabel: "Create a Norwegian Invoice",
      ctaHref: DEFAULT_INVOICE_TEMPLATE_HREF,
      heroImage: `${STATIC_ASSETS_URL}/seo-content/default-template-v1.png`,
      heroVideo: {
        embedUrl: VIDEO_NORDIC_INVOICE_YOUTUBE_URL,
        watchUrl: "https://www.youtube.com/watch?v=cFFR-Y_obcU",
        title: "EasyInvoicePDF: Swedish and Norwegian Invoice Generator",
        description:
          "A walkthrough of creating an invoice in Swedish and in Norwegian, with SEK and NOK amounts.",
        uploadDate: "2026-09-14T16:04:04-07:00",
        thumbnailUrl: "https://i.ytimg.com/vi/cFFR-Y_obcU/maxresdefault.jpg",
      },
    },
    factsTable: {
      heading: "Norwegian invoices at a glance",
      rows: [
        { label: "Invoice language", value: "Norwegian Bokmål (Norsk bokmål)" },
        { label: "Currency", value: "NOK, Norwegian kroner, printed as kr" },
        {
          label: "Tax wording",
          value: "MVA on the line items and in the tax summary",
        },
        { label: "Tax number label", value: "Org.nr" },
        {
          label: "Date on the invoice",
          value:
            "2025-12-17, or 17. desember 2025 on the Stripe-style template",
        },
        {
          label: "Total in words",
          value: "ett tusen to hundre og trettifire for 1234",
        },
        { label: "Account required", value: "No" },
        { label: "Price", value: "Free, and the source is on GitHub" },
      ],
    },
    sections: [
      {
        title: "What changes when you pick Norwegian",
        lead: "Choosing Norwegian rewrites the PDF itself, not only the app around it. Each printed label comes from a Bokmål translation rather than an English string with a Norwegian title on top.",
        bullets: [
          "Selger and Kjøper head the seller and buyer blocks",
          "Org.nr labels the organisation number, Kontonummer the bank account",
          "The line items run Beskrivelse vare/tjeneste, Antall, Enhet, Nettopris",
          "MVA carries the tax, and SUM closes the table",
          "Å betale, Betalt and Gjenstår å betale hold the totals",
          "Betalingsmåte and Forfallsdato sit under the payment details",
        ],
      },
      {
        title: "Norwegian kroner, and every other currency",
        lead: "Currency is a setting of its own, so the language you print in never limits who you can bill.",
        paragraphs: [
          "On the Stripe-style template, NOK follows Norwegian convention. A space between thousands, a comma before the decimals, and kr after the figure gives 1 234,56 kr. The default template prints the same amount as 1 234.56 NOK.",
          "You can keep Norwegian wording and charge in euros, dollars or Swedish kronor. All 122 currencies stay available, each with its own symbol.",
        ],
      },
      {
        title: "The total, written out in Bokmål",
        lead: "Norwegian invoices commonly repeat the total in words under the figure, and Norwegian builds those words differently from its Nordic neighbours.",
        paragraphs: [
          "The generator spells 1234 as ett tusen to hundre og trettifire. Tens and units join into one word, as in trettifire, while og introduces the last group under a hundred. Swedish, by contrast, runs the whole number together.",
          "The spelling follows modern Bokmål, using sju and tjue rather than the older syv and tyve. Språkrådet accepts the run-together form as well, so this is a choice between two correct spellings.",
        ],
      },
      {
        title: "Dates with the Norwegian ordinal point",
        showComparisonTable: true,
        lead: "Norwegian writes the day as an ordinal, so a full stop follows the number. It is an easy mark to lose in translation.",
        paragraphs: [
          "An invoice issued on 17 December 2025 reads 17. desember 2025 on the Stripe-style template, with the point after 17. The default template dates it 2025-12-17. Thirteen other formats sit in the dropdown.",
        ],
      },
      {
        title: "Create a Norwegian invoice",
        lead: "Four steps, and nothing to download:",
        bullets: [
          "Open the generator and set Invoice PDF Language to Norwegian",
          "Set the currency to NOK",
          "Fill in your details and line items, watching the preview update",
          "Download the PDF, or send your client a link to it",
        ],
      },
    ],
    comparisonTable: {
      heading: "Norwegian support compared",
      intro:
        "Many invoice tools translate their own interface and leave the document in English. This compares what reaches your client.",
      columnLabels: [
        "On the PDF",
        "EasyInvoicePDF.com",
        "Typical invoice tool",
      ],
      rows: [
        {
          feature: "Bokmål labels",
          thisTool: "✅ Every field",
          other: "⚠️ Often partial",
        },
        {
          feature: "MVA wording",
          thisTool: "✅ Automatic",
          other: "⚠️ Manual",
        },
        {
          feature: "Total in Norwegian words",
          thisTool: "✅ Yes",
          other: "❌ Rarely",
        },
        {
          feature: "NOK formatting",
          thisTool: "✅ 1 234,56 kr",
          other: "⚠️ Varies",
        },
        {
          feature: "Ordinal date point",
          thisTool: "✅ 17. desember",
          other: "⚠️ Often dropped",
        },
        { feature: "Price", thisTool: "✅ Free", other: "⚠️ Paid plans" },
      ],
    },
    faq: [
      {
        question:
          "Can I write the invoice in Norwegian but charge in another currency?",
        answer:
          "Yes. Language and currency are separate settings, so Norwegian wording works with any of the 122 currencies. Billing a Swedish client in SEK while keeping Norwegian labels takes one dropdown.",
      },
      {
        question: "Does the invoice say MVA or VAT?",
        answer:
          "MVA. Picking Norwegian sets the tax label to MVA on the line items and in the summary table. You can replace it with your own wording, and the generator uses that everywhere the tax appears.",
      },
      {
        question: "Is this Bokmål or Nynorsk?",
        answer:
          "Bokmål. The language code is nb, and the wording and number spelling follow modern Bokmål. Nynorsk is not offered at the moment.",
      },
      {
        question: "How is the total written out in Norwegian?",
        answer:
          "As ett tusen to hundre og trettifire for 1234. Tens and units join into a single word, og introduces the final group under a hundred, and the modern sju and tjue spellings are used.",
      },
      {
        question: "Which date format does a Norwegian invoice use?",
        answer:
          "The Stripe-style template writes 17. desember 2025, keeping the ordinal point Norwegian uses. The default template dates the invoice 2025-12-17. Both can be changed.",
      },
      {
        question: "Do I need an account to create a Norwegian invoice?",
        answer:
          "No. There is no signup and no email step. The PDF is built in your browser, so the invoice data never reaches a server.",
      },
      {
        question: "Is this accounting software?",
        answer:
          "No. It produces invoice PDFs and does not file, track or reconcile anything, and it makes no compliance guarantees. Check the result against your own bookkeeping requirements.",
      },
    ],
  },
} as const satisfies Record<SeoLandingSlug, SeoLandingDefinition>;
