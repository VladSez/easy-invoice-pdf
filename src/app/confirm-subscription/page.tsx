import { verifySubscriptionToken } from "@/utils/subscription-token";
import { resend } from "@/lib/resend";
import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  searchParams: { token?: string };
}

export default async function ConfirmSubscriptionPage({
  searchParams,
}: PageProps) {
  const token = searchParams.token;

  if (!token) {
    redirect("/en/about");
  }

  // Get IP address for rate limiting
  const forwardedFor = headers().get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] || "127.0.0.1";

  const { email, isValid, error } = await verifySubscriptionToken(token, ip);

  if (!isValid) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Invalid or Expired Link
        </h1>
        {error ? (
          <Text>{error}</Text>
        ) : (
          <Text>
            This confirmation link is invalid or has expired. Please try
            subscribing again on the{" "}
            <CustomEmailLink href="/about">about page</CustomEmailLink>
          </Text>
        )}
      </div>
    );
  }

  try {
    // Add contact to Resend audience
    const { error } = await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID as string,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-2xl font-bold text-emerald-600">
          Subscription Confirmed!
        </h1>
        <Text>
          Thank you for confirming your subscription to the EasyInvoicePDF
          newsletter! You&apos;ll now receive updates about new features and
          improvements.
        </Text>
        <Text>
          <b>Ready to create your first invoice?</b>{" "}
          <Link
            href="/"
            className="inline-flex items-center font-medium text-emerald-600 underline underline-offset-4 transition-opacity hover:opacity-80"
          >
            Go to the app
          </Link>{" "}
          to get started.
        </Text>
      </div>
    );
  } catch {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Something Went Wrong
        </h1>
        <Text>
          We couldn&apos;t confirm your subscription. Please try subscribing
          again on the{" "}
          <CustomEmailLink href="/about">about page</CustomEmailLink>.
        </Text>
      </div>
    );
  }
}

function Text({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-lg text-balance text-base leading-relaxed text-slate-600">
      {children}
    </p>
  );
}

function CustomEmailLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center font-medium text-emerald-600 underline underline-offset-4 transition-opacity hover:opacity-80"
    >
      {children}
    </Link>
  );
}
