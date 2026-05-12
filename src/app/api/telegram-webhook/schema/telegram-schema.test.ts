import { describe, it, expect } from "vitest";
import { telegramUpdateSchema } from "./telegram-schema";

describe("Telegram Schema Validation", () => {
  describe("telegramUpdateSchema", () => {
    it("should validate a valid Telegram update", () => {
      const validUpdate = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(validUpdate);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.update_id).toBe(123456789);
        expect(result.data.message?.text).toBe("/generate");
      }
    });

    it("should validate message without entities", () => {
      const updateWithoutEntities = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithoutEntities);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.message?.entities).toBeUndefined();
      }
    });

    it("should reject update with missing update_id", () => {
      const invalidUpdate = {
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(invalidUpdate);

      expect(result.success).toBe(false);
    });

    it("should reject update with missing message", () => {
      const updateWithoutMessage = {
        update_id: 123456789,
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithoutMessage);

      expect(result.success).toBe(false);
    });

    it("should reject update with invalid from object", () => {
      const invalidUpdate = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: "not-a-number",
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("should reject update with extra unknown fields", () => {
      const updateWithExtra = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
        extra_field: "should fail",
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithExtra);
      expect(result.success).toBe(false);
    });

    it("should validate update with entities", () => {
      const updateWithEntities = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
          entities: [
            {
              offset: 0,
              length: 9,
              type: "bot_command",
            },
          ],
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithEntities);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.message?.entities).toHaveLength(1);
        expect(result.data.message?.entities?.[0].type).toBe("bot_command");
      }
    });

    it("should reject message with text other than '/generate'", () => {
      const updateWithInvalidCommand = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/start",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithInvalidCommand);
      expect(result.success).toBe(false);
    });

    it("should reject message with empty text", () => {
      const updateWithEmptyText = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithEmptyText);
      expect(result.success).toBe(false);
    });

    it("should accept message with exactly '/generate' text", () => {
      const updateWithGenerateCommand = {
        update_id: 123456789,
        message: {
          message_id: 1,
          from: {
            id: 987654321,
            is_bot: false,
            first_name: "John",
          },
          chat: {
            id: 987654321,
            type: "private",
          },
          date: 1234567890,
          text: "/generate",
        },
      } as const;

      const result = telegramUpdateSchema.safeParse(updateWithGenerateCommand);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.message?.text).toBe("/generate");
      }
    });
  });
});
