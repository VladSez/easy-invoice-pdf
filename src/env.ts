import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    SENTRY_ENABLED: z.string().min(1),

    AUTH_TOKEN: z.string().min(1),

    RESEND_API_KEY: z.string().min(1),
    RESEND_AUDIENCE_ID: z.string().min(1),

    UPSTASH_REDIS_REST_URL: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    TELEGRAM_BOT_TOKEN: z.string().min(1),
    TELEGRAM_CHAT_ID: z.string().min(1),

    SELLER_NAME: z.string().min(1),
    SELLER_ADDRESS: z.string().min(1),
    SELLER_VAT_NO: z.string().min(1),
    SELLER_EMAIL: z.string().email(),
    SELLER_ACCOUNT_NUMBER: z.string().min(1),
    SELLER_SWIFT_BIC: z.string().min(1),

    BUYER_NAME: z.string().min(1),
    BUYER_ADDRESS: z.string().min(1),
    BUYER_VAT_NO: z.string().min(1),
    BUYER_EMAIL: z.string().email(),

    INVOICE_NET_PRICE: z.string().min(1),
    INVOICE_EMAIL_RECIPIENT: z.string().email(),

    GOOGLE_DRIVE_PARENT_FOLDER_ID: z.string().min(1),
    GOOGLE_DRIVE_CLIENT_EMAIL: z.string().email(),
    GOOGLE_DRIVE_PRIVATE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SENTRY_ENABLED: z.string().min(1),
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    SENTRY_ENABLED: process.env.SENTRY_ENABLED,
    NEXT_PUBLIC_SENTRY_ENABLED: process.env.NEXT_PUBLIC_SENTRY_ENABLED,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,

    AUTH_TOKEN: process.env.AUTH_TOKEN,

    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,

    SELLER_NAME: process.env.SELLER_NAME,
    SELLER_ADDRESS: process.env.SELLER_ADDRESS,
    SELLER_VAT_NO: process.env.SELLER_VAT_NO,
    SELLER_EMAIL: process.env.SELLER_EMAIL,
    SELLER_ACCOUNT_NUMBER: process.env.SELLER_ACCOUNT_NUMBER,
    SELLER_SWIFT_BIC: process.env.SELLER_SWIFT_BIC,

    BUYER_NAME: process.env.BUYER_NAME,
    BUYER_ADDRESS: process.env.BUYER_ADDRESS,
    BUYER_VAT_NO: process.env.BUYER_VAT_NO,
    BUYER_EMAIL: process.env.BUYER_EMAIL,

    INVOICE_NET_PRICE: process.env.INVOICE_NET_PRICE,
    INVOICE_EMAIL_RECIPIENT: process.env.INVOICE_EMAIL_RECIPIENT,

    GOOGLE_DRIVE_PARENT_FOLDER_ID: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
    GOOGLE_DRIVE_CLIENT_EMAIL: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    GOOGLE_DRIVE_PRIVATE_KEY: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
  },
});
