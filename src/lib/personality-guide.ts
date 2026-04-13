import type { TwinCard } from "@/lib/types";

export const MBTI_CODES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
] as const;

export type MbtiCode = (typeof MBTI_CODES)[number];

type OfficialGuide = {
  code: string;
  title: string;
  subtitle: string;
  description: string;
  sourceTitle: string;
  sourceUrl: string;
  retrievedAt: string;
};

const MBTI_GUIDES: Record<MbtiCode, OfficialGuide> = {
  INTJ: {
    code: "INTJ",
    title: "概念规划者",
    subtitle: "the conceptual planner",
    description: "看得远，习惯先在脑中把系统拆清，再低调推进高难题。",
    sourceTitle: "MBTIonline INTJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/INTJ",
    retrievedAt: "2026-04-11",
  },
  INTP: {
    code: "INTP",
    title: "客观分析者",
    subtitle: "the objective analyst",
    description: "安静、审慎，喜欢研究原理和概念，偏好在幕后把问题想透。",
    sourceTitle: "MBTIonline INTP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/INTP",
    retrievedAt: "2026-04-11",
  },
  ENTJ: {
    code: "ENTJ",
    title: "决策战略家",
    subtitle: "the decisive strategist",
    description: "盯大局、定长期目标、做分析决策，适合高压下带队推进。",
    sourceTitle: "MBTIonline ENTJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ENTJ",
    retrievedAt: "2026-04-11",
  },
  ENTP: {
    code: "ENTP",
    title: "开创探索者",
    subtitle: "the enterprising explorer",
    description: "对模式很敏感，爱策略、脑暴和新解法，压力下也能保持机动。",
    sourceTitle: "MBTIonline ENTP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ENTP",
    retrievedAt: "2026-04-11",
  },
  INFJ: {
    code: "INFJ",
    title: "洞察愿景者",
    subtitle: "the insightful visionary",
    description: "重视意义与人，先看长期善意和整体和谐，再投入推动改变。",
    sourceTitle: "MBTIonline INFJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/INFJ",
    retrievedAt: "2026-04-11",
  },
  INFP: {
    code: "INFP",
    title: "理想思考者",
    subtitle: "the thoughtful idealist",
    description: "以价值观驱动，想象力强，喜欢用创意方式解决问题并持续成长。",
    sourceTitle: "MBTIonline INFP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/INFP",
    retrievedAt: "2026-04-11",
  },
  ENFJ: {
    code: "ENFJ",
    title: "共情促成者",
    subtitle: "the compassionate facilitator",
    description: "擅长感知他人状态、化解冲突、把人组织到共同目标上。",
    sourceTitle: "MBTIonline ENFJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ENFJ",
    retrievedAt: "2026-04-11",
  },
  ENFP: {
    code: "ENFP",
    title: "想象激励者",
    subtitle: "the imaginative motivator",
    description: "会被新人和新挑战点燃，适应快，也常从多个角度找出新办法。",
    sourceTitle: "MBTIonline ENFP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ENFP",
    retrievedAt: "2026-04-11",
  },
  ISTJ: {
    code: "ISTJ",
    title: "负责现实派",
    subtitle: "the responsible realist",
    description: "依赖经验和事实做判断，专注、稳定、效率高，重视熟悉且可靠的路径。",
    sourceTitle: "MBTIonline ISTJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ISTJ",
    retrievedAt: "2026-04-11",
  },
  ISFJ: {
    code: "ISFJ",
    title: "务实帮助者",
    subtitle: "the practical helper",
    description: "会先理解别人真正需要什么，再用可靠、实际的方式把事情照顾好。",
    sourceTitle: "MBTIonline ISFJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ISFJ",
    retrievedAt: "2026-04-11",
  },
  ESTJ: {
    code: "ESTJ",
    title: "高效组织者",
    subtitle: "the efficient organizer",
    description: "逻辑清楚、结果导向，善于组织团队和项目，并果断做决定。",
    sourceTitle: "MBTIonline ESTJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ESTJ",
    retrievedAt: "2026-04-11",
  },
  ESFJ: {
    code: "ESFJ",
    title: "支持型贡献者",
    subtitle: "the supportive contributor",
    description: "天然会照顾别人，也愿意为群体建立秩序和支持系统。",
    sourceTitle: "MBTIonline ESFJ personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ESFJ",
    retrievedAt: "2026-04-11",
  },
  ISTP: {
    code: "ISTP",
    title: "逻辑实干者",
    subtitle: "the logical pragmatist",
    description: "遇事冷静，喜欢把技能练到专业级，危机里能迅速判断并解题。",
    sourceTitle: "MBTIonline ISTP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ISTP",
    retrievedAt: "2026-04-11",
  },
  ISFP: {
    code: "ISFP",
    title: "灵活支持者",
    subtitle: "the versatile supporter",
    description: "安静观察、尊重差异，乐于帮助别人，但不喜欢被规则过度束缚。",
    sourceTitle: "MBTIonline ISFP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ISFP",
    retrievedAt: "2026-04-11",
  },
  ESTP: {
    code: "ESTP",
    title: "高能解题者",
    subtitle: "the energetic problem solver",
    description: "反应快、动手快，靠常识和机智找到更聪明的做法。",
    sourceTitle: "MBTIonline ESTP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ESTP",
    retrievedAt: "2026-04-11",
  },
  ESFP: {
    code: "ESFP",
    title: "热情即兴者",
    subtitle: "the enthusiastic improvisor",
    description: "外向友好，善于调动气氛，喜欢边做边调，让过程有活力。",
    sourceTitle: "MBTIonline ESFP personality type",
    sourceUrl: "https://www.mbtionline.com/en-US/MBTI-Types/ESFP",
    retrievedAt: "2026-04-11",
  },
};

