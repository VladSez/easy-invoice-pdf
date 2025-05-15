import { z } from "zod";

const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
});

interface SendMessageOptions {
  message: string;
  files?: Array<{
    filename: string;
    buffer: Buffer;
  }>;
}

export async function sendTelegramMessage({
  message,
  files,
}: SendMessageOptions) {
  const config = telegramConfigSchema.parse({
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  });

  try {
    // Send text message
    const textResponse = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!textResponse.ok) {
      throw new Error(
        `Failed to send Telegram message: ${textResponse.statusText}`
      );
    }

    // Send files if any
    if (files?.length) {
      for (const file of files) {
        const formData = new FormData();
        formData.append("chat_id", config.chatId);
        formData.append("document", new Blob([file.buffer]), file.filename);

        const fileResponse = await fetch(
          `https://api.telegram.org/bot${config.botToken}/sendDocument`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!fileResponse.ok) {
          throw new Error(
            `Failed to send file ${file.filename}: ${fileResponse.statusText}`
          );
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}
