import {
  AXIS_LABELS,
  GOAL_CAPSULES,
  IMSB_LABELS,
  MBTI_QUESTIONS,
  SKILL_CATEGORIES,
} from "@/lib/constants";
import {
  buildMbtiResult,
  buildSbtiResult,
  scoreMbtiAnswers,
  scoreSbtiAnswers,
  SBTI_QUESTION_BANK,
} from "@/lib/personality-quiz";
import type {
  CollaborationAxis,
  DistilledMemoryProfile,
  DistilledPersonaProfile,
  DistilledSkillProfile,
  EvidenceFragment,
  ImsbResult,
  PersonalityAnswer,
  SignalBundle,
  SkillTag,
  TwinCard,
} from "@/lib/types";
import { clamp, dedupe, round, slugify } from "@/lib/utils";

function axisExplanation(
  key: keyof typeof AXIS_LABELS,
  score: number,
  skills: SkillTag[],
) {
  const leadSkill = skills[0]?.name ?? "综合能力";

  const explanations: Record<string, [string, string, string]> = {
    shipVelocity: [
      `会先把 ${leadSkill} 压成能验证的版本，再继续放量。`,
      `推进前会收一遍范围，但不会拖慢节奏。`,
      `更偏推演型，会先把边界和方案想稳。`,
    ],
    ambiguityFit: [
      "面对不完整信息也敢先推进。",
      "能接受一定模糊，但需要基本边界。",
      "更依赖约束和事实再进入执行。",
    ],
    feedbackEnergy: [
      "反馈更直接，重点通常先落在问题本身。",
      "会在结论和关系感之间做平衡。",
      "更克制，倾向先消化再表达。",
    ],
    syncRhythm: [
      "更适合异步推进，关键节点再对齐。",
      "异步与同步都能接受，会按场景切换。",
      "更适合边聊边改的共创节奏。",
    ],
  };

  if (score >= 72) return explanations[key][0];
  if (score >= 48) return explanations[key][1];
  return explanations[key][2];
}

function selectTopSkills(bundle: SignalBundle, previousTwin?: TwinCard) {
  const map = new Map<string, { score: number; reasons: string[] }>();

  bundle.candidateSkills.forEach((skill) => {
    const current = map.get(skill.name) ?? { score: 0, reasons: [] };
    current.score += skill.score;
    current.reasons.push(...skill.reasons);
    map.set(skill.name, current);
  });

  previousTwin?.skills.forEach((skill) => {
    const current = map.get(skill.name) ?? { score: 0, reasons: [] };
    current.score += clamp(skill.confidence * 2, 40, 180);
    current.reasons.push(`沿用现有结论：${skill.rationale}`);
    map.set(skill.name, current);
  });

  return [...map.entries()]
    .sort((left, right) => right[1].score - left[1].score)
    .slice(0, 10)
    .map(
      ([name, value]): SkillTag => ({
        name,
        confidence: clamp(round(value.score / 3.5), 52, 98),
        rationale: dedupe(value.reasons).slice(0, 2).join(" · "),
      }),
    );
}

function selectEvidence(bundle: SignalBundle, skills: SkillTag[], previousTwin?: TwinCard) {
  const prioritySkills = new Set(skills.map((skill) => skill.name));
  const pool = [...bundle.evidencePool, ...(previousTwin?.evidence ?? [])];

  return pool
    .sort((left, right) => right.weight - left.weight)
    .filter((item) => !item.skill || prioritySkills.has(item.skill))
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.quote === item.quote) === index,
    )
    .slice(0, 4)
    .map((item): EvidenceFragment => ({
      ...item,
      quote: item.quote.slice(0, 180),
    }));
}

function collaborationAxes(
  bundle: SignalBundle,
  skills: SkillTag[],
  previousTwin?: TwinCard,
) {
  return (Object.keys(AXIS_LABELS) as Array<keyof typeof AXIS_LABELS>).map(
    (key): CollaborationAxis => {
      const base = bundle.collaborationHints[key];
      const previousScore =
        previousTwin?.collaborationAxes.find((axis) => axis.key === key)?.score ?? base;
      const score = clamp(round((base * 2 + previousScore) / 3), 16, 94);
      return {
        key,
        label: AXIS_LABELS[key],
        score,
        explanation: axisExplanation(key, score, skills),
      };
    },
  );
}

