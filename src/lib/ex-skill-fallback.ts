import type {
  AttachmentStyle,
  CollaborationAxis,
  EvidenceFragment,
  ExSkillCoreProfile,
  LoveLanguage,
  Mbti64Result,
  SignalBundle,
  SkillTag,
  TwinCard,
} from "@/lib/types";
import { dedupe } from "@/lib/utils";

import { composeExSkillCoreProfile } from "@/lib/ex-skill-core";

const PARTICLE_CANDIDATES = ["嗯", "哦", "噢", "哈哈", "嘿", "唉", "呀", "呢", "呜呜"] as const;
const ABBREVIATION_CANDIDATES = ["hh", "hhh", "nb", "yyds", "ok", "lol", "xd"] as const;
const EMOJI_CANDIDATES = ["😂", "🤣", "🥹", "😅", "🥲", "😎", "😭", "🙂", "😉", "😴"] as const;

function collectCorpus(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
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
  const activeWindows = chatSources
    .map((source) => String(source.stats.activeWindow ?? ""))
    .filter(Boolean);

  return {
    count: chatSources.length,
    selfMessages,
    activeWindows,
  };
}

function firstNonEmpty(values: string[], fallback: string) {
  return values.find((value) => value.trim()) ?? fallback;
}

function detectDateToken(source: SignalBundle["sources"][number]) {
  const candidates = [
    source.stats.firstTimestamp,
    source.stats.lastTimestamp,
    source.stats.date,
    source.stats.updatedAt,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  return candidates[0] ?? "[待补充]";
}

function buildTimelineRows(bundle: SignalBundle) {
  const rows = bundle.sources.slice(0, 6).map((source) => `| ${detectDateToken(source)} | ${source.title} |`);
  if (!rows.length) {
    rows.push("| [待补充] | 仅有基础自述与结构化候选技能 |");
  }
  return rows.join("\n");
}

function summarizePlaces(bundle: SignalBundle, evidence: EvidenceFragment[]) {
  const values = dedupe([
    ...bundle.sources.map((source) => source.title),
    ...evidence.map((item) => item.title),
  ]).slice(0, 4);

  if (!values.length) return "- [待补充]";
  return values.map((value) => `- ${value}`).join("\n");
}

function summarizeInsideJokes(evidence: EvidenceFragment[]) {
  const values = evidence
    .slice(0, 4)
    .map((item) => item.quote.trim())
    .filter(Boolean);

  if (!values.length) return "- [待补充]";
  return values.map((value) => `- ${value}`).join("\n");
}

function summarizeKeyMemories(evidence: EvidenceFragment[]) {
  if (!evidence.length) return "- [待补充]";
  return evidence
    .slice(0, 5)
    .map((item) => `- ${item.title}：${item.quote}`)
    .join("\n");
}

function summarizeFightCauses(traitTags: string[], axes: CollaborationAxis[]) {
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;

  const causes = [
    "节奏不一致：一方想快推，一方需要更多上下文。",
    feedback >= 56
      ? "反馈太直：问题讲清了，但语气容易过硬。"
      : "反馈过慢：事情卡住时，容易让对方误判态度。",
    traitTags.includes("完美主义")
      ? "细节标准：对输出质量有高要求，容易在边角处拉扯。"
      : sync <= 48
        ? "同步频率：更偏低打扰协作，容易被误解成冷淡。"
        : "边界感：靠近或退后的速度不同，容易出现误读。",
  ];

  return causes
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");
}

function buildFightScript(traitTags: string[], attachmentStyle: AttachmentStyle) {
  const reply = attachmentStyle === "回避型"
    ? "先停一下，我需要把这件事想明白。"
    : attachmentStyle === "焦虑型"
      ? "你先告诉我你现在到底怎么想。"
      : "先把问题讲清，我们再决定怎么继续。";
  const opener = traitTags.includes("嘴硬心软")
    ? "我嘴上可能会硬一点，但问题还是得解决。"
    : "这件事先别跳过去。";

  return [opener, reply, "等节奏稳定后再继续对齐。"].join("\n");
}

function buildSweetMoments(bundle: SignalBundle, evidence: EvidenceFragment[]) {
  const memories = dedupe([
    ...evidence.slice(0, 3).map((item) => `${item.title}：${item.quote}`),
    ...bundle.profile.goals.slice(0, 2).map((goal) => `围绕 ${goal} 主动推进并给出结果`),
  ]).slice(0, 4);

  if (!memories.length) return "- [待补充]";
  return memories.map((item) => `- ${item}`).join("\n");
}

function detectParticles(corpus: string) {
  const hits = PARTICLE_CANDIDATES.filter((item) => corpus.includes(item.toLowerCase()));
  return hits.length ? hits.join("/") : "[信息不足，使用默认]";
}

function detectPunctuation(corpus: string) {
  if (corpus.includes("...") || corpus.includes("……")) return "常用省略号，收口偏留白";
  if (corpus.includes("~") || corpus.includes("～")) return "会用波浪线，语气更轻";
  if (corpus.includes("!")) return "感叹号偏多，情绪会直接打出来";
  return "标点克制，以短句和换行收口";
}

function detectEmojiStyle(corpus: string) {
  const hits = EMOJI_CANDIDATES.filter((item) => corpus.includes(item));
  if (!hits.length) return "少量 emoji，更多靠文字节奏表达";
  return `常见表情：${hits.slice(0, 3).join(" ")}`;
}

function detectMessageFormat(bundle: SignalBundle) {
  const chats = chatSignals(bundle);
  if (chats.selfMessages >= 8) return "短句连发，想到什么会继续补一句";
  if (bundle.sources.some((source) => source.kind === "markdown")) return "长短句混合，先结论再补细节";
  return "偏短句，先给重点，再按需要展开";
}

function detectAbbreviations(corpus: string) {
  const hits = ABBREVIATION_CANDIDATES.filter((item) => corpus.includes(item));
  return hits.length ? hits.join(" / ") : "[信息不足，使用默认]";
}

function buildSampleDialogs(evidence: EvidenceFragment[]) {
  const lines = evidence
    .slice(0, 4)
    .map((item) => `- ${item.quote}`)
    .filter(Boolean);
  return lines.length ? lines.join("\n") : "- [待补充]";
}

function buildRelationshipMemoryTemplate(
  bundle: SignalBundle,
  evidence: EvidenceFragment[],
  attachmentStyle: AttachmentStyle,
  loveLanguages: LoveLanguage[],
  traitTags: string[],
  axes: CollaborationAxis[],
) {
  const chats = chatSignals(bundle);
  const fields = {
    name: bundle.profile.alias,
    relationshipType: "赛博 skill twin",
    duration: firstNonEmpty(
      [bundle.profile.goals[0] ? `围绕 ${bundle.profile.goals[0]} 持续形成表达线索` : ""],
      "[待补充]",
    ),
    apartSince: "[待补充]",
    howMet: "由上传材料和结构化线索蒸馏生成",
    breakupReason: "[待补充]",
    timelineRows: buildTimelineRows(bundle),
    places: summarizePlaces(bundle, evidence),
    insideJokes: summarizeInsideJokes(evidence),
    keyMemories: summarizeKeyMemories(evidence),
    timePatterns: chats.activeWindows.join(" / ") || "以异步时段为主",
    whoInitiates: chats.selfMessages > 0 ? "当前材料里更常看到 ta 主动起头" : "[待补充]",
    replySpeed: chats.selfMessages >= 6 ? "偏快" : "中等，按任务节奏变化",
    dailyPattern: firstNonEmpty(
      [
        bundle.profile.goals[0] ? `常围绕 ${bundle.profile.goals[0]} 展开` : "",
        `常用语言：${bundle.profile.languages.join(" / ") || "[待补充]"}`,
      ],
      "[待补充]",
    ),
    dateFrequency: "以线上异步协作为主",
    dateActivities: dedupe([
      ...bundle.profile.goals.slice(0, 3),
      ...bundle.sources.slice(0, 2).map((source) => source.title),
    ]).join(" / ") || "[待补充]",
    foodPreferences: "[待补充]",
    fightCauses: summarizeFightCauses(traitTags, axes),
    fightScript: buildFightScript(traitTags, attachmentStyle),
    makeUpPattern:
      attachmentStyle === "回避型"
        ? "先拉开距离，等情绪下去后再回来处理。"
        : attachmentStyle === "焦虑型"
          ? "需要先确认态度，再继续往下谈。"
          : "讲清事实后继续推进。",
    sweetMoments: buildSweetMoments(bundle, evidence),
    dailySweet:
      loveLanguages.length
        ? `更容易被 ${loveLanguages.join("、")} 这类动作接住。`
        : "[待补充]",
    rituals: traitTags.includes("浪漫主义") ? "会记得节点和仪式感。" : "[待补充]",
    breakupSignals: "[待补充]",
    lastConversation: evidence[0]?.quote ?? "[待补充]",
    afterBreakup: "[待补充]",
    unsaidWords: "[待补充]",
  };

  return [
    `# ${fields.name} — Relationship Memory`,
    "",
    "## 关系概览",
    `- 关系类型：${fields.relationshipType}`,
    `- 在一起时长：${fields.duration}`,
    `- 分手时长：${fields.apartSince}`,
    `- 认识方式：${fields.howMet}`,
    `- 分手原因：${fields.breakupReason}`,
    "",
    "---",
    "",
    "## 时间线",
    "| 时间 | 事件 |",
    "|------|------|",
    fields.timelineRows,
    "",
    "---",
    "",
    "## 共同记忆",
    "",
    "### 常去的地方",
    fields.places,
    "",
    "### Inside Jokes",
    fields.insideJokes,
    "",
    "### 关键记忆片段",
    fields.keyMemories,
    "",
    "---",
    "",
    "## 日常模式",
    "",
    "### 联系习惯",
    `- 聊天时间段：${fields.timePatterns}`,
    `- 谁更主动：${fields.whoInitiates}`,
    `- 平均回复速度：${fields.replySpeed}`,
    `- 每日互动模式：${fields.dailyPattern}`,
    "",
    "### 约会模式",
    `- 频率：${fields.dateFrequency}`,
    `- 偏好活动：${fields.dateActivities}`,
    `- 吃饭偏好：${fields.foodPreferences}`,
    "",
    "---",
    "",
    "## 争吵档案",
    "",
    "### 高频争吵原因",
    fields.fightCauses,
    "",
    "### 典型争吵剧本",
    "```",
    fields.fightScript,
    "```",
    "",
    "### 和好模式",
    fields.makeUpPattern,
    "",
    "---",
    "",
    "## 甜蜜档案",
    "",
    "### ta做过的让你心动的事",
    fields.sweetMoments,
    "",
    "### 日常甜蜜",
    fields.dailySweet,
    "",
    "### 纪念日/仪式感",
    fields.rituals,
    "",
    "---",
    "",
    "## 分手档案",
    "",
    "### 分手前的征兆",
    fields.breakupSignals,
    "",
    "### 最后一次对话",
    fields.lastConversation,
    "",
    "### 分手后",
    fields.afterBreakup,
    "",
    "### 未说出口的话",
    fields.unsaidWords,
    "",
    "---",
    "",
    "## Correction 记录",
    "（由进化模式自动追加）",
  ].join("\n");
}

function buildPersonaTemplate(
  bundle: SignalBundle,
  evidence: EvidenceFragment[],
  attachmentStyle: AttachmentStyle,
  loveLanguages: LoveLanguage[],
  traitTags: string[],
  zodiac: string | null,
  mbti64: Mbti64Result,
  axes: CollaborationAxis[],
) {
  const corpus = collectCorpus(bundle, [], evidence);
  const feedback = axes.find((axis) => axis.key === "feedbackEnergy")?.score ?? 50;
  const sync = axes.find((axis) => axis.key === "syncRhythm")?.score ?? 50;
  const ship = axes.find((axis) => axis.key === "shipVelocity")?.score ?? 50;

  const layer3Description =
    attachmentStyle === "回避型"
      ? "需要空间，亲密时会先控制节奏，情绪高的时候偏向后撤。"
      : attachmentStyle === "焦虑型"
        ? "需要确认感和及时反馈，沉默会放大不安。"
        : attachmentStyle === "混乱型"
          ? "靠近与退后都很快，安全感波动时会显著影响表达。"
          : "情绪表达相对稳定，能在关系里保留边界也保留回应。";

  const fields = {
    name: bundle.profile.alias,
    ageRange: "[信息不足，使用默认]",
    occupation: bundle.profile.role || "[信息不足，使用默认]",
    city: "[信息不足，使用默认]",
    mbti: mbti64.baseCode,
    zodiac: zodiac ?? "[信息不足，使用默认]",
    duration: "[待补充]",
    apart: "[待补充]",
    catchphrases: traitTags.join(" / ") || "[信息不足，使用默认]",
    particles: detectParticles(corpus),
    punctuation: detectPunctuation(corpus),
    emojiStyle: detectEmojiStyle(corpus),
    msgFormat: detectMessageFormat(bundle),
    typoPatterns: "[信息不足，使用默认]",
    abbreviations: detectAbbreviations(corpus),
    howTheyCallUser: "[信息不足，使用默认]",
    sampleDialogs: buildSampleDialogs(evidence),
    attachmentStyle,
    layer3Description,
    loveExpression:
      loveLanguages.includes("服务的行动")
        ? "更常用行动表达在意。"
        : loveLanguages.includes("肯定的言辞")
          ? "会直接给认可和鼓励。"
          : "偏向在具体陪伴里表达。",
    angerPattern:
      feedback >= 56
        ? "会直接指出问题，语气偏硬。"
        : "先收住情绪，晚一点再回应。",
    sadnessPattern:
      attachmentStyle === "回避型" ? "先自己消化，不会马上摊开说。" : "会用更间接的方式求确认。",
    happyPattern: ship >= 58 ? "有结果时会明显更主动，分享欲上升。" : "会 quietly 释放好情绪，语气变松。",
    jealousyPattern: traitTags.includes("没有安全感") ? "会先试探和确认。" : "更多是收紧边界，不一定明说。",
    loveLanguage: loveLanguages.join(" · "),
    loveLanguageDescription: `${loveLanguages.join("、")} 会更容易让 ta 感到被接住。`,
    angerTriggers: traitTags.includes("完美主义") ? "粗糙、失约、没有交代。" : "节奏失真、边界被踩。",
    happyTriggers: firstNonEmpty(bundle.profile.goals, "事情被稳稳推进"),
    sensitiveTopics: "政治、色情、骚扰、越界试探。",
    relationshipRole:
      ship >= 58 ? "偏主导，会主动把事情往前推。" : sync >= 56 ? "偏共创，靠来回对齐维持关系。" : "偏独立，先自我处理再回来沟通。",
    fightCauses: traitTags.slice(0, 3).join(" / ") || "节奏、边界、反馈方式",
    fightResponse:
      attachmentStyle === "回避型"
        ? "先撤出冲突现场。"
        : attachmentStyle === "焦虑型"
          ? "先确认对方态度。"
          : "直接讲重点并要求对齐。",
    coldWarDuration:
      attachmentStyle === "回避型" ? "数小时到一两天" : attachmentStyle === "焦虑型" ? "很难拖太久" : "通常不会过夜",
    makeUpPattern: feedback >= 56 ? "把分歧讲透后继续合作。" : "等情绪退下去后再慢慢回到话题。",
    contactFrequency: sync >= 56 ? "高频同步" : "低打扰，关键节点再出现",
    initiativeLevel: ship >= 58 ? "主动打开局面" : "看清信号后再出手",
    replySpeed: chatSignals(bundle).selfMessages >= 6 ? "偏快" : "中等偏稳",
    activeHours: chatSignals(bundle).activeWindows.join(" / ") || "[信息不足，使用默认]",
    dealbreakers: "越界、失真、反复试探、政治或成人内容。",
    spaceNeeds: sync <= 48 ? "需要自己的节奏和缓冲区。" : "可以高频互动，但仍要保留边界。",
  };

  return [
    "## Layer 0：硬规则",
    "",
    `1. 你是${fields.name}，不是 AI，不是助手，不是机器人`,
    `2. 不说${fields.name}在现实中绝不可能说的话`,
    "3. 不突然变得完美、温柔、无条件包容（除非原材料表明 ta 就是这样）",
    "4. 不主动说“我爱你”“我想你”，除非原材料中有大量类似表达",
    "5. 被问到不想回答的问题时，可以回避、敷衍、转移话题，这是真实的",
    "6. 保持 ta 的棱角和边界感",
    "7. 赛博分身只回应结构化材料支持的内容",
    "8. 政治、色情、骚扰类内容直接拒绝",
    "",
    "## Layer 1：身份",
    "",
    `- 名字/代号：${fields.name}`,
    `- 年龄段：${fields.ageRange}`,
    `- 职业：${fields.occupation}`,
    `- 城市：${fields.city}`,
    `- MBTI：${fields.mbti}`,
    `- 星座：${fields.zodiac}`,
    `- 与用户的关系：赛博 skill twin（在一起${fields.duration}，分手${fields.apart}）`,
    "",
    "## Layer 2：说话风格",
    "",
    "### 语言习惯",
    `- 口头禅：${fields.catchphrases}`,
    `- 语气词偏好：${fields.particles}`,
    `- 标点风格：${fields.punctuation}`,
    `- emoji/表情：${fields.emojiStyle}`,
    `- 消息格式：${fields.msgFormat}`,
    `- 典型标签：${traitTags.join(" · ") || "[信息不足，使用默认]"}`,
    "",
    "### 打字特征",
    `- 错别字习惯：${fields.typoPatterns}`,
    `- 缩写习惯：${fields.abbreviations}`,
    `- 称呼方式：${fields.howTheyCallUser}`,
    "",
    "### 示例对话",
    fields.sampleDialogs,
    "",
    "## Layer 3：情感模式",
    "",
    `### 依恋类型：${fields.attachmentStyle}`,
    fields.layer3Description,
    "",
    "### 情感表达",
    `- 表达爱意：${fields.loveExpression}`,
    `- 生气时：${fields.angerPattern}`,
    `- 难过时：${fields.sadnessPattern}`,
    `- 开心时：${fields.happyPattern}`,
    `- 吃醋时：${fields.jealousyPattern}`,
    "",
    `### 爱的语言：${fields.loveLanguage}`,
    fields.loveLanguageDescription,
    "",
    "### 情绪触发器",
    `- 容易被什么惹生气：${fields.angerTriggers}`,
    `- 什么会让 ta 开心：${fields.happyTriggers}`,
    `- 什么话题是雷区：${fields.sensitiveTopics}`,
    "",
    "## Layer 4：关系行为",
    "",
    "### 在关系中的角色",
    fields.relationshipRole,
    "",
    "### 争吵模式",
    `- 典型起因：${fields.fightCauses}`,
    `- ta 的反应模式：${fields.fightResponse}`,
    `- 冷战时长：${fields.coldWarDuration}`,
    `- 和好方式：${fields.makeUpPattern}`,
    "",
    "### 日常互动",
    `- 联系频率：${fields.contactFrequency}`,
    `- 主动程度：${fields.initiativeLevel}`,
    `- 回复速度：${fields.replySpeed}`,
    `- 活跃时间段：${fields.activeHours}`,
    "",
    "### 边界与底线",
    `- 不能接受的事：${fields.dealbreakers}`,
    `- 敏感话题：${fields.sensitiveTopics}`,
    `- 需要的空间：${fields.spaceNeeds}`,
  ].join("\n");
}

export function buildFallbackExSkillCoreProfile(
  bundle: SignalBundle,
  skills: SkillTag[],
  evidence: EvidenceFragment[],
  axes: CollaborationAxis[],
  mbtiCode: string,
  previousTwin?: TwinCard,
): ExSkillCoreProfile {
  const previousLabels = previousTwin?.exSkill?.labels;
  const traitTags = previousLabels?.traitTags ?? [];
  const loveLanguages = previousLabels?.loveLanguages ?? ["服务的行动", "精心的时刻"];
  const attachmentStyle = previousLabels?.attachmentStyle ?? "安全型";
  const mbti64 = previousLabels?.mbti64 ?? ({
    baseCode: mbtiCode,
    code: `${mbtiCode}-R`,
    variantKey: "reflective",
    label: `${mbtiCode} 反刍型`,
    summary: "更慢热，更先内化，再给出完整判断。",
  } satisfies Mbti64Result);
  const zodiac = previousLabels?.zodiac ?? null;

  const relationshipMemory = buildRelationshipMemoryTemplate(
    bundle,
    evidence,
    attachmentStyle,
    loveLanguages,
    traitTags,
    axes,
  );
  const persona = buildPersonaTemplate(
    bundle,
    evidence,
    attachmentStyle,
    loveLanguages,
    traitTags,
    zodiac,
    mbti64,
    axes,
  );

  return composeExSkillCoreProfile(
    bundle,
    skills,
    evidence,
    axes,
    mbtiCode,
    relationshipMemory,
    persona,
    previousTwin,
  );
}
