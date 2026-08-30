/**
 * Fake `@/env` values shared by the generate-invoice test suites.
 *
 * Tests that render real PDFs assert on these values (seller/buyer names,
 * net price), so keep them stable — changing one changes those assertions.
 */
export const TEST_ENV = {
  AUTH_TOKEN: "test-auth-token",
  RESEND_API_KEY: "re_test_123",
  UPSTASH_REDIS_REST_URL: "https://redis.test",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
  TELEGRAM_BOT_TOKEN: "telegram-token",
  TELEGRAM_CHAT_ID: "telegram-chat-id",
  SELLER_NAME: "Test Seller",
  SELLER_ADDRESS: "Seller Address",
  SELLER_VAT_NO: "SELLER-VAT",
  SELLER_EMAIL: "seller@test.com",
  SELLER_ACCOUNT_NUMBER: "123456789",
  SELLER_SWIFT_BIC: "TESTBIC",
  BUYER_NAME: "Test Buyer",
  BUYER_ADDRESS: "Buyer Address",
  BUYER_VAT_NO: "BUYER-VAT",
  BUYER_EMAIL: "buyer@test.com",
  INVOICE_NET_PRICE: "1000",
  INVOICE_EMAIL_RECIPIENT: "recipient@test.com",
  INVOICE_EMAIL_COMPANY_TO: "company@test.com",
  GOOGLE_DRIVE_PARENT_FOLDER_ID: "folder-123",
  GOOGLE_DRIVE_CLIENT_EMAIL: "drive@test.com",
  GOOGLE_DRIVE_PRIVATE_KEY: "private-key",
  GITHUB_TOKEN: "github-token",
  NEXT_PUBLIC_SENTRY_DSN: "https://sentry.test",
} as const;
