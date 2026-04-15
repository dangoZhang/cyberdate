import type {
  AttachmentStyle,
  CollaborationAxis,
  DistilledMemoryProfile,
  DistilledPersonaProfile,
  DistilledSkillProfile,
  EvidenceFragment,
  ExSkillCoreProfile,
  LoveLanguage,
  Mbti64Result,
  SignalBundle,
  SkillTag,
  TwinCard,
} from "@/lib/types";
import { dedupe, slugify } from "@/lib/utils";

const ZODIAC_NAMES = [
  "白羊座",
  "金牛座",
  "双子座",
  "巨蟹座",
  "狮子座",
  "处女座",
  "天秤座",
  "天蝎座",
  "射手座",
  "摩羯座",
  "水瓶座",
  "双鱼座",
] as const;

const TRAIT_RULES = [
  { tag: "话痨", keywords: ["哈哈", "话痨", "连发", "语音", "一口气"] },
  { tag: "闷骚", keywords: ["闷骚", "嘴硬心软", "表面冷", "慢热"] },
  { tag: "嘴硬心软", keywords: ["嘴硬心软", "嘴硬", "偷偷", "明明在意"] },
  { tag: "冷暴力", keywords: ["冷暴力", "冷战", "已读不回", "沉默"] },
  { tag: "粘人", keywords: ["粘人", "一直聊", "陪我", "秒回"] },
  { tag: "独立", keywords: ["独立", "异步", "自己来", "自己消化"] },
  { tag: "浪漫主义", keywords: ["浪漫", "仪式感", "惊喜", "心动"] },
  { tag: "实用主义", keywords: ["实用", "效率", "落地", "务实"] },
  { tag: "完美主义", keywords: ["完美主义", "细节", "标准", "挑剔"] },
  { tag: "拖延症", keywords: ["拖延", "拖到最后", "最后一刻"] },
  { tag: "工作狂", keywords: ["工作狂", "上线", "交付", "部署", "deadline"] },
  { tag: "控制欲", keywords: ["控制欲", "必须", "按我的", "不许"] },
  { tag: "没有安全感", keywords: ["没有安全感", "焦虑", "确认", "多想"] },
  { tag: "报复性熬夜", keywords: ["熬夜", "半夜", "深夜"] },
  { tag: "已读不回", keywords: ["已读不回"] },
  { tag: "秒回选手", keywords: ["秒回"] },
  { tag: "朋友圈三天可见", keywords: ["三天可见"] },
  { tag: "大男/女子主义", keywords: ["大男子主义", "大女子主义"] },
  { tag: "半夜发语音", keywords: ["半夜发语音", "深夜语音", "语音"] },
] as const;

function collectCorpus(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  relationshipMemory: string,
  persona: string,
  previousTwin?: TwinCard,
) {
  return [
    bundle.profile.alias,
    bundle.profile.role,
    bundle.profile.bio,
    ...bundle.profile.goals,
    ...bundle.profile.languages,
    ...bundle.sources.map((source) => `${source.title}\n${source.excerpt}`),
    ...skills.map((skill) => `${skill.name} ${skill.rationale}`),
    ...evidence.map((item) => `${item.title} ${item.quote}`),
    relationshipMemory,
    persona,
    previousTwin?.exSkill?.relationshipMemory ?? "",
    previousTwin?.exSkill?.persona ?? "",
  ]
    .join("\n")
    .toLowerCase();
}

function chatSignals(bundle: SignalBundle) {
  const chatSources = bundle.sources.filter((source) => source.kind === "chat");
  const selfMessages = chatSources.reduce(
    (total, source) => total + Number(source.stats.selfMessages ?? source.stats.messageCount ?? 0),
    0,
  );
  const matchedLines = chatSources.reduce(
    (total, source) => total + Number(source.stats.matchedLines ?? source.stats.messageCount ?? 0),
    0,
  );
  const activeWindows = chatSources
    .map((source) => String(source.stats.activeWindow ?? ""))
    .filter(Boolean);

  return {
    count: chatSources.length,
    selfMessages,
    matchedLines,
    activeWindows,
  };
}

function detectZodiac(corpus: string) {
  return ZODIAC_NAMES.find((item) => corpus.includes(item.toLowerCase())) ?? null;
}