const SBTI_DIMENSIONS = {
  pace: {
    S: {
      short: "快推",
      english: "Shipper",
      description: "先做可验证版本，再根据反馈重构。",
    },
    D: {
      short: "推演",
      english: "Deliberator",
      description: "先判断边界和方案，再稳步出手。",
    },
  },
  ambiguity: {
    B: {
      short: "敢冲",
      english: "Bold",
      description: "信息不完整也能先推进，边做边补约束。",
    },
    A: {
      short: "审慎",
      english: "Analytical",
      description: "更喜欢先锁约束，再放量执行。",
    },
  },
  feedback: {
    T: {
      short: "直说",
      english: "Transparent",
      description: "反馈直达问题本身，结论很快。",
    },
    R: {
      short: "克制",
      english: "Reserved",
      description: "会先消化信息，再给出反馈。",
    },
  },
  sync: {
    I: {
      short: "独立",
      english: "Independent",
      description: "更适合低打扰、强异步的合作节奏。",
    },
    S: {
      short: "共创",
      english: "Synchronous",
      description: "更适合高频同步、边聊边改的合作节奏。",
    },
  },
} as const;

function isMbtiCode(code: string): code is MbtiCode {
  return MBTI_CODES.includes(code as MbtiCode);
}

export function getMbtiGuide(code: string) {
  if (!isMbtiCode(code)) return null;
  return MBTI_GUIDES[code];
}

export function getSbtiGuide(code: string) {
  if (!/^[SD][BA][TR][IS]$/.test(code)) return null;

  const [paceCode, ambiguityCode, feedbackCode, syncCode] = code.split("") as [
    keyof typeof SBTI_DIMENSIONS.pace,
    keyof typeof SBTI_DIMENSIONS.ambiguity,
    keyof typeof SBTI_DIMENSIONS.feedback,
    keyof typeof SBTI_DIMENSIONS.sync,
  ];
  const pace = SBTI_DIMENSIONS.pace[paceCode];
  const ambiguity = SBTI_DIMENSIONS.ambiguity[ambiguityCode];
  const feedback = SBTI_DIMENSIONS.feedback[feedbackCode];
  const sync = SBTI_DIMENSIONS.sync[syncCode];

  return {
    code,
    title: `${pace.short}${ambiguity.short}${feedback.short}${sync.short}型`,
    subtitle: `${pace.english} ${ambiguity.english} ${feedback.english} ${sync.english}`,
    description: `${pace.description}${ambiguity.description}${feedback.description}${sync.description}`,
    sourceTitle: "CyberDate SBTI official guide",
    sourceUrl: "docs/personality-guides.md#sbti",
    retrievedAt: "2026-04-11",
  } satisfies OfficialGuide;
}

export function getAiPersonaGuide(twin: TwinCard) {
  const topSkill = twin.skills[0]?.name ?? twin.imsb.label;
  const leadAxis = [...twin.collaborationAxes].sort(
    (left, right) => right.score - left.score,
  )[0];
  const title = [twin.role, topSkill].filter(Boolean).join(" · ") || "Skill Twin";
  const description = leadAxis
    ? `主技能偏 ${topSkill}，${leadAxis.explanation}`
    : twin.summary;

  return {
    title,
    description,
  };
}
