import { z } from "zod";

const metadataSchema = z
  .object({
    about: z
      .object({
        title: z.string(),
        description: z.string(),
        keywords: z.string(),
        siteName: z.string(),
      })
      .strict(),
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
    comingSoon: z.string(),
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
        shareFeedback: z.string(),
        app: z.string(),
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

const faqSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    badge: z.string(),
    items: z
      .object({
        whatIs: z.object({
          question: z.string(),
          answer: z.string(),
        }),
        isFree: z.object({
          question: z.string(),
          answer: z.string(),
        }),
        accountNeeded: z.object({
          question: z.string(),
          answer: z.string(),
        }),
        customization: z.object({
          question: z.string(),
          answer: z.string(),
        }),
        dataSecurity: z.object({
          question: z.string(),
          answer: z.string(),
        }),
        sharing: z.object({
          question: z.string(),
          answer: z.string(),
        }),
      })
      .strict(),
  })
  .strict();

export const messagesSchema = z
  .object({
    About: aboutSchema,
    Metadata: metadataSchema,
    FAQ: faqSchema,
  })
  .strict();

export type Messages = z.infer<typeof messagesSchema>;
