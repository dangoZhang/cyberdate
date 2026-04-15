import { z } from "zod";

const axisKeySchema = z.enum([
  "shipVelocity",
  "ambiguityFit",
  "feedbackEnergy",
  "syncRhythm",
]);
const attachmentStyleSchema = z.enum(["安全型", "焦虑型", "回避型", "混乱型"]);
const loveLanguageSchema = z.enum([
  "肯定的言辞",
  "精心的时刻",
  "接受礼物",
  "服务的行动",
  "身体的接触",
]);
const sbtiCodeSchema = z.string().min(3).max(12);
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
  answer: z.enum(["A", "B", "C"]),
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

export const mbti64ResultSchema = z.object({
  baseCode: mbtiCodeSchema,
  code: z.string(),
  variantKey: z.enum(["driven", "steady", "expressive", "reflective"]),
  label: z.string(),
  summary: z.string(),
});

export const exSkillLabelProfileSchema = z.object({
  attachmentStyle: attachmentStyleSchema,
  loveLanguages: z.array(loveLanguageSchema),
  traitTags: z.array(z.string()),
  zodiac: z.string().nullable(),
  mbti64: mbti64ResultSchema,
});

export const exSkillCoreProfileSchema = z.object({
  relationshipMemory: z.string(),
  persona: z.string(),
  skillPrompt: z.string(),
  labels: exSkillLabelProfileSchema,
});

export const sbtiArchetypeSchema = z.object({
  code: sbtiCodeSchema,
  title: z.string(),
  summary: z.string(),
  meme: z.string(),
  imagePath: z.string().optional(),
  badge: z.string().optional(),
  similarity: z.number().optional(),
  pattern: z.string().optional(),
  levels: z.record(z.string(), z.enum(["L", "M", "H"])).optional(),
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
  exSkill: exSkillCoreProfileSchema.optional(),
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

export const matchProfileSchema = z.object({
  enabled: z.boolean(),
  age: z.number().int().min(18).max(99).nullable(),
  gender: z.string(),
  city: z.string(),
  education: z.string(),
  bio: z.string(),
  lookingFor: z.string(),
  normalizedTags: z.array(z.string()),
  updatedAt: z.string(),
});

export const matchScoreBreakdownSchema = z.object({
  skill: z.number(),
  goal: z.number(),
  style: z.number(),
  personality: z.number(),
  context: z.number(),
  tags: z.number(),
  fairness: z.number(),
  repeatPenalty: z.number(),
});

export const exchangeMessageSchema = z.object({
  id: z.string(),
  author: z.enum(["you", "them"]),
  mode: z.enum(["auto", "manual"]),
  content: z.string(),
  createdAt: z.string(),
});

export const matchSuggestionSchema = z.object({
  id: z.string(),
  dayKey: z.string(),
  targetAccountId: z.string(),
  alias: z.string(),
  role: z.string(),
  headline: z.string(),
  summary: z.string(),
  age: z.number().int().min(18).max(99).nullable(),
  gender: z.string(),
  city: z.string(),
  education: z.string(),
  mbtiCode: mbtiCodeSchema,
  sbtiCode: sbtiCodeSchema,
  skills: z.array(
    z.object({
      name: z.string(),
      confidence: z.number(),
      rationale: z.string(),
    }),
  ),
  reasons: z.array(z.string()),
  score: z.number(),
  scoreBreakdown: matchScoreBreakdownSchema,
  autoExchange: z.object({
    messages: z.array(exchangeMessageSchema),
    summary: z.string(),
    nextLine: z.string(),
    consumedSentences: z.number(),
  }),
  createdAt: z.string(),
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
