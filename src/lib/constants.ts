import type { TwinCard } from "@/lib/types";

export const MAX_SIGNAL_BUNDLE_BYTES = 36_000;
export const AUTH_GUARD_RATE_LIMIT = 12;
export const AUTH_GUARD_RATE_WINDOW_MS = 60_000;
export const DISTILL_RATE_LIMIT = 8;
export const DISTILL_RATE_WINDOW_MS = 60_000;
export const CONNECT_RESOLVE_RATE_LIMIT = 30;
export const CONNECT_RESOLVE_RATE_WINDOW_MS = 60_000;
export const CONNECT_EXCHANGE_RATE_LIMIT = 20;
export const CONNECT_EXCHANGE_RATE_WINDOW_MS = 60_000;
export const AUTO_CHAT_RATE_LIMIT = 10;
export const AUTO_CHAT_RATE_WINDOW_MS = 60_000;
export const MATCH_THRESHOLD = 61;
export const DAILY_EXCHANGE_SENTENCE_LIMIT = 30;

export const AXIS_LABELS = {
  shipVelocity: "出手速度",
  ambiguityFit: "混沌耐受",
  feedbackEnergy: "反馈直率",
  syncRhythm: "同步节奏",
} as const;

export const SKILL_KEYWORDS: Record<string, string[]> = {
  "AI Workflow": ["workflow", "agent", "automation", "prompt", "llm", "rag"],
  "Browser Automation": ["playwright", "puppeteer", "selenium", "browser"],
  "Frontend Systems": ["react", "next.js", "tailwind", "typescript", "ui"],
  "Product Thinking": ["prd", "roadmap", "user story", "retention", "funnel"],
  "Growth Ops": ["growth", "seo", "landing page", "conversion", "campaign"],
  "Backend APIs": ["api", "backend", "server", "auth", "rate limit"],
  "Data Ops": ["postgres", "sql", "analytics", "vector", "embedding"],
  "Design Systems": ["figma", "design system", "component", "token"],
  "Mobile Craft": ["swift", "ios", "android", "react native", "mobile"],
  "Infra Shipping": ["vercel", "cloudflare", "docker", "ci", "deployment"],
  "Realtime UX": ["websocket", "streaming", "realtime", "latency"],
  "Creator Engine": ["content", "brand", "storytelling", "community"],
};

export const SKILL_CATEGORIES: Record<string, string> = {
  "AI Workflow": "ai",
  "Browser Automation": "ai",
  "Frontend Systems": "product",
  "Product Thinking": "product",
  "Growth Ops": "growth",
  "Backend APIs": "engineering",
  "Data Ops": "engineering",
  "Design Systems": "design",
  "Mobile Craft": "engineering",
  "Infra Shipping": "ops",
  "Realtime UX": "engineering",
  "Creator Engine": "brand",
};

export const GOAL_CAPSULES = [
  {
    matchers: ["automation", "agent", "workflow"],
    capsule: "在找 AI workflow 合作者",
  },
  {
    matchers: ["browser", "playwright", "crawler"],
    capsule: "最近在做浏览器自动化项目",
  },
  {
    matchers: ["design", "brand", "landing"],
    capsule: "想找能一起打磨产品展示面的搭子",
  },
];

export const BLOCKED_KEYWORD_GROUPS = [
  {
    label: "politics",
    terms: [
      "习近平",
      "共产党",
      "台独",
      "港独",
      "法轮功",
      "六四",
      "天安门事件",
      "颠覆政权",
      "政治运动",
      "竞选宣传",
    ],
  },
  {
    label: "adult",
    terms: [
      "色情",
      "性交易",
      "约炮",
      "裸聊",
      "裸照",
      "援交",
      "adult video",
      "porn",
      "成人视频",
      "成人直播",
    ],
  },
  {
    label: "abuse",
    terms: [
      "violence",
      "doxx",
      "stalker",
      "骚扰",
      "仇恨",
      "外挂",
      "代刷",
    ],
  },
] as const;