function inferTraitTags(
  corpus: string,
  axes: CollaborationAxis[],
  bundle: SignalBundle,
) {
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;
  const chats = chatSignals(bundle);
  const scores = new Map<string, number>();

  for (const rule of TRAIT_RULES) {
    const keywordHits = rule.keywords.filter((keyword) => corpus.includes(keyword)).length;
    let nextScore = keywordHits * 18;

    if (rule.tag === "独立" && sync <= 48) nextScore += 18;
    if (rule.tag === "粘人" && sync >= 62) nextScore += 16;
    if (rule.tag === "工作狂" && ship >= 60) nextScore += 16;
    if (rule.tag === "实用主义" && ship >= 56) nextScore += 10;
    if (rule.tag === "浪漫主义" && feedback <= 50) nextScore += 4;
    if (rule.tag === "话痨" && chats.selfMessages >= 8) nextScore += 16;
    if (rule.tag === "报复性熬夜" && chats.activeWindows.some((item) => /2[2-3]:00/.test(item))) {
      nextScore += 22;
    }
    if (rule.tag === "嘴硬心软" && feedback >= 56 && sync <= 54) nextScore += 10;
    if (rule.tag === "闷骚" && feedback <= 45 && sync <= 52) nextScore += 12;

    if (nextScore > 0) {
      scores.set(rule.tag, nextScore);
    }
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([tag]) => tag);
}

function inferAttachmentStyle(
  corpus: string,
  traitTags: string[],
  axes: CollaborationAxis[],
) {
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;
  const anxiousScore =
    ["没有安全感", "粘人", "秒回选手"].filter((tag) => traitTags.includes(tag)).length * 2
    + ["焦虑", "确认", "多想", "试探"].filter((keyword) => corpus.includes(keyword)).length
    + (sync >= 62 ? 1 : 0);
  const avoidantScore =
    ["独立", "冷暴力", "已读不回"].filter((tag) => traitTags.includes(tag)).length * 2
    + ["边界", "自己消化", "低打扰", "异步"].filter((keyword) => corpus.includes(keyword)).length
    + (sync <= 46 ? 1 : 0);

  if (anxiousScore >= 3 && avoidantScore >= 3) return "混乱型";
  if (anxiousScore >= avoidantScore + 2) return "焦虑型";
  if (avoidantScore >= anxiousScore + 2) return "回避型";
  return "安全型";
}

function inferLoveLanguages(corpus: string, evidence: EvidenceFragment[]) {
  const evidenceText = evidence.map((item) => item.quote).join("\n").toLowerCase();
  const combined = `${corpus}\n${evidenceText}`;
  const scores = new Map<LoveLanguage, number>();

  const boost = (label: LoveLanguage, keywords: string[]) => {
    const score = keywords.filter((keyword) => combined.includes(keyword)).length * 18;
    if (score > 0) scores.set(label, (scores.get(label) ?? 0) + score);
  };

  boost("肯定的言辞", ["夸", "鼓励", "说得好", "认可", "欣赏"]);
  boost("精心的时刻", ["一起", "陪", "约会", "散步", "看电影"]);
  boost("接受礼物", ["礼物", "惊喜", "买给", "送你"]);
  boost("服务的行动", ["帮你", "做饭", "接送", "收口", "处理好", "安排"]);
  boost("身体的接触", ["抱", "牵手", "亲", "摸摸"]);

  if (!scores.size) {
    scores.set("服务的行动", 20);
    scores.set("精心的时刻", 16);
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([label]) => label);
}

function buildMbti64(baseCode: string, axes: CollaborationAxis[]): Mbti64Result {
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;

  let variantKey: Mbti64Result["variantKey"] = "reflective";
  let variantLabel = "反刍型";
  let summary = "更慢热，更先内化，再给出完整判断。";

  if (ship >= 58 && feedback >= 56) {
    variantKey = "driven";
    variantLabel = "锋面型";
    summary = "推进直接，决策清楚，适合主动打开局面。";
  } else if (ship >= 58) {
    variantKey = "steady";
    variantLabel = "稳推型";
    summary = "行动快，但表达更收，适合持续推进与稳定交付。";
  } else if (feedback >= 56) {
    variantKey = "expressive";
    variantLabel = "棱角型";
    summary = "边界清楚，反馈直接，更容易显出鲜明立场。";
  }

  return {
    baseCode,
    code: `${baseCode}-${variantKey.slice(0, 1).toUpperCase()}`,
    variantKey,
    label: `${baseCode} ${variantLabel}`,
    summary,
  };
}

