import { type routing } from "@/i18n/routing";
import type formats from "@/i18n/request";
import type EnMessages from "./messages/en.json";

type Locale = (typeof routing.locales)[number];
type Messages = typeof EnMessages;
type Formats = typeof formats;

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
    Formats: Formats;
  }
}
