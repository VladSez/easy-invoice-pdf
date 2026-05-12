import { z } from "zod";

const telegramMessageSchema = z
  .object({
    message_id: z.number().int(),
    from: z
      .object({
        id: z.number().int(),
        is_bot: z.boolean(),
        first_name: z.string(),
      })
      .strict(),
    chat: z
      .object({
        id: z.number().int(),
        type: z.string(),
      })
      .strict(),
    date: z.number().int().nonnegative(),
    text: z
      .string()
      .refine((val) => val === "/generate", {
        message: "Only '/generate' command is supported",
      })
      .optional(),
    entities: z
      .array(
        z
          .object({
            offset: z.number().int().nonnegative(),
            length: z.number().int().positive(),
            type: z.string(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export const telegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
    message: telegramMessageSchema.optional(),
  })
  .strict();
