import type { TwinCard } from "@/lib/types";
import { getSbtiTestTypeMeta } from "@/lib/sbti-test";

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
  imagePath?: string;
};

const MBTI_GUIDES: Record<MbtiCode, OfficialGuide> = {
  INTJ: {
    code: "INTJ",
    title: "建筑师",
    subtitle: "Architect",
    description: "富有想象力且善于策略思考，总有周全的计划。",
    sourceTitle: "16Personalities INTJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/intj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/INTJ",
  },
  INTP: {
    code: "INTP",
    title: "逻辑学家",
    subtitle: "Logician",
    description: "创新型发明家，永不满足于对知识的追求。",
    sourceTitle: "16Personalities INTP 人格",
    sourceUrl: "https://www.16personalities.com/ch/intp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/INTP",
  },
  ENTJ: {
    code: "ENTJ",
    title: "指挥官",
    subtitle: "Commander",
    description: "大胆、富有想象力且意志坚定的领导者，总能找到出路，或亲自开辟新路。",
    sourceTitle: "16Personalities ENTJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/entj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ENTJ",
  },
  ENTP: {
    code: "ENTP",
    title: "辩论家",
    subtitle: "Debater",
    description: "聪明且富有好奇心的思想者，总是乐于接受智力挑战。",
    sourceTitle: "16Personalities ENTP 人格",
    sourceUrl: "https://www.16personalities.com/ch/entp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ENTP",
  },
  INFJ: {
    code: "INFJ",
    title: "提倡者",
    subtitle: "Advocate",
    description: "安静而神秘，却极具启发性，是不知疲倦的理想主义者。",
    sourceTitle: "16Personalities INFJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/infj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/INFJ",
  },
  INFP: {
    code: "INFP",
    title: "调停者",
    subtitle: "Mediator",
    description: "富有诗意、善良和乐于助人的人，总是渴望为善举出力。",
    sourceTitle: "16Personalities INFP 人格",
    sourceUrl: "https://www.16personalities.com/ch/infp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/INFP",
  },
  ENFJ: {
    code: "ENFJ",
    title: "主人公",
    subtitle: "Protagonist",
    description: "充满魅力且鼓舞人心的领导者，能够深深吸引听众。",
    sourceTitle: "16Personalities ENFJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/enfj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ENFJ",
  },
  ENFP: {
    code: "ENFP",
    title: "活动家",
    subtitle: "Campaigner",
    description: "充满热情、富有创意且善于交际的自由灵魂，总能找到微笑的理由。",
    sourceTitle: "16Personalities ENFP 人格",
    sourceUrl: "https://www.16personalities.com/ch/enfp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ENFP",
  },
  ISTJ: {
    code: "ISTJ",
    title: "物流师",
    subtitle: "Logistician",
    description: "务实且注重事实的人，可靠性无可置疑。",
    sourceTitle: "16Personalities ISTJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/istj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ISTJ",
  },
  ISFJ: {
    code: "ISFJ",
    title: "守护者",
    subtitle: "Defender",
    description: "非常忠诚且温暖的守护者，总是随时准备保护他们所爱的人。",
    sourceTitle: "16Personalities ISFJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/isfj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ISFJ",
  },
  ESTJ: {
    code: "ESTJ",
    title: "总经理",
    subtitle: "Executive",
    description: "出色的管理者，在管理事物或人的方面无与伦比。",
    sourceTitle: "16Personalities ESTJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/estj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ESTJ",
  },
  ESFJ: {
    code: "ESFJ",
    title: "执政官",
    subtitle: "Consul",
    description: "极富同情心，善于交际，深受欢迎，总是乐于助人。",
    sourceTitle: "16Personalities ESFJ 人格",
    sourceUrl: "https://www.16personalities.com/ch/esfj-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ESFJ",
  },
  ISTP: {
    code: "ISTP",
    title: "鉴赏家",
    subtitle: "Virtuoso",
    description: "大胆且务实的实验者，精通各种工具的使用。",
    sourceTitle: "16Personalities ISTP 人格",
    sourceUrl: "https://www.16personalities.com/ch/istp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ISTP",
  },
  ISFP: {
    code: "ISFP",
    title: "冒险家",
    subtitle: "Adventurer",
    description: "灵活且富有魅力的艺术家，总是乐于探索和体验新事物。",
    sourceTitle: "16Personalities ISFP 人格",
    sourceUrl: "https://www.16personalities.com/ch/isfp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ISFP",
  },
  ESTP: {
    code: "ESTP",
    title: "企业家",
    subtitle: "Entrepreneur",
    description: "聪明、充满活力且极具洞察力的人，真正享受冒险刺激的生活。",
    sourceTitle: "16Personalities ESTP 人格",
    sourceUrl: "https://www.16personalities.com/ch/estp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ESTP",
  },
  ESFP: {
    code: "ESFP",
    title: "表演者",
    subtitle: "Entertainer",
    description: "自发、充满活力且热情洋溢的人，有他们在，生活从不无聊。",
    sourceTitle: "16Personalities ESFP 人格",
    sourceUrl: "https://www.16personalities.com/ch/esfp-%E4%BA%BA%E6%A0%BC",
    retrievedAt: "2026-04-15",
    imagePath: "/api/mbti-portrait/ESFP",
  },
};

function isMbtiCode(code: string): code is MbtiCode {
  return MBTI_CODES.includes(code as MbtiCode);
}

export function getMbtiGuide(code: string) {
  if (!isMbtiCode(code)) return null;
  return MBTI_GUIDES[code];
}

export function getSbtiGuide(code: string) {
  const meta = getSbtiTestTypeMeta(code);
  if (!meta) return null;

  return {
    code: meta.code,
    title: meta.title,
    subtitle: meta.intro,
    description: "基于 SBTI-test 的 15 维人格模式进行最近邻匹配，再显示对应人物图。",
    sourceTitle: "UnluckyNinja/SBTI-test",
    sourceUrl: "https://github.com/UnluckyNinja/SBTI-test",
    retrievedAt: "2026-04-15",
    imagePath: meta.imagePath,
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
