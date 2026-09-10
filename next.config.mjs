// @ts-check

import fs from "node:fs";
import path from "node:path";

import createMDX from "@next/mdx";
import { withSentryConfig } from "@sentry/nextjs";
import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const loadTsFileViaJiti = createJiti(import.meta.filename);

// Import ENV file here to validate during build. jiti lets us import .ts files :)
// (jiti v2 deprecated the callable form in favour of `.import()`)
await loadTsFileViaJiti.import("./src/env");

// Validate all i18n files, that are used to translate the /about page
async function validatei18nAndInvoicePDFTranslationFiles() {
  // Validates our custom translations object against the schema, that is used to translate PDF fields, invoice items table, etc.
  try {
    // Import the translations schema and catalog using jiti
    // @ts-ignore
    const { invoicePDFTranslationsSchema } = await loadTsFileViaJiti.import(
      "./src/app/(main)/(app)/pdf-i18n-translations/pdf-translations-schema.ts",
    );
    // @ts-ignore
    const { INVOICE_PDF_TRANSLATIONS } = await loadTsFileViaJiti.import(
      "./src/app/(main)/(app)/pdf-i18n-translations/pdf-translations.ts",
    );

    const result = invoicePDFTranslationsSchema.safeParse(
      INVOICE_PDF_TRANSLATIONS,
    );

    if (!result.success) {
      console.error("❌ Invalid PDF translations:", result.error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error validating PDF translations:", error);
    process.exit(1);
  }

  const messagesDir = path.join(process.cwd(), "messages");

  // Import the messages schema using jiti
  // @ts-ignore
  const { messagesSchema } = await loadTsFileViaJiti.import(
    "./src/app/schema/i18n-schema.ts",
  );

  // Validate messages
  const is18nJSONMessageFiles = fs.readdirSync(messagesDir).filter((file) => {
    return file.endsWith(".json");
  });

  const validationPromises = is18nJSONMessageFiles.map(async (file) => {
    try {
      const messages = JSON.parse(
        await fs.promises.readFile(path.join(messagesDir, file), "utf8"),
      );

      const result = messagesSchema.safeParse(messages);

      if (!result.success) {
        return {
          file,
          success: false,
          error: result.error.message,
        };
      }

      return {
        file,
        success: true,
      };
    } catch (error) {
      return {
        file,
        success: false,
        error: `Error reading/parsing file: ${error}`,
      };
    }
  });

  const results = await Promise.allSettled(validationPromises);

  const hasErrors = results.some((result) => {
    return (
      result.status === "rejected" ||
      (result.status === "fulfilled" && !result.value.success)
    );
  });

  if (hasErrors) {
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(`❌ Unexpected error:`, result.reason);
      } else if (!result.value.success) {
        console.error(
          `❌ Invalid i18n messages in ${result.value.file}:`,
          result.value.error,
        );
      }
    });

    console.error("❌ Message validation failed");
    process.exit(1);
  }
}

// Deliberately not awaited at the top level: validation runs alongside the rest of
// the config evaluation instead of blocking it, and failures exit the process below.
// oxlint-disable-next-line unicorn/prefer-top-level-await
validatei18nAndInvoicePDFTranslationFiles().catch((error) => {
  console.error("❌ Fatal error during validation:", error);
  process.exit(1);
});

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  extension: /\.mdx?$/,
  options: {
    // Plugins must be referenced by name (not imported) so Turbopack can
    // serialize the loader options and resolve them itself.
    remarkPlugins: [["remark-gfm"]],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist ships untranspiled ES2022 (static init blocks, private static
  // methods). Next does not compile node_modules, so the chunk reaches the
  // browser as-is and any Safari < 16.4 dies parsing it with
  // "SyntaxError: Unexpected token '{'". Running it through SWC with our
  // browser targets lowers that syntax.
  //
  // Those targets come from `.browserslistrc`, which pins the Next 15 list --
  // Next 16's built-in default is `safari 16.4`, under which there would be
  // nothing left for this entry to lower.
  transpilePackages: ["pdfjs-dist"],
  // Configure the file extensions that Next.js should handle
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  compiler: {
    // `console.error` survives: the traces that used to make the production console
    // unreadable are gated behind `debugLog` now, so what is left is genuine failures --
    // worth having in a user's console when they send a screenshot of one.
    removeConsole:
      process.env.VERCEL_ENV === "production" ? { exclude: ["error"] } : false,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // `react-pdf` imports the bare `pdfjs-dist` specifier, which resolves to pdf.js's
  // *modern* build. That build calls `URL.parse()` (Safari 18.4+) and
  // `Promise.withResolvers()` (Safari 17.4+) unguarded, so the mobile PDF viewer dies
  // with "URL.parse is not a function" on any slightly older iOS Safari.
  //
  // pdf.js ships a `legacy/` build for exactly this: same API, plus the core-js
  // polyfills. We point the browser bundle at it (the worker is imported by its
  // legacy path directly in `mobile-pdf-viewer.tsx`).
  //
  // Turbopack powers both `next dev` and `next build` since Next.js 16 (a `webpack`
  // key here would make `next build` refuse to run). Only the bare specifier is
  // aliased; deep imports (`pdfjs-dist/legacy/build/...`) are left alone.
  turbopack: {
    resolveAlias: {
      "pdfjs-dist": { browser: "pdfjs-dist/legacy/build/pdf.mjs" },
    },
  },
  async rewrites() {
    return [
      {
        // proxy umami analytics https://umami.is/docs/guides/running-on-vercel
        source: "/stats/:match*",
        destination: "https://cloud.umami.is/:match*",
      },
    ];
  },
  async redirects() {
    return [
      // Redirect all /:locale/app requests to the root, because we changed the structure of the app
      {
        source: "/:locale/app",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(withNextIntl(withMDX(nextConfig)), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "easyinvoicepdf",
  project: "easy-invoice-pdf",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  bundleSizeOptimizations: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    // (bundler-agnostic replacement for `webpack.treeshake.removeDebugLogging`)
    excludeDebugStatements: true,
  },

  _experimental: {
    // Automatically annotate React components to show their full name in breadcrumbs
    // and session replay. `webpack.reactComponentAnnotation` is a no-op under
    // Turbopack; this is its Turbopack counterpart (Next.js 16+).
    turbopackReactComponentAnnotation: {
      enabled: true,
    },
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",
});