export const MBTI_QUESTIONS = [
  {
    id: "ei-1",
    dimension: ["E", "I"] as const,
    prompt: "新项目开场时，你更习惯先：",
    options: ["把想法丢进群里拉大家一起推", "自己先整理一版结构再公开"],
  },
  {
    id: "ei-2",
    dimension: ["E", "I"] as const,
    prompt: "遇到卡点时，你更常：",
    options: ["边说边想，在讨论里找解法", "先独立消化，再带着方案回到讨论"],
  },
  {
    id: "sn-1",
    dimension: ["S", "N"] as const,
    prompt: "看一份新资料时，你先抓：",
    options: ["已验证的事实和约束", "潜在方向和模式"],
  },
  {
    id: "sn-2",
    dimension: ["S", "N"] as const,
    prompt: "你更相信：",
    options: ["现场证据和已有案例", "抽象模型和跨场景迁移"],
  },
  {
    id: "tf-1",
    dimension: ["T", "F"] as const,
    prompt: "给队友反馈时，你默认：",
    options: ["先说结论和风险", "先顾及感受再推进结论"],
  },
  {
    id: "tf-2",
    dimension: ["T", "F"] as const,
    prompt: "做取舍时，你更优先：",
    options: ["逻辑闭环和效率", "团队氛围和关系成本"],
  },
  {
    id: "jp-1",
    dimension: ["J", "P"] as const,
    prompt: "推进多线程任务时，你更舒服的状态是：",
    options: ["先排优先级和里程碑", "边做边调，留足机动空间"],
  },
  {
    id: "jp-2",
    dimension: ["J", "P"] as const,
    prompt: "上线前一天，你通常会：",
    options: ["锁定方案，按清单执行", "继续迭代，直到最后一刻仍在优化"],
  },
];

export const IMSB_QUESTIONS = [
  {
    id: "imsb-1",
    axis: "I" as const,
    prompt: "你在团队里最自然的贡献是：",
    options: ["先看懂信号和趋势", "我更喜欢别的节奏"],
  },
  {
    id: "imsb-2",
    axis: "M" as const,
    prompt: "遇到模糊需求时，你会：",
    options: ["先搭最小能跑的东西", "我更喜欢先观察或协调"],
  },
  {
    id: "imsb-3",
    axis: "S" as const,
    prompt: "面对复杂系统时，你更想：",
    options: ["重画结构和边界", "先把局部推起来再说"],
  },
  {
    id: "imsb-4",
    axis: "B" as const,
    prompt: "跨团队协作里，你常常：",
    options: ["做桥梁，把信息拉平", "更专注自己这一块"],
  },
  {
    id: "imsb-5",
    axis: "I" as const,
    prompt: "你最容易兴奋的是：",
    options: ["提前发现一个值得押注的方向", "看到成品已经跑起来"],
  },
  {
    id: "imsb-6",
    axis: "M" as const,
    prompt: "你更享受：",
    options: ["马上构建原型", "先沉淀共识和文档"],
  },
  {
    id: "imsb-7",
    axis: "S" as const,
    prompt: "你处理信息的方式更像：",
    options: ["把碎片收拢成系统", "保持灵活，不急着固化"],
  },
  {
    id: "imsb-8",
    axis: "B" as const,
    prompt: "在合作中，你常被夸：",
    options: ["会把对的人和对的机会接起来", "执行压得住"],
  },
];

export const IMSB_LABELS: Record<
  "I" | "M" | "S" | "B",
  { label: string; summary: string }
> = {
  I: {
    label: "Insight Hunter",
    summary: "擅长从素材里闻出真正有价值的信号。",
  },
  M: {
    label: "Maker Sprint",
    summary: "最擅长把模糊想法快速压成可跑版本。",
  },
  S: {
    label: "System Composer",
    summary: "会主动整理边界、结构和约束，降低后续返工。",
  },
  B: {
    label: "Bridge Operator",
    summary: "擅长把人、节奏和上下游对齐，缩短协作回路。",
  },
};

