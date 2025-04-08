import { z } from "zod";

const metadataSchema = z
  .object({
    about: z
      .object({
        title: z.string(),
        description: z.string(),
        keywords: z.string(),
      })
      .strict(),
  })
  .strict();

const notFoundSchema = z
  .object({
    error: z.string(),
    message: z.string(),
    returnHome: z.string(),
  })
  .strict();

const errorSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    bugReport: z.string(),
    tryAgain: z.string(),
    goBack: z.string(),
    toastMessage: z.string(),
  })
  .strict();

const aboutFeaturesItemSchema = z
  .object({
    title: z.string(),
    description: z.string(),
  })
  .strict();

const aboutFeaturesSchema = z
  .object({
    badge: z.string(),
    title: z.string(),
    description: z.string(),
    items: z
      .object({
        livePreview: aboutFeaturesItemSchema,
        shareableLinks: aboutFeaturesItemSchema,
        instantDownload: aboutFeaturesItemSchema,
        multiLanguage: aboutFeaturesItemSchema,
        vatSupport: aboutFeaturesItemSchema,
        openSource: aboutFeaturesItemSchema,
      })
      .strict(),
  })
  .strict();

const aboutSchema = z
  .object({
    meta: z
      .object({
        title: z.string(),
        description: z.string(),
        keywords: z.string(),
      })
      .strict(),
    tagline: z.string(),
    hero: z
      .object({
        title: z.string(),
        description: z.string(),
        noSignup: z.string(),
      })
      .strict(),
    features: aboutFeaturesSchema,
    cta: z
      .object({
        title: z.string(),
        description: z.string(),
        noSignup: z.string(),
      })
      .strict(),
    footer: z
      .object({
        description: z.string(),
        product: z.string(),
        links: z
          .object({
            features: z.string(),
            github: z.string(),
          })
          .strict(),
        copyright: z.string(),
        createdBy: z.string(),
      })
      .strict(),
    buttons: z
      .object({
        goToApp: z.string(),
        viewOnGithub: z.string(),
        switchLanguage: z.string(),
      })
      .strict(),
    newsletter: z
      .object({
        title: z.string(),
        description: z.string(),
        subscribe: z.string(),
        placeholder: z.string(),
        success: z.string(),
        error: z.string(),
        emailLanguageInfo: z.string(),
      })
      .strict(),
  })
  .strict();

export const messagesSchema = z
  .object({
    About: aboutSchema,
    NotFound: notFoundSchema,
    Error: errorSchema,
    Metadata: metadataSchema,
  })
  .strict();

export type Messages = z.infer<typeof messagesSchema>;