function capsuleForGoals(goals: string[]) {
  const haystack = goals.join(" ").toLowerCase();
  for (const capsule of GOAL_CAPSULES) {
    if (capsule.matchers.some((matcher) => haystack.includes(matcher))) {
      return capsule.capsule;
    }
  }
  return "在找能一起把想法做成成品的合作对象";
}

function inferImsb(skills: SkillTag[], goals: string[]): ImsbResult {
  const base = { I: 42, M: 42, S: 42, B: 42 };

  skills.forEach((skill) => {
    const category = SKILL_CATEGORIES[skill.name];
    if (category === "ai" || category === "growth") base.I += 8;
    if (category === "engineering") base.M += 10;
    if (category === "ops" || category === "design") base.S += 8;
    if (category === "product" || category === "brand") base.B += 7;
  });

  goals.join(" ")
    .toLowerCase()
    .split(/\s+/)
    .forEach((goal) => {
      if (goal.includes("design") || goal.includes("share")) base.B += 6;
      if (goal.includes("automation") || goal.includes("ship")) base.M += 6;
      if (goal.includes("system") || goal.includes("platform")) base.S += 6;
      if (goal.includes("signal") || goal.includes("idea")) base.I += 6;
    });

  const scores = {
    I: clamp(base.I, 0, 100),
    M: clamp(base.M, 0, 100),
    S: clamp(base.S, 0, 100),
    B: clamp(base.B, 0, 100),
  };

  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1]);
  const code = ranked
    .slice(0, 2)
    .map(([key]) => key)
    .join("") as ImsbResult["code"];
  const label = ranked
    .slice(0, 2)
    .map(([key]) => IMSB_LABELS[key as keyof typeof IMSB_LABELS].label.replace(/\s.+$/, ""))
    .join(" ");
  const summary = ranked
    .slice(0, 2)
    .map(([key]) => IMSB_LABELS[key as keyof typeof IMSB_LABELS].summary)
    .join(" ");

  return {
    code,
    label,
    summary,
    scores,
  };
}

function skillOverview(alias: string, role: string, skills: SkillTag[]) {
  const names = skills.slice(0, 3).map((skill) => skill.name).join("、");
  return `${alias} 当前蒸馏出的主要能力集中在 ${names || "跨域协作"}，角色画像偏 ${role || "builder"}。`;
}

function buildSkillProfile(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  previousTwin?: TwinCard,
): DistilledSkillProfile {
  const coreStrengths = skills
    .slice(0, 4)
    .map((skill) => `${skill.name}：${skill.rationale}`);
  const workingSignals = dedupe([
    ...bundle.sources.map((source) => `${source.title} · ${source.kind}`),
    ...(previousTwin?.skillProfile?.workingSignals ?? []),
  ]).slice(0, 4);
  const evidenceNotes = evidence
    .map((item) => `${item.title}：${item.quote}`)
    .slice(0, 4);

  return {
    overview: skillOverview(bundle.profile.alias, bundle.profile.role, skills),
    coreStrengths,
    workingSignals,
    evidenceNotes,
  };
}

function buildMemoryProfile(
  bundle: SignalBundle,
  evidence: EvidenceFragment[],
  previousTwin?: TwinCard,
): DistilledMemoryProfile {
  const sourceTitles = bundle.sources.map((source) => source.title);
  const timeline = dedupe([
    ...sourceTitles.slice(0, 4).map((title, index) => `阶段 ${index + 1}：来自 ${title} 的线索`),
    ...(previousTwin?.memoryProfile?.timeline ?? []),
  ]).slice(0, 6);

  const routines = dedupe([
    ...bundle.sources.slice(0, 4).map((source) => `材料里出现过 ${source.kind} 类型记录：${source.title}`),
    ...(previousTwin?.memoryProfile?.routines ?? []),
  ]).slice(0, 4);

  const sharedContexts = dedupe([
    ...evidence.slice(0, 4).map((item) => item.title),
    bundle.profile.timezone,
    ...bundle.profile.languages,
    ...(previousTwin?.memoryProfile?.sharedContexts ?? []),
  ]).slice(0, 6);

  return {
    overview: `这份 twin 参考了 ${bundle.sources.length} 份前端解析材料，只保留蒸馏后的结构化线索。`,
    timeline,
    routines,
    sharedContexts,
  };
}

