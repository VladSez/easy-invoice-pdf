import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface ConfirmSubscriptionEmailProps {
  confirmationUrl: string;
}

export default function ConfirmSubscriptionEmail({
  confirmationUrl,
}: ConfirmSubscriptionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Confirm your subscription to EasyInvoicePDF.com newsletter
      </Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-20">
            <Heading className="text-2xl font-bold text-gray-900">
              Confirm your subscription
            </Heading>
            <Section className="mt-4">
              <Text className="text-gray-600">
                Thank you for subscribing to the EasyInvoicePDF newsletter!
                Please confirm your subscription by clicking the button below.
              </Text>
              <Button
                className="mt-8 rounded-md bg-slate-900 px-6 py-3 text-white"
                href={confirmationUrl}
              >
                Confirm subscription
              </Button>
              <Text className="mt-4 text-sm text-gray-500">
                Or copy and paste this URL into your browser:{" "}
                <Link href={confirmationUrl} className="text-blue-600">
                  {confirmationUrl}
                </Link>
              </Text>
              <Text className="mt-8 text-sm text-gray-500">
                If you didn&apos;t request this subscription, you can safely
                ignore this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
