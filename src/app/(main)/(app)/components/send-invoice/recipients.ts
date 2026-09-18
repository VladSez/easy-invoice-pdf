import { z } from "zod";

/**
 * Recipient parsing and validation for the compose fields.
 *
 * The address fields are free text — a user pastes several addresses at once,
 * separated however their previous mail client separated them — so a field is
 * only turned into recipients here, and the same rule decides what the server
 * will accept.
 */

const emailSchema = z.string().email();

/** Splits a comma- or semicolon-separated field into individual recipients. */
export function parseRecipients(value: string) {
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * The recipients the send API would reject, in the order they were typed.
 *
 * Validating in the browser is not a substitute for the server's own check —
 * it is what keeps a typo from costing a PDF render and an upload before the
 * user is told which address is wrong.
 */
export function findInvalidRecipients(recipients: string[]) {
  return recipients.filter(
    (recipient) => !emailSchema.safeParse(recipient).success,
  );
}

/** Names the offending addresses in a single sentence for the user. */
export function describeInvalidRecipients(invalidRecipients: string[]) {
  return invalidRecipients.length === 1
    ? `${invalidRecipients[0]} is not a valid email address.`
    : `These are not valid email addresses: ${invalidRecipients.join(", ")}.`;
}