export const SAMPLE_CANDIDATES: TwinCard[] = [
  {
    id: "candidate-aurora",
    slug: "aurora-lin",
    shareCode: "CD-AURO-A1B2C3",
    alias: "Aurora Lin",
    role: "Growth engineer",
    headline: "把自动化产品做成能自己带来分享的传播回路。",
    summary:
      "偏增长和自动化结合，擅长把工具包装成能自传播的体验。",
    goals: ["ai automation", "distribution", "content loops"],
    languages: ["中文", "English"],
    timezone: "Asia/Singapore",
    skills: [
      { name: "Growth Ops", confidence: 94, rationale: "长期做转化和内容飞轮" },
      { name: "AI Workflow", confidence: 91, rationale: "把 agent 编排进增长动作" },
      { name: "Creator Engine", confidence: 88, rationale: "会做传播文案和案例包装" },
      { name: "Frontend Systems", confidence: 82, rationale: "能独立把增长前台搭出来" },
    ],
    evidence: [],
    collaborationAxes: [
      { key: "shipVelocity", label: "出手速度", score: 79, explanation: "偏快推" },
      { key: "ambiguityFit", label: "混沌耐受", score: 82, explanation: "能先冲 demo" },
      { key: "feedbackEnergy", label: "反馈直率", score: 71, explanation: "愿意直接说问题" },
      { key: "syncRhythm", label: "同步节奏", score: 63, explanation: "喜欢短频快同步" },
    ],
    sbti: {
      code: "SBTI",
      title: "Shipper Bold Transparent Independent",
      summary: "推进快，愿意冒险，偏直接沟通。",
      meme: "上线前先发一个链接，再补故事。",
    },
    mbti: {
      code: "ENTJ",
      label: "Field Commander",
      summary: "会主动定目标、拆动作、拉人推进。",
    },
    imsb: {
      code: "MB",
      label: "Maker Bridge",
      summary: "擅长把产品推出来，再拉传播回路。",
      scores: { I: 48, M: 88, S: 64, B: 81 },
    },
    sharePolicy: {
      scope: "public",
      capsule: "在找 AI workflow 合作者",
    },
    autoMatchEnabled: true,
    autoChatEnabled: true,
    publishedAt: new Date("2026-04-10T00:00:00.000Z").toISOString(),
    generatedAt: new Date("2026-04-10T00:00:00.000Z").toISOString(),
    privacyStatement: "只展示发布后的结构化结果，不展示原始素材。",
  },
  {
    id: "candidate-kai",
    slug: "kai-zhou",
    shareCode: "CD-KAI9-D4E5F6",
    alias: "Kai Zhou",
    role: "Infra + data builder",
    headline: "偏基础设施和数据面，喜欢把复杂栈压成稳定路径。",
    summary: "适合搭底层、建 schema、扛上线稳定性和成本约束。",
    goals: ["vector search", "backend", "reliability"],
    languages: ["中文"],
    timezone: "Asia/Shanghai",
    skills: [
      { name: "Backend APIs", confidence: 95, rationale: "擅长后端接口和数据建模" },
      { name: "Data Ops", confidence: 93, rationale: "关注向量检索和数据边界" },
      { name: "Infra Shipping", confidence: 90, rationale: "会把部署和观测补全" },
      { name: "AI Workflow", confidence: 84, rationale: "理解推理链路与成本控制" },
    ],
    evidence: [],
    collaborationAxes: [
      { key: "shipVelocity", label: "出手速度", score: 67, explanation: "稳中偏快" },
      { key: "ambiguityFit", label: "混沌耐受", score: 54, explanation: "先补约束再开工" },
      { key: "feedbackEnergy", label: "反馈直率", score: 78, explanation: "偏直接" },
      { key: "syncRhythm", label: "同步节奏", score: 46, explanation: "偏异步" },
    ],
    sbti: {
      code: "SATI",
      title: "Shipper Analytical Transparent Independent",
      summary: "偏工程严谨，节奏不慢，信息密度高。",
      meme: "先把 schema 锁死，再给前台放行。",
    },
    mbti: {
      code: "INTJ",
      label: "System Strategist",
      summary: "会先建结构，再推动执行。",
    },
    imsb: {
      code: "SM",
      label: "System Maker",
      summary: "更偏系统和执行，不爱空转。",
      scores: { I: 52, M: 79, S: 91, B: 44 },
    },
    sharePolicy: {
      scope: "public",
      capsule: "最近在做浏览器自动化项目",
    },
    autoMatchEnabled: true,
    autoChatEnabled: true,
    publishedAt: new Date("2026-04-10T00:00:00.000Z").toISOString(),
    generatedAt: new Date("2026-04-10T00:00:00.000Z").toISOString(),
    privacyStatement: "只展示发布后的结构化结果，不展示原始素材。",
  },
];