function speakingStyleFromBundle(bundle: SignalBundle) {
  const hasChat = bundle.sources.some((source) => source.kind === "chat");
  const hasRepo = bundle.sources.some((source) => source.kind === "github");

  return dedupe([
    hasChat ? "说话习惯优先参考聊天记录的节奏和句式。" : "缺少聊天记录时，以上传文字材料里的表达方式为准。",
    hasRepo ? "GitHub README 和目录结构会补充工作语境。" : "表达风格主要从文本和图片 OCR 信号中归纳。",
  ]);
}

function buildPersonaProfile(
  bundle: SignalBundle,
  axes: CollaborationAxis[],
  previousTwin?: TwinCard,
): DistilledPersonaProfile {
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;
  const ambiguity = axes.find((axis) => axis.key === "ambiguityFit")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;

  const emotionalPattern = [
    feedback >= 60 ? "表达会先落结论，反馈直达问题本身。" : "表达更克制，倾向先观察再回应。",
    sync >= 56 ? "高频同步更舒服，适合边聊边推进。" : "更适合低打扰、强异步的协作方式。",
  ];

  const collaborationPattern = [
    ship >= 58 ? "推进时会先做出一个可验证的版本。" : "推进前会先补边界、判断风险。",
    ambiguity >= 55 ? "信息不完整时也能先启动。" : "更依赖清晰约束和证据后再行动。",
  ];

  return {
    overview:
      previousTwin?.personaProfile?.overview ??
      `${bundle.profile.alias} 的对外形象更像一个有边界感的职业分身，重点反映协作方式和表达习惯。`,
    speakingStyle: dedupe([
      ...speakingStyleFromBundle(bundle),
      ...(previousTwin?.personaProfile?.speakingStyle ?? []),
    ]).slice(0, 4),
    emotionalPattern: dedupe([
      ...emotionalPattern,
      ...(previousTwin?.personaProfile?.emotionalPattern ?? []),
    ]).slice(0, 4),
    collaborationPattern: dedupe([
      ...collaborationPattern,
      ...(previousTwin?.personaProfile?.collaborationPattern ?? []),
    ]).slice(0, 4),
    boundaries: dedupe([
      "只保留蒸馏后的 skill 结构，不保留原始上传材料。",
      "人格结果只反映上传材料中的稳定线索，不代表官方测评。",
      ...(previousTwin?.personaProfile?.boundaries ?? []),
    ]).slice(0, 4),
  };
}

function mbtiFallback(axes: CollaborationAxis[]) {
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;
  const ambiguity = axes.find((axis) => axis.key === "ambiguityFit")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;

  return [
    sync >= 55 ? "E" : "I",
    ambiguity >= 56 ? "N" : "S",
    feedback >= 55 ? "T" : "F",
    ship >= 58 ? "J" : "P",
  ] as const;
}

function sbtiFallback(axes: CollaborationAxis[]) {
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;
  const ambiguity = axes.find((axis) => axis.key === "ambiguityFit")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;

  return [
    ship >= 58 ? "S" : "D",
    ambiguity >= 55 ? "B" : "A",
    feedback >= 55 ? "T" : "R",
    sync <= 52 ? "I" : "S",
  ] as const;
}

function rationaleFromProfiles(
  skillProfile: DistilledSkillProfile,
  personaProfile: DistilledPersonaProfile,
  index: number,
) {
  return (
    skillProfile.coreStrengths[index % skillProfile.coreStrengths.length] ??
    personaProfile.collaborationPattern[index % personaProfile.collaborationPattern.length] ??
    personaProfile.speakingStyle[index % personaProfile.speakingStyle.length] ??
    "材料里存在对应的稳定线索。"
  );
}

