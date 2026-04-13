import { z } from "zod";

const axisKeySchema = z.enum([
  "shipVelocity",
  "ambiguityFit",
  "feedbackEnergy",
  "syncRhythm",
]);
const sbtiCodeSchema = z.string().regex(/^[SD][BA][TR][IS]$/);
const mbtiCodeSchema = z.string().regex(/^[EI][SN][TF][JP]$/);
const imsbCodeSchema = z.string().regex(/^(IM|IS|IB|MI|MS|MB|SI|SM|SB|BI|BM|BS)$/);

export const skillWeightSchema = z.object({
  name: z.string(),
  score: z.number(),
  reasons: z.array(z.string()),
});

export const evidenceFragmentSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  title: z.string(),
  quote: z.string(),
  skill: z.string().optional(),
  weight: z.number(),
});

export const quizResultSchema = z.object({
  code: z.string(),
  label: z.string(),
  summary: z.string(),
});

export const personalityAnswerSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  answer: z.enum(["A", "B"]),
  rationale: z.string(),
});

export const mbtiResultSchema = quizResultSchema.extend({
  code: mbtiCodeSchema,
});

export const imsbResultSchema = quizResultSchema.extend({
  code: imsbCodeSchema,
  scores: z.object({
    I: z.number(),
    M: z.number(),
    S: z.number(),
    B: z.number(),
  }),
});

export const sbtiArchetypeSchema = z.object({
  code: sbtiCodeSchema,
  title: z.string(),
  summary: z.string(),
  meme: z.string(),
});

export const distilledSkillProfileSchema = z.object({
  overview: z.string(),
  coreStrengths: z.array(z.string()),
  workingSignals: z.array(z.string()),
  evidenceNotes: z.array(z.string()),
});

export const distilledMemoryProfileSchema = z.object({
  overview: z.string(),
  timeline: z.array(z.string()),
  routines: z.array(z.string()),
  sharedContexts: z.array(z.string()),
});

export const distilledPersonaProfileSchema = z.object({
  overview: z.string(),
  speakingStyle: z.array(z.string()),
  emotionalPattern: z.array(z.string()),
  collaborationPattern: z.array(z.string()),
  boundaries: z.array(z.string()),
});

export const parsedSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(["chat", "markdown", "text", "pdf", "image", "github"]),
  title: z.string(),
  excerpt: z.string(),
  skills: z.array(skillWeightSchema),
  evidence: z.array(evidenceFragmentSchema),
  stats: z.record(z.string(), z.union([z.string(), z.number()])),
  collaborationHints: z.object({
    shipVelocity: z.number(),
    ambiguityFit: z.number(),
    feedbackEnergy: z.number(),
    syncRhythm: z.number(),
  }),
});

export const signalBundleSchema = z.object({
  version: z.string(),
  profile: z.object({
    alias: z.string(),
    role: z.string(),
    bio: z.string(),
    goals: z.array(z.string()),
    languages: z.array(z.string()),
    timezone: z.string(),
  }),
  sources: z.array(parsedSourceSchema),
  candidateSkills: z.array(skillWeightSchema),
  evidencePool: z.array(evidenceFragmentSchema),
  collaborationHints: z.object({
    shipVelocity: z.number(),
    ambiguityFit: z.number(),
    feedbackEnergy: z.number(),
    syncRhythm: z.number(),
  }),
  zeroRawRetention: z.literal(true),
  zeroRawLogging: z.literal(true),
  createdAt: z.string(),
});

export const distillRequestSchema = z.object({
  bundle: signalBundleSchema,
  previousTwin: z.lazy(() => twinCardSchema).optional(),
});

export const twinCardSchema = z.object({
  id: z.string(),
  slug: z.string(),
  shareCode: z.string().regex(/^CD-[A-Z0-9]{4}-[A-Z0-9]{6}$/),
  alias: z.string(),
  role: z.string(),
  headline: z.string(),
  summary: z.string(),
  goals: z.array(z.string()),
  languages: z.array(z.string()),
  timezone: z.string(),
  skills: z.array(
    z.object({
      name: z.string(),
      confidence: z.number(),
      rationale: z.string(),
    }),
  ),
  evidence: z.array(evidenceFragmentSchema),
  collaborationAxes: z.array(
    z.object({
      key: axisKeySchema,
      label: z.string(),
      score: z.number(),
      explanation: z.string(),
    }),
  ),
  sbti: sbtiArchetypeSchema,
  mbti: mbtiResultSchema,
  imsb: imsbResultSchema,
  sharePolicy: z.object({
    scope: z.enum(["public", "matches", "private"]),
    capsule: z.string(),
  }),
  skillProfile: distilledSkillProfileSchema.optional(),
  memoryProfile: distilledMemoryProfileSchema.optional(),
  personaProfile: distilledPersonaProfileSchema.optional(),
  personalityAnswers: z.object({
    mbti: z.array(personalityAnswerSchema),
    sbti: z.array(personalityAnswerSchema),
  }).optional(),
  autoMatchEnabled: z.boolean(),
  autoChatEnabled: z.boolean(),
  publishedAt: z.string().optional(),
  generatedAt: z.string(),
  privacyStatement: z.string(),
});

export const sharePreviewSchema = z.object({
  alias: z.string(),
  headline: z.string(),
  capsule: z.string(),
  sbtiCode: z.string(),
});

export const publicShareEnvelopeSchema = z.object({
  version: z.literal(1),
  mode: z.literal("public"),
  twin: twinCardSchema,
});

export const protectedShareEnvelopeSchema = z.object({
  version: z.literal(1),
  mode: z.literal("protected"),
  preview: sharePreviewSchema,
  salt: z.string(),
  iv: z.string(),
  cipherText: z.string(),
});

export const shareEnvelopeSchema = z.union([
  publicShareEnvelopeSchema,
  protectedShareEnvelopeSchema,
]);

export const breakIceSchema = z.object({
  left: twinCardSchema,
  right: twinCardSchema,
});
