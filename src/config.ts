const port = process.env.PORT || 3000;

export const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${port}`;

/**
 * STATIC_ASSETS_URL is used to serve static assets for the PDF templates
 */
export const STATIC_ASSETS_URL = "https://static.easyinvoicepdf.com";

/**
 * Main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_URL = `${STATIC_ASSETS_URL}/demo-videos/easy-invoice-demo-01-2026-v1.mp4`;

/**
 * Fallback image for main demo video on marketing page and "How it works" dialog
 */
export const VIDEO_DEMO_FALLBACK_IMG = `${STATIC_ASSETS_URL}/demo-videos/easy-invoice-demo-01-2026-fallback-img-v1.png`;

/**
 * YouTube URL for main demo video on "How it works" dialog
 */
export const VIDEO_DEMO_YOUTUBE_URL =
  "https://www.youtube.com/embed/iAROeCIcZ40?si=EyJKCsUr43Z8zY1f";

/**
 * YouTube URL for the hero demo video on the marketing page — the stand-in shown to
 * browsers that cannot play the self-hosted MP4 inline. It is its own upload, cut for
 * the hero's browser frame, rather than the longer walkthrough above.
 */
export const VIDEO_DEMO_HERO_YOUTUBE_URL =
  "https://www.youtube.com/embed/wkecHuXWLSQ";

/** Demo for the live PDF preview, used on the open-source landing page. */
export const VIDEO_LIVE_PREVIEW_YOUTUBE_URL =
  "https://www.youtube.com/embed/pWkb_JcKouU";

/** Demo for the Swedish and Norwegian landing pages. */
export const VIDEO_NORDIC_INVOICE_YOUTUBE_URL =
  "https://www.youtube.com/embed/cFFR-Y_obcU";

/** Demo for the multi-language landing page. */
export const VIDEO_MULTI_LANGUAGE_YOUTUBE_URL =
  "https://www.youtube.com/embed/ITMeKohyz3I";

export const YOUTUBE_VIDEO_HOW_TO_ADD_SELLER =
  "https://www.youtube.com/embed/xfSF35c0vfU";

export const YOUTUBE_VIDEO_HOW_TO_ADD_BUYER =
  "https://www.youtube.com/embed/XxAY0YGgXIk";

const YOUTUBE_VIDEO_HOW_TO_ADD_INVOICE_FOR_ONE_WEEK =
  "https://www.youtube.com/embed/6KzDBBiAJmg";

const YOUTUBE_VIDEO_HOW_TO_CUSTOMIZE_TAX =
  "https://www.youtube.com/embed/F_iJxZ3PHbk";

/**
 * Video catalog for the "How it works" dialog
 */
export const HOW_IT_WORKS_VIDEOS = [
  {
    id: "overview",
    tabLabel: "Overview",
    tabLabelShort: "Overview",
    title: "How EasyInvoicePDF Works",
    description: "Learn how to create and customize your invoices.",
    embedUrl: VIDEO_DEMO_YOUTUBE_URL,
    watchUrl: "https://www.youtube.com/watch?v=iAROeCIcZ40",
    uploadDate: "2026-04-16T15:49:53-07:00",
    thumbnailUrl: "https://i.ytimg.com/vi/iAROeCIcZ40/maxresdefault.jpg",
    iframeTitle: "EasyInvoicePDF Demo Video",
  },
  {
    id: "add-seller",
    tabLabel: "Add seller",
    tabLabelShort: "Seller",
    title: "How to add a seller",
    description: "Save seller details and reuse them on future invoices.",
    embedUrl: YOUTUBE_VIDEO_HOW_TO_ADD_SELLER,
    watchUrl: "https://www.youtube.com/watch?v=xfSF35c0vfU",
    uploadDate: "2026-06-13T13:06:34-07:00",
    thumbnailUrl: "https://i.ytimg.com/vi/xfSF35c0vfU/maxresdefault.jpg",
    iframeTitle: "How to add a seller - EasyInvoicePDF",
  },
  {
    id: "add-buyer",
    tabLabel: "Add buyer",
    tabLabelShort: "Buyer",
    title: "How to add a buyer",
    description: "Save buyer details and reuse them on future invoices.",
    embedUrl: YOUTUBE_VIDEO_HOW_TO_ADD_BUYER,
    watchUrl: "https://www.youtube.com/watch?v=XxAY0YGgXIk",
    uploadDate: "2026-06-13T13:17:28-07:00",
    thumbnailUrl: "https://i.ytimg.com/vi/XxAY0YGgXIk/maxresdefault.jpg",
    iframeTitle: "How to add a buyer - EasyInvoicePDF",
  },
  {
    id: "weekly-invoices",
    tabLabel: "Weekly invoices",
    tabLabelShort: "Weekly",
    title: "How to create invoices for one week",
    description: "Learn how to generate invoices for a week of work.",
    embedUrl: YOUTUBE_VIDEO_HOW_TO_ADD_INVOICE_FOR_ONE_WEEK,
    watchUrl: "https://www.youtube.com/watch?v=6KzDBBiAJmg",
    uploadDate: "2026-06-13T13:23:38-07:00",
    thumbnailUrl: "https://i.ytimg.com/vi/6KzDBBiAJmg/maxresdefault.jpg",
    iframeTitle: "How to create weekly invoices - EasyInvoicePDF",
  },
  {
    id: "custom-tax",
    tabLabel: "Customizable tax",
    tabLabelShort: "Tax",
    title: "How to customize tax",
    description:
      "Rename VAT to GST, Sales Tax, or any label, and set a rate per item.",
    embedUrl: YOUTUBE_VIDEO_HOW_TO_CUSTOMIZE_TAX,
    watchUrl: "https://www.youtube.com/watch?v=F_iJxZ3PHbk",
    uploadDate: "2026-09-08T16:22:57-07:00",
    thumbnailUrl: "https://i.ytimg.com/vi/F_iJxZ3PHbk/maxresdefault.jpg",
    iframeTitle: "How to customize tax on an invoice - EasyInvoicePDF",
  },
] as const satisfies {
  id: string;
  tabLabel: string;
  tabLabelShort: string;
  title: string;
  description: string;
  embedUrl: string;
  watchUrl: string;
  uploadDate: string;
  thumbnailUrl: string;
  iframeTitle: string;
}[];

export const PROD_WEBSITE_URL = "https://easyinvoicepdf.com";

export const FOUNDER_AVATAR_URL =
  "https://ik.imagekit.io/fl2lbswwo/avatar.jpeg?updatedAt=1757456439459";

export const GITHUB_URL = "https://github.com/VladSez/easy-invoice-pdf";

export const LINKEDIN_URL = "https://www.linkedin.com/in/vlad-sazonau/";

export const TWITTER_URL = "https://x.com/vladsazonau";
export const TWITTER_CREATOR = "@vlad_sazonau";

export const PRODUCT_TWITTER_URL = "https://x.com/EasyInvoicePDF";

export const REDDIT_COMMUNITY_URL = "https://www.reddit.com/r/EasyInvoicePDF/";
export const DISCORD_COMMUNITY_URL = "https://discord.gg/gAr3HteWta";
export const DISCORD_FEEDBACK_URL = "https://discord.gg/kxTCK2Q7";

export const PERSONAL_WEBSITE_URL = "https://vladsazon.com";

export const BUG_REPORT_URL =
  "https://pdfinvoicegenerator.userjot.com/board/bugs";

export const CONTACT_SUPPORT_EMAIL = "vlad@mail.easyinvoicepdf.com";

/**
 * Marketing features cards for the about page
 */
export const MARKETING_FEATURES_CARDS = [
  {
    translationKey: "livePreview",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/live-preview-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/live-preview-fallback-v1.png`,
    videoDescription: "Live preview of the invoice as you make changes",
    youtubeVideoId: "pWkb_JcKouU",
  },
  {
    translationKey: "instantDownload",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/instand-download-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/instant-download-fallback-04-03-2026.png`,
    videoDescription: "Instant download of the invoice as a PDF file",
    youtubeVideoId: "I4ygKyyyJ4I",
  },
  {
    translationKey: "shareableLinks",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/share-invoice-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/share-invoice-fallback-v1.png`,
    videoDescription: "Shareable links to your invoice",
    youtubeVideoId: "GBNQtBciCJI",
  },
  {
    translationKey: "taxSupport",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/tax-custom-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/tax-custom-fallback-v1.png`,
    videoDescription: "Customizable tax system support",
    youtubeVideoId: "F_iJxZ3PHbk",
  },
  {
    translationKey: "multiLanguage",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/multi-lang-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/multi-lang-fallback-v1.png`,
    videoDescription: "Multiple languages and currencies support",
    youtubeVideoId: "ITMeKohyz3I",
  },
  {
    translationKey: "openSource",
    videoSrc: `${STATIC_ASSETS_URL}/demo-videos/open-source-v1.mp4`,
    videoFallbackImg: `${STATIC_ASSETS_URL}/demo-videos/open-source-fallback-v1.png`,
    videoDescription: "Open source invoice generator",
    youtubeVideoId: "mBam1T7peJA",
  },
] as const satisfies {
  translationKey: string;
  videoSrc: string;
  videoFallbackImg: string;
  videoDescription: string;
  /**
   * Bare YouTube video id of the same demo, played on mobile instead of the MP4.
   * Stored as an id rather than a URL because looping a single video needs it
   * twice — once in the path and once as `playlist` (see `AutoPlayYouTubeEmbed`).
   */
  youtubeVideoId: string;
}[];

/**
 * Fonts that we use to render invoice pdf templates via `@react-pdf/renderer`
 */
export const INVOICE_PDF_FONTS = {
  DEFAULT_TEMPLATE: {
    OPEN_SANS_REGULAR: `${STATIC_ASSETS_URL}/open-sans-regular.ttf`,
    OPEN_SANS_700: `${STATIC_ASSETS_URL}/open-sans-700.ttf`,
  },
  STRIPE_TEMPLATE: {
    INTER_REGULAR: `${STATIC_ASSETS_URL}/Inter-Regular.ttf`,
    INTER_MEDIUM: `${STATIC_ASSETS_URL}/Inter-Medium.ttf`,
    INTER_SEMIBOLD: `${STATIC_ASSETS_URL}/Inter-SemiBold.ttf`,
  },
} as const satisfies Record<
  "DEFAULT_TEMPLATE" | "STRIPE_TEMPLATE",
  { [key: string]: string }
>;
