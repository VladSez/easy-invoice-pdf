// @ts-check

import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import { createJiti } from "jiti";

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const loadTsFileViaJiti = createJiti(fileURLToPath(import.meta.url));

// Validate translations object against schema, that is used to translate pdf fields
async function validateTranslations() {
  try {
    // Import the translations schema using jiti
    // @ts-ignore
    const { translationsSchema, TRANSLATIONS } = await loadTsFileViaJiti.import(
      "./src/app/schema/translations.ts"
    );

    const result = translationsSchema.safeParse(TRANSLATIONS);
    if (!result.success) {
      console.error("❌ Invalid translations:", result.error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error validating translations:", error);
    process.exit(1);
  }
}

// Validate all i18n files, that are used to translate the /about page
async function validatei18n() {
  const messagesDir = path.join(process.cwd(), "messages");

  // Validate translations first
  await validateTranslations();

  // Import the messages schema using jiti
  // @ts-ignore
  const { messagesSchema } = await loadTsFileViaJiti.import(
    "./src/app/schema/i18n-messages.ts"
  );

  // Validate messages
  const is18nJSONMessageFiles = fs
    .readdirSync(messagesDir)
    .filter((file) => file.endsWith(".json"));

  const validationPromises = is18nJSONMessageFiles.map(async (file) => {
    try {
      const messages = JSON.parse(
        await fs.promises.readFile(path.join(messagesDir, file), "utf8")
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

  const hasErrors = results.some(
    (result) =>
      result.status === "rejected" ||
      (result.status === "fulfilled" && !result.value.success)
  );

  if (hasErrors) {
    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error(`❌ Unexpected error:`, result.reason);
      } else if (!result.value.success) {
        console.error(
          `❌ Invalid i18n messages in ${result.value.file}:`,
          result.value.error
        );
      }
    });

    console.error("❌ Message validation failed");
    process.exit(1);
  }
}

// Since the function is now async, we need to handle it properly
validatei18n().catch((error) => {
  console.error("❌ Fatal error during validation:", error);
  process.exit(1);
});

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/en.json",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.VERCEL_ENV === "production",
  },
  logging: {
    fetches: {
      fullUrl: true,
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
};

export default withSentryConfig(withNextIntl(nextConfig), {
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

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
