"use server";

import { z } from "zod";
import { resend } from "@/lib/resend";
import { generateSubscriptionToken } from "@/utils/subscription-token";
import { checkRateLimit, ipLimiter, emailLimiter } from "@/lib/rate-limit";
import { headers } from "next/headers";
import ConfirmSubscriptionEmail from "@/emails/confirm-subscription";

const subscribeSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
  })
  .strict();

if (!process.env.RESEND_AUDIENCE_ID) {
  throw new Error("RESEND_AUDIENCE_ID is not set");
}

const CONFIRMATION_URL =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export async function subscribeAction(formData: FormData) {
  try {
    const email = formData.get("email");
    const validatedFields = subscribeSchema.parse({ email });

    // Get IP address for rate limiting
    const forwardedFor = headers().get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0] || "127.0.0.1";

    // Check IP rate limit
    const ipLimit = await checkRateLimit(ip, ipLimiter);
    if (!ipLimit.success) {
      return { error: ipLimit.error };
    }

    // Check email rate limit
    const emailLimit = await checkRateLimit(
      validatedFields.email.toLowerCase(),
      emailLimiter
    );
    if (!emailLimit.success) {
      return { error: emailLimit.error };
    }

    // Check if email already exists
    const { data: existingContacts } = await resend.contacts.list({
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
    });

    if (
      existingContacts?.data?.some(
        (contact) =>
          contact.email.toLowerCase() === validatedFields.email.toLowerCase()
      )
    ) {
      return { error: "This email is already subscribed." };
    }

    // Generate confirmation token
    const token = await generateSubscriptionToken(validatedFields.email);
    const confirmationUrl = `${CONFIRMATION_URL}/confirm-subscription?token=${token}`;

    // Send confirmation email
    const { error: emailError } = await resend.emails.send({
      from: "Vlad from EasyInvoicePDF.com <vlad@updates.easyinvoicepdf.com>",
      to: validatedFields.email,
      subject: "Confirm your subscription to EasyInvoicePDF newsletter",
      react: ConfirmSubscriptionEmail({ confirmationUrl }),
    });

    if (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      return { error: "Failed to send confirmation email. Please try again." };
    }

    return {
      success: true,
      message: "Please check your email to confirm your subscription.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to subscribe. Please try again." };
  }
}