function buildDeterministicAnswers(
  bank: Array<{
    id: string;
    prompt: string;
    dimension: readonly [string, string];
  }>,
  code: string,
  skillProfile: DistilledSkillProfile,
  personaProfile: DistilledPersonaProfile,
) {
  return bank.map((item, index): PersonalityAnswer => {
    const preferred = code.includes(item.dimension[0]) ? "A" : "B";
    return {
      id: item.id,
      prompt: item.prompt,
      answer: preferred,
      rationale: rationaleFromProfiles(skillProfile, personaProfile, index),
    };
  });
}

function headlineFor(alias: string, role: string, skills: SkillTag[], goals: string[]) {
  const topSkill = skills[0]?.name ?? "跨域协作";
  const topGoal = goals[0] ?? "把点子做成真实结果";
  return `${alias} 是偏 ${topSkill.toLowerCase()} 的 ${role || "builder"}，最近更想把 ${topGoal} 做成成品。`;
}

function summaryFor(bundle: SignalBundle, skills: SkillTag[]) {
  const topSkills = skills.slice(0, 3).map((skill) => skill.name.toLowerCase()).join(" / ");
  return `这张 twin card 来自前端解析后的结构化线索。主技能集中在 ${topSkills || "跨域协作"}，结果页只保留人格结果和分享能力。`;
}

export function distillSignalBundle(bundle: SignalBundle): TwinCard {
  return distillSignalBundleWithBaseline(bundle);
}

export function distillSignalBundleWithBaseline(
  bundle: SignalBundle,
  previousTwin?: TwinCard,
): TwinCard {
  const skills = selectTopSkills(bundle, previousTwin);
  const evidence = selectEvidence(bundle, skills, previousTwin);
  const axes = collaborationAxes(bundle, skills, previousTwin);
  const goals = dedupe([
    ...bundle.profile.goals,
    ...(previousTwin?.goals ?? []),
  ]).slice(0, 8);
  const languages = dedupe([
    ...bundle.profile.languages,
    ...(previousTwin?.languages ?? []),
  ]).slice(0, 4);
  const skillProfile = buildSkillProfile(bundle, skills, evidence, previousTwin);
  const memoryProfile = buildMemoryProfile(bundle, evidence, previousTwin);
  const personaProfile = buildPersonaProfile(bundle, axes, previousTwin);
  const mbtiSeed = mbtiFallback(axes);
  const sbtiSeed = sbtiFallback(axes);
  const mbtiAnswers = buildDeterministicAnswers(
    MBTI_QUESTIONS.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      dimension: item.dimension,
    })),
    mbtiSeed.join(""),
    skillProfile,
    personaProfile,
  );
  const sbtiAnswers = buildDeterministicAnswers(
    SBTI_QUESTION_BANK.map((item) => ({
      id: item.id,
      prompt: item.prompt,
      dimension: item.dimension,
    })),
    sbtiSeed.join(""),
    skillProfile,
    personaProfile,
  );
  const mbti = buildMbtiResult(
    scoreMbtiAnswers(mbtiAnswers, mbtiSeed),
    mbtiAnswers,
  );
  const sbti = buildSbtiResult(
    scoreSbtiAnswers(sbtiAnswers, sbtiSeed),
    sbtiAnswers,
  );
  const imsb = inferImsb(skills, goals);

  return {
    id: crypto.randomUUID(),
    slug: slugify(bundle.profile.alias || "cyberdate-twin"),
    shareCode: "CD-PEND-000000",
    alias: bundle.profile.alias,
    role: bundle.profile.role,
    headline: headlineFor(
      bundle.profile.alias,
      bundle.profile.role,
      skills,
      goals,
    ),
    summary: summaryFor(bundle, skills),
    goals,
    languages,
    timezone: bundle.profile.timezone,
    skills,
    evidence,
    collaborationAxes: axes,
    sbti,
    mbti,
    imsb,
    sharePolicy: previousTwin?.sharePolicy ?? {
      scope: "matches",
      capsule: capsuleForGoals(goals),
    },
    skillProfile,
    memoryProfile,
    personaProfile,
    personalityAnswers: {
      mbti: mbtiAnswers,
      sbti: sbtiAnswers,
    },
    autoMatchEnabled: true,
    autoChatEnabled: true,
    generatedAt: new Date().toISOString(),
    privacyStatement:
      "本网站只处理前端生成的最小必要结构化线索，不保存原始文件、不记录原始文本日志。",
  };
}
