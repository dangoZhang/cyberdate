export type SourceKind =
  | "chat"
  | "markdown"
  | "text"
  | "pdf"
  | "image"
  | "github";

export type ShareScope = "public" | "matches" | "private";

export type StyleAxisKey =
  | "shipVelocity"
  | "ambiguityFit"
  | "feedbackEnergy"
  | "syncRhythm";

export interface SkillWeight {
  name: string;
  score: number;
  reasons: string[];
}

export interface EvidenceFragment {
  id: string;
  sourceId: string;
  title: string;
  quote: string;
  skill?: string;
  weight: number;
}

export interface ParsedSource {
  id: string;
  kind: SourceKind;
  title: string;
  excerpt: string;
  skills: SkillWeight[];
  evidence: EvidenceFragment[];
  stats: Record<string, number | string>;
  collaborationHints: Partial<Record<StyleAxisKey, number>>;
}

export interface SignalBundleProfile {
  alias: string;
  role: string;
  bio: string;
  goals: string[];
  languages: string[];
  timezone: string;
}

export interface SignalBundle {
  version: string;
  profile: SignalBundleProfile;
  sources: ParsedSource[];
  candidateSkills: SkillWeight[];
  evidencePool: EvidenceFragment[];
  collaborationHints: Record<StyleAxisKey, number>;
  zeroRawRetention: true;
  zeroRawLogging: true;
  createdAt: string;
}

export interface DistillRequest {
  bundle: SignalBundle;
  previousTwin?: TwinCard;
}

export interface SkillPack {
  id: string;
  slug: string;
  alias: string;
  role: string;
  profile: SignalBundleProfile;
  candidateSkills: SkillWeight[];
  evidencePool: EvidenceFragment[];
  collaborationHints: Record<StyleAxisKey, number>;
  sourceCount: number;
  provider: "deterministic" | "openai" | "deepseek";
  model?: string;
  createdAt: string;
}

export interface SkillTag {
  name: string;
  confidence: number;
  rationale: string;
}

export interface CollaborationAxis {
  key: StyleAxisKey;
  label: string;
  score: number;
  explanation: string;
}

export interface QuizResult {
  code: string;
  label: string;
  summary: string;
}

export interface PersonalityAnswer {
  id: string;
  prompt: string;
  answer: "A" | "B";
  rationale: string;
}

export interface ImsbResult extends QuizResult {
  scores: Record<"I" | "M" | "S" | "B", number>;
}

export interface SbtiArchetype {
  code: string;
  title: string;
  summary: string;
  meme: string;
}

export interface SharePolicy {
  scope: ShareScope;
  capsule: string;
}

export interface DistilledSkillProfile {
  overview: string;
  coreStrengths: string[];
  workingSignals: string[];
  evidenceNotes: string[];
}

export interface DistilledMemoryProfile {
  overview: string;
  timeline: string[];
  routines: string[];
  sharedContexts: string[];
}

export interface DistilledPersonaProfile {
  overview: string;
  speakingStyle: string[];
  emotionalPattern: string[];
  collaborationPattern: string[];
  boundaries: string[];
}

export interface TwinCard {
  id: string;
  slug: string;
  shareCode: string;
  alias: string;
  role: string;
  headline: string;
  summary: string;
  goals: string[];
  languages: string[];
  timezone: string;
  skills: SkillTag[];
  evidence: EvidenceFragment[];
  collaborationAxes: CollaborationAxis[];
  sbti: SbtiArchetype;
  mbti: QuizResult;
  imsb: ImsbResult;
  sharePolicy: SharePolicy;
  skillProfile?: DistilledSkillProfile;
  memoryProfile?: DistilledMemoryProfile;
  personaProfile?: DistilledPersonaProfile;
  personalityAnswers?: {
    mbti: PersonalityAnswer[];
    sbti: PersonalityAnswer[];
  };
  autoMatchEnabled: boolean;
  autoChatEnabled: boolean;
  publishedAt?: string;
  generatedAt: string;
  privacyStatement: string;
}

export interface ExchangeMessage {
  id: string;
  author: "you" | "them";
  mode: "auto" | "manual";
  content: string;
  createdAt: string;
}

export interface ExchangeMatchPreview {
  shareCode: string;
  alias: string;
  role: string;
  headline: string;
  summary: string;
  skills: SkillTag[];
  sbtiCode: string;
}

export interface ExchangeQuota {
  usedToday: number;
  remainingToday: number;
  dailyLimit: number;
}

export interface SharePreview {
  alias: string;
  headline: string;
  capsule: string;
  sbtiCode: string;
}

export interface PublicShareEnvelope {
  version: 1;
  mode: "public";
  twin: TwinCard;
}

export interface ProtectedShareEnvelope {
  version: 1;
  mode: "protected";
  preview: SharePreview;
  salt: string;
  iv: string;
  cipherText: string;
}

export type ShareEnvelope = PublicShareEnvelope | ProtectedShareEnvelope;

export interface RuntimeDistillResult {
  twin: TwinCard;
  skillPack: SkillPack;
  provider: "deterministic" | "openai" | "deepseek";
  model?: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
  requestedProvider?: "openai" | "deepseek";
  requestedModel?: string;
  embeddingInput: string;
  embedding?: number[] | null;
}