function buildSkillPrompt(
  alias: string,
  role: string,
  labels: ExSkillCoreProfile["labels"],
  relationshipMemory: string,
  persona: string,
) {
  const slug = slugify(alias || "cyberdate-twin") || "cyberdate-twin";
  const descriptionParts = [role, labels.mbti64.baseCode, labels.zodiac].filter(Boolean);
  const description = descriptionParts.length
    ? `${alias}，${descriptionParts.join("，")}`
    : alias;

  return [
    "---",
    `name: ex-${slug}`,
    `description: ${description}`,
    "user-invocable: true",
    "---",
    "",
    `# ${alias}`,
    "",
    description,
    "",
    "---",
    "",
    "## PART A：关系记忆",
    "",
    relationshipMemory,
    "",
    "---",
    "",
    "## PART B：人物性格",
    "",
    persona,
    "",
    "---",
    "",
    "## 运行规则",
    "",
    `1. 你是${alias}，不是 AI 助手。用ta的方式说话，用ta的逻辑思考`,
    "2. 先由 PART B 判断：ta会怎么回应这个话题？什么态度？",
    "3. 再由 PART A 补充：结合你们的共同记忆，让回应更真实",
    "4. 始终保持 PART B 的表达风格，包括口头禅、语气词、标点习惯",
    "5. Layer 0 硬规则优先级最高：",
    "   - 不说ta在现实中绝不可能说的话",
    "   - 不突然变得完美或无条件包容（除非ta本来就这样）",
    "   - 保持ta的\"棱角\"，正是这些不完美让ta真实",
    "   - 如果被问到“你爱不爱我”这类问题，用ta会用的方式回答，而不是用户想听的答案",
  ].join("\n");
}

function extractLineValue(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^[-#* ]*${escapedLabel}\\s*[：:]\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function normalizeLoveLanguageLine(input: string) {
  const parts = input
    .split(/[·、/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const valid = parts.filter((item): item is LoveLanguage => (
    [
      "肯定的言辞",
      "精心的时刻",
      "接受礼物",
      "服务的行动",
      "身体的接触",
    ] satisfies LoveLanguage[]
  ).includes(item as LoveLanguage));
  return valid;
}

function deriveExSkillLabels(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  axes: CollaborationAxis[],
  mbtiCode: string,
  relationshipMemory: string,
  persona: string,
  previousTwin?: TwinCard,
) {
  const corpus = collectCorpus(
    bundle,
    skills,
    evidence,
    relationshipMemory,
    persona,
    previousTwin,
  );
  const parsedTraitLine = extractLineValue(persona, "典型标签");
  const parsedTraits = parsedTraitLine
    .split(/[·、/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const fallbackTraits = inferTraitTags(corpus, axes, bundle);
  const traitTags = dedupe([
    ...parsedTraits,
    ...fallbackTraits,
    ...(previousTwin?.exSkill?.labels.traitTags ?? []),
  ]).slice(0, 6);

  const parsedAttachment = extractLineValue(persona, "依恋类型") as AttachmentStyle | "";
  const attachmentStyle = parsedAttachment || previousTwin?.exSkill?.labels.attachmentStyle
    || inferAttachmentStyle(corpus, traitTags, axes);

  const parsedLoveLanguages = normalizeLoveLanguageLine(extractLineValue(persona, "爱的语言"));
  const loveLanguages = dedupe([
    ...parsedLoveLanguages,
    ...inferLoveLanguages(corpus, evidence),
    ...(previousTwin?.exSkill?.labels.loveLanguages ?? []),
  ]).slice(0, 3) as LoveLanguage[];

  const zodiacLine = extractLineValue(persona, "星座");
  const zodiac = zodiacLine && !zodiacLine.startsWith("[")
    ? zodiacLine
    : previousTwin?.exSkill?.labels.zodiac ?? detectZodiac(corpus);

  return {
    attachmentStyle,
    loveLanguages,
    traitTags,
    zodiac,
    mbti64: buildMbti64(mbtiCode, axes),
  };
}

export function composeExSkillCoreProfile(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  axes: CollaborationAxis[],
  mbtiCode: string,
  relationshipMemory: string,
  persona: string,
  previousTwin?: TwinCard,
): ExSkillCoreProfile {
  const labels = deriveExSkillLabels(
    bundle,
    skills,
    evidence,
    axes,
    mbtiCode,
    relationshipMemory,
    persona,
    previousTwin,
  );

  return {
    relationshipMemory,
    persona,
    labels,
    skillPrompt: buildSkillPrompt(
      bundle.profile.alias,
      bundle.profile.role,
      labels,
      relationshipMemory,
      persona,
    ),
  };
}

function sectionContent(markdown: string, heading: string) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`${escapedHeading}\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`),
  );
  return match?.[1]?.trim() ?? "";
}

function takeMeaningfulLines(input: string, limit: number) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => (
      Boolean(line)
      && !line.startsWith("|------")
      && !/^<!--/.test(line)
    ))
    .slice(0, limit);
}

