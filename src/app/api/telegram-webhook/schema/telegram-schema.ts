import { z } from "zod";

export const telegramMessageEntitySchema = z
  .object({
    offset: z.number().int().nonnegative(),
    length: z.number().int().positive(),
    type: z.string(),
  })
  .strict();

export type TelegramMessageEntity = z.infer<typeof telegramMessageEntitySchema>;

export const telegramFromSchema = z
  .object({
    id: z.number().int(),
    is_bot: z.boolean(),
    first_name: z.string(),
  })
  .strict();

export type TelegramFrom = z.infer<typeof telegramFromSchema>;

export const telegramChatSchema = z
  .object({
    id: z.number().int(),
    type: z.string(),
  })
  .strict();

export type TelegramChat = z.infer<typeof telegramChatSchema>;

export const telegramMessageSchema = z
  .object({
    message_id: z.number().int(),
    from: telegramFromSchema,
    chat: telegramChatSchema,
    date: z.number().int().nonnegative(),
    text: z.string().refine((val) => val === "/generate", {
      message: "Only '/generate' command is supported",
    }).optional(),
    entities: z.array(telegramMessageEntitySchema).optional(),
  })
  .strict();

export type TelegramMessage = z.infer<typeof telegramMessageSchema>;

export const telegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
    message: telegramMessageSchema.optional(),
  })
  .strict();

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
