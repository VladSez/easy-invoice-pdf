import { env } from "@/env";

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
  try {
    // Send text message
    const textResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
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
        formData.append("chat_id", env.TELEGRAM_CHAT_ID);
        formData.append("document", new Blob([file.buffer]), file.filename);

        const fileResponse = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`,
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