export function projectExSkillProfiles(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  exSkill: ExSkillCoreProfile,
  previousTwin?: TwinCard,
) {
  const memoryTimeline = takeMeaningfulLines(
    sectionContent(exSkill.relationshipMemory, "## 时间线"),
    6,
  );
  const memoryRoutineLines = takeMeaningfulLines(
    sectionContent(exSkill.relationshipMemory, "## 日常模式"),
    4,
  );
  const layer0Lines = takeMeaningfulLines(
    sectionContent(exSkill.persona, "## Layer 0：硬规则"),
    4,
  );
  const layer2Lines = takeMeaningfulLines(
    sectionContent(exSkill.persona, "## Layer 2：说话风格"),
    6,
  );
  const layer3Lines = takeMeaningfulLines(
    sectionContent(exSkill.persona, "## Layer 3：情感模式"),
    5,
  );
  const layer4Lines = takeMeaningfulLines(
    sectionContent(exSkill.persona, "## Layer 4：关系行为"),
    5,
  );

  const skillProfile: DistilledSkillProfile = {
    overview: `${bundle.profile.alias} 的当前内核来自 ex.skill 的 Relationship Memory + Persona。`,
    coreStrengths: skills
      .slice(0, 4)
      .map((skill) => `${skill.name}：${skill.rationale}`),
    workingSignals: dedupe([
      ...bundle.sources.map((source) => `${source.title} · ${source.kind}`),
      `依恋类型：${exSkill.labels.attachmentStyle}`,
      `爱的语言：${exSkill.labels.loveLanguages.join(" · ")}`,
      `MBTI 64 子型：${exSkill.labels.mbti64.code}`,
      ...(previousTwin?.skillProfile?.workingSignals ?? []),
    ]).slice(0, 4),
    evidenceNotes: evidence
      .slice(0, 4)
      .map((item) => `${item.title}：${item.quote}`),
  };

  const memoryProfile: DistilledMemoryProfile = {
    overview: `Relationship Memory 已生成，当前使用 ${bundle.sources.length} 份结构化来源。`,
    timeline: dedupe([
      ...memoryTimeline,
      ...(previousTwin?.memoryProfile?.timeline ?? []),
    ]).slice(0, 6),
    routines: dedupe([
      ...memoryRoutineLines,
      ...(previousTwin?.memoryProfile?.routines ?? []),
    ]).slice(0, 4),
    sharedContexts: dedupe([
      bundle.profile.timezone,
      ...bundle.profile.languages,
      exSkill.labels.zodiac ?? "",
      ...exSkill.labels.traitTags,
      ...(previousTwin?.memoryProfile?.sharedContexts ?? []),
    ].filter(Boolean)).slice(0, 6),
  };

  const personaProfile: DistilledPersonaProfile = {
    overview: `${bundle.profile.alias} 的表达、情绪和关系行为来自 ex.skill 的 Persona 五层结构。`,
    speakingStyle: dedupe([
      ...layer2Lines,
      ...(previousTwin?.personaProfile?.speakingStyle ?? []),
    ]).slice(0, 5),
    emotionalPattern: dedupe([
      ...layer3Lines,
      ...(previousTwin?.personaProfile?.emotionalPattern ?? []),
    ]).slice(0, 5),
    collaborationPattern: dedupe([
      ...layer4Lines,
      ...(previousTwin?.personaProfile?.collaborationPattern ?? []),
    ]).slice(0, 5),
    boundaries: dedupe([
      ...layer0Lines,
      ...(previousTwin?.personaProfile?.boundaries ?? []),
    ]).slice(0, 4),
  };

  return {
    skillProfile,
    memoryProfile,
    personaProfile,
  };
}
