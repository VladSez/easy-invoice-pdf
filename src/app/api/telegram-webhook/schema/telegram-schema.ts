import { z } from "zod";

const telegramMessageSchema = z
  .object({
    message_id: z.number().int(),
    from: z.object({
      id: z.number().int(),
      is_bot: z.boolean(),
      first_name: z.string(),
    }),
    chat: z.object({
      id: z.number().int(),
      type: z.string(),
    }),
    date: z.number().int().nonnegative(),
    text: z
      .string()
      .min(1, "Text cannot be empty")
      .refine((val) => val === "/generate", {
        message: "Only '/generate' command is supported",
      })
      .optional(),
    entities: z
      .array(
        z.object({
          offset: z.number().int().nonnegative(),
          length: z.number().int().positive(),
          type: z.string(),
        }),
      )
      .optional(),
  })
  .strict();

export const telegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
    message: telegramMessageSchema,
  })
  .strict();
