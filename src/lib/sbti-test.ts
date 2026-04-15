import type { PersonalityAnswer, SbtiArchetype } from "@/lib/types";
import { clamp, round } from "@/lib/utils";

export const SBTI_TEST_RESULT_CODES = [
  "CTRL",
  "ATM-er",
  "Dior-s",
  "BOSS",
  "THAN-K",
  "OH-NO",
  "GOGO",
  "SEXY",
  "LOVE-R",
  "MUM",
  "FAKE",
  "OJBK",
  "MALO",
  "JOKE-R",
  "WOC!",
  "THIN-K",
  "SHIT",
  "ZZZZ",
  "POOR",
  "MONK",
  "IMSB",
  "SOLO",
  "FUCK",
  "DEAD",
  "IMFW",
  "HHHH",
  "DRUNK",
] as const;

export type SbtiTestCode = (typeof SBTI_TEST_RESULT_CODES)[number];

export const SBTI_TEST_DIMENSION_ORDER = [
  "S1",
  "S2",
  "S3",
  "E1",
  "E2",
  "E3",
  "A1",
  "A2",
  "A3",
  "Ac1",
  "Ac2",
  "Ac3",
  "So1",
  "So2",
  "So3",
] as const;

export type SbtiTestDimensionKey = (typeof SBTI_TEST_DIMENSION_ORDER)[number];
export type SbtiTestLevel = "L" | "M" | "H";

export type SbtiTestQuestion = {
  id: string;
  dimension: SbtiTestDimensionKey;
  prompt: string;
  options: readonly [
    { key: "A"; label: string; value: 1 },
    { key: "B"; label: string; value: 2 },
    { key: "C"; label: string; value: 3 },
  ];
};

type SbtiTypeMeta = {
  title: string;
  intro: string;
  imagePath: string;
};

type SbtiDimensionMeta = {
  name: string;
  model: string;
  levels: Record<SbtiTestLevel, string>;
};

const SBTI_TEST_TYPE_LIBRARY: Record<SbtiTestCode, SbtiTypeMeta> = {
  CTRL: { title: "拿捏者", intro: "怎么样，被我拿捏了吧？", imagePath: "/sbti-test/CTRL.png" },
  "ATM-er": { title: "送钱者", intro: "你以为我很有钱吗？", imagePath: "/sbti-test/ATM-er.png" },
  "Dior-s": { title: "屌丝", intro: "等着我屌丝逆袭。", imagePath: "/sbti-test/Dior-s.jpg" },
  BOSS: { title: "领导者", intro: "方向盘给我，我来开。", imagePath: "/sbti-test/BOSS.png" },
  "THAN-K": { title: "感恩者", intro: "我感谢苍天！我感谢大地！", imagePath: "/sbti-test/THAN-K.png" },
  "OH-NO": { title: "哦不人", intro: "哦不！我怎么会是这个人格？！", imagePath: "/sbti-test/OH-NO.png" },
  GOGO: { title: "行者", intro: "gogogo~出发咯", imagePath: "/sbti-test/GOGO.png" },
  SEXY: { title: "尤物", intro: "您就是天生的尤物！", imagePath: "/sbti-test/SEXY.png" },
  "LOVE-R": { title: "多情者", intro: "爱意太满，现实显得有点贫瘠。", imagePath: "/sbti-test/LOVE-R.png" },
  MUM: { title: "妈妈", intro: "或许...我可以叫你妈妈吗....?", imagePath: "/sbti-test/MUM.png" },
  FAKE: { title: "伪人", intro: "已经，没有人类了。", imagePath: "/sbti-test/FAKE.png" },
  OJBK: { title: "无所谓人", intro: "我说随便，是真的随便。", imagePath: "/sbti-test/OJBK.png" },
  MALO: { title: "吗喽", intro: "人生是个副本，而我只是一只吗喽。", imagePath: "/sbti-test/MALO.png" },
  "JOKE-R": { title: "小丑", intro: "原来我们都是小丑。", imagePath: "/sbti-test/JOKE-R.jpg" },
  "WOC!": { title: "握草人", intro: "卧槽，我怎么是这个人格？", imagePath: "/sbti-test/WOC.png" },
  "THIN-K": { title: "思考者", intro: "已深度思考100s。", imagePath: "/sbti-test/THIN-K.png" },
  SHIT: { title: "愤世者", intro: "这个世界，构石一坨。", imagePath: "/sbti-test/SHIT.png" },
  ZZZZ: { title: "装死者", intro: "我没死，我只是在睡觉。", imagePath: "/sbti-test/ZZZZ.png" },
  POOR: { title: "贫困者", intro: "我穷，但我很专。", imagePath: "/sbti-test/POOR.png" },
  MONK: { title: "僧人", intro: "没有那种世俗的欲望。", imagePath: "/sbti-test/MONK.png" },
  IMSB: { title: "傻者", intro: "认真的么？我真的是傻逼么？", imagePath: "/sbti-test/IMSB.png" },
  SOLO: { title: "孤儿", intro: "我哭了，我怎么会是孤儿？", imagePath: "/sbti-test/SOLO.png" },
  FUCK: { title: "草者", intro: "操！这是什么人格？", imagePath: "/sbti-test/FUCK.png" },
  DEAD: { title: "死者", intro: "我，还活着吗？", imagePath: "/sbti-test/DEAD.png" },
  IMFW: { title: "废物", intro: "我真的...是废物吗？", imagePath: "/sbti-test/IMFW.png" },
  HHHH: { title: "傻乐者", intro: "哈哈哈哈哈哈。", imagePath: "/sbti-test/HHHH.png" },
  DRUNK: { title: "酒鬼", intro: "烈酒烧喉，不得不醉。", imagePath: "/sbti-test/DRUNK.png" },
};

const SBTI_TEST_NORMAL_TYPES = [
  { code: "CTRL", pattern: "HHH-HMH-MHH-HHH-MHM" },
  { code: "ATM-er", pattern: "HHH-HHM-HHH-HMH-MHL" },
  { code: "Dior-s", pattern: "MHM-MMH-MHM-HMH-LHL" },
  { code: "BOSS", pattern: "HHH-HMH-MMH-HHH-LHL" },
  { code: "THAN-K", pattern: "MHM-HMM-HHM-MMH-MHL" },
  { code: "OH-NO", pattern: "HHL-LMH-LHH-HHM-LHL" },
  { code: "GOGO", pattern: "HHM-HMH-MMH-HHH-MHM" },
  { code: "SEXY", pattern: "HMH-HHL-HMM-HMM-HLH" },
  { code: "LOVE-R", pattern: "MLH-LHL-HLH-MLM-MLH" },
  { code: "MUM", pattern: "MMH-MHL-HMM-LMM-HLL" },
  { code: "FAKE", pattern: "HLM-MML-MLM-MLM-HLH" },
  { code: "OJBK", pattern: "MMH-MMM-HML-LMM-MML" },
  { code: "MALO", pattern: "MLH-MHM-MLH-MLH-LMH" },
  { code: "JOKE-R", pattern: "LLH-LHL-LML-LLL-MLM" },
  { code: "WOC!", pattern: "HHL-HMH-MMH-HHM-LHH" },
  { code: "THIN-K", pattern: "HHL-HMH-MLH-MHM-LHH" },
  { code: "SHIT", pattern: "HHL-HLH-LMM-HHM-LHH" },
  { code: "ZZZZ", pattern: "MHL-MLH-LML-MML-LHM" },
  { code: "POOR", pattern: "HHL-MLH-LMH-HHH-LHL" },
  { code: "MONK", pattern: "HHL-LLH-LLM-MML-LHM" },
  { code: "IMSB", pattern: "LLM-LMM-LLL-LLL-MLM" },
  { code: "SOLO", pattern: "LML-LLH-LHL-LML-LHM" },
  { code: "FUCK", pattern: "MLL-LHL-LLM-MLL-HLH" },
  { code: "DEAD", pattern: "LLL-LLM-LML-LLL-LHM" },
  { code: "IMFW", pattern: "LLH-LHL-LML-LLL-MLL" },
] as const;

export const SBTI_TEST_DIMENSIONS: Record<SbtiTestDimensionKey, SbtiDimensionMeta> = {
  S1: {
    name: "S1 自尊自信",
    model: "自我模型",
    levels: {
      L: "对自己下手比别人还狠，夸你两句你都想先验明真伪。",
      M: "自信值随天气波动，顺风能飞，逆风先缩。",
      H: "心里对自己大致有数，不太会被路人一句话打散。",
    },
  },
  S2: {
    name: "S2 自我清晰度",
    model: "自我模型",
    levels: {
      L: "内心频道雪花较多，常在“我是谁”里循环缓存。",
      M: "平时还能认出自己，偶尔也会被情绪临时换号。",
      H: "对自己的脾气、欲望和底线都算门儿清。",
    },
  },
  S3: {
    name: "S3 核心价值",
    model: "自我模型",
    levels: {
      L: "更在意舒服和安全，没必要天天给人生开冲刺模式。",
      M: "想上进，也想躺会儿，价值排序经常内部开会。",
      H: "很容易被目标、成长或某种重要信念推着往前。",
    },
  },
  E1: {
    name: "E1 依恋安全感",
    model: "情感模型",
    levels: {
      L: "感情里警报器灵敏，已读不回都能脑补到大结局。",
      M: "一半信任，一半试探，感情里常在心里拉锯。",
      H: "更愿意相信关系本身，不会被一点风吹草动吓散。",
    },
  },
  E2: {
    name: "E2 情感投入度",
    model: "情感模型",
    levels: {
      L: "感情投入偏克制，心门不是没开，是门禁太严。",
      M: "会投入，但会给自己留后手，不至于全盘梭哈。",
      H: "一旦认定就容易认真，情绪和精力都给得很足。",
    },
  },
  E3: {
    name: "E3 边界与依赖",
    model: "情感模型",
    levels: {
      L: "容易黏人也容易被黏，关系里的温度感很重要。",
      M: "亲密和独立都要一点，属于可调节型依赖。",
      H: "空间感很重要，再爱也得留一块属于自己的地。",
    },
  },
  A1: {
    name: "A1 世界观倾向",
    model: "态度模型",
    levels: {
      L: "看世界自带防御滤镜，先怀疑，再靠近。",
      M: "既不天真也不彻底阴谋论，观望是你的本能。",
      H: "更愿意相信人性和善意，遇事不急着把世界判死刑。",
    },
  },
  A2: {
    name: "A2 规则与灵活度",
    model: "态度模型",
    levels: {
      L: "规则能绕就绕，舒服和自由往往排在前面。",
      M: "该守的时候守，该变通的时候也不死磕。",
      H: "秩序感较强，能按流程来就不爱即兴炸场。",
    },
  },
  A3: {
    name: "A3 人生意义感",
    model: "态度模型",
    levels: {
      L: "意义感偏低，容易觉得很多事都像在走过场。",
      M: "偶尔有目标，偶尔也想摆烂，人生观处于半开机。",
      H: "做事更有方向，知道自己大概要往哪边走。",
    },
  },
  Ac1: {
    name: "Ac1 动机导向",
    model: "行动驱力模型",
    levels: {
      L: "做事先考虑别翻车，避险系统比野心更先启动。",
      M: "有时想赢，有时只想别麻烦，动机比较混合。",
      H: "更容易被成果、成长和推进感点燃。",
    },
  },
  Ac2: {
    name: "Ac2 决策风格",
    model: "行动驱力模型",
    levels: {
      L: "做决定前容易多转几圈，脑内会议常常超时。",
      M: "会想，但不至于想死机，属于正常犹豫。",
      H: "拍板速度快，决定一下就不爱回头磨叽。",
    },
  },
  Ac3: {
    name: "Ac3 执行模式",
    model: "行动驱力模型",
    levels: {
      L: "执行力和死线有深厚感情，越晚越像要觉醒。",
      M: "能做，但状态看时机，偶尔稳偶尔摆。",
      H: "推进欲比较强，事情不落地心里都像卡了根刺。",
    },
  },
  So1: {
    name: "So1 社交主动性",
    model: "社交模型",
    levels: {
      L: "社交启动慢热，主动出击这事通常得攒半天气。",
      M: "有人来就接，没人来也不硬凑，社交弹性一般。",
      H: "更愿意主动打开场子，在人群里不太怕露头。",
    },
  },
  So2: {
    name: "So2 人际边界感",
    model: "社交模型",
    levels: {
      L: "关系里更想亲近和融合，熟了就容易把人划进内圈。",
      M: "既想亲近又想留缝，边界感看对象调节。",
      H: "边界感偏强，靠太近会先本能性后退半步。",
    },
  },
  So3: {
    name: "So3 表达与真实度",
    model: "社交模型",
    levels: {
      L: "表达更直接，心里有啥基本不爱绕。",
      M: "会看气氛说话，真实和体面通常各留一点。",
      H: "对不同场景的自我切换更熟练，真实感会分层发放。",
    },
  },
};

export const SBTI_TEST_QUESTION_BANK: readonly SbtiTestQuestion[] = [
  {
    id: "sbti-test-s1",
    dimension: "S1",
    prompt: "面对比较、质疑或被调侃时，他更接近哪一档？",
    options: [
      { key: "A", label: "很容易先否定自己", value: 1 },
      { key: "B", label: "状态会波动，看场景", value: 2 },
      { key: "C", label: "对自己大致有数，不容易被一句话打散", value: 3 },
    ],
  },
  {
    id: "sbti-test-s2",
    dimension: "S2",
    prompt: "谈到自己是谁、要什么、讨厌什么时，他更像：",
    options: [
      { key: "A", label: "经常模糊和摇摆", value: 1 },
      { key: "B", label: "平时清楚，情绪上来会乱", value: 2 },
      { key: "C", label: "比较清楚自己的脾气、欲望和底线", value: 3 },
    ],
  },
  {
    id: "sbti-test-s3",
    dimension: "S3",
    prompt: "关于成长和往上走这件事，他更常见的底色是：",
    options: [
      { key: "A", label: "更在意稳定舒服，不爱持续冲刺", value: 1 },
      { key: "B", label: "想往上，也常想歇会", value: 2 },
      { key: "C", label: "很容易被目标、成长或信念推着往前", value: 3 },
    ],
  },
  {
    id: "sbti-test-e1",
    dimension: "E1",
    prompt: "在关系里，遇到延迟回应或信号变弱时，他更像：",
    options: [
      { key: "A", label: "警报器很灵，容易脑补最坏情况", value: 1 },
      { key: "B", label: "信任和试探会反复拉扯", value: 2 },
      { key: "C", label: "更愿意先相信关系本身", value: 3 },
    ],
  },
  {
    id: "sbti-test-e2",
    dimension: "E2",
    prompt: "一旦在意一个人，他的投入方式更像：",
    options: [
      { key: "A", label: "偏克制，心门开得慢", value: 1 },
      { key: "B", label: "会投入，但仍给自己留后手", value: 2 },
      { key: "C", label: "一旦认定就会认真投入", value: 3 },
    ],
  },
  {
    id: "sbti-test-e3",
    dimension: "E3",
    prompt: "亲密和空间之间，他更偏向：",
    options: [
      { key: "A", label: "更想贴近，温度感很重要", value: 1 },
      { key: "B", label: "亲密和独立都要一点", value: 2 },
      { key: "C", label: "空间感很重要，再亲密也要留白", value: 3 },
    ],
  },
  {
    id: "sbti-test-a1",
    dimension: "A1",
    prompt: "看待人和世界时，他更自然的默认值是：",
    options: [
      { key: "A", label: "先防御、先怀疑", value: 1 },
      { key: "B", label: "先观察，不轻信也不极端", value: 2 },
      { key: "C", label: "更愿意相信善意和可能性", value: 3 },
    ],
  },
  {
    id: "sbti-test-a2",
    dimension: "A2",
    prompt: "面对规则、流程和边界时，他更像：",
    options: [
      { key: "A", label: "能绕就绕，舒服自由优先", value: 1 },
      { key: "B", label: "该守守，该变通变通", value: 2 },
      { key: "C", label: "秩序感较强，能按流程就按流程", value: 3 },
    ],
  },
  {
    id: "sbti-test-a3",
    dimension: "A3",
    prompt: "谈到人生方向和意义感时，他更接近：",
    options: [
      { key: "A", label: "很多事像走过场，意义感偏低", value: 1 },
      { key: "B", label: "偶尔清醒，偶尔摆烂", value: 2 },
      { key: "C", label: "做事更有方向感，知道大概要去哪", value: 3 },
    ],
  },
  {
    id: "sbti-test-ac1",
    dimension: "Ac1",
    prompt: "开始做一件事时，他更常被什么驱动：",
    options: [
      { key: "A", label: "先避险，先别翻车", value: 1 },
      { key: "B", label: "想赢，也想少麻烦", value: 2 },
      { key: "C", label: "更容易被成果、成长、推进感点燃", value: 3 },
    ],
  },
  {
    id: "sbti-test-ac2",
    dimension: "Ac2",
    prompt: "做决定时，他更像：",
    options: [
      { key: "A", label: "脑内会议常超时", value: 1 },
      { key: "B", label: "会想一想，但不会想死机", value: 2 },
      { key: "C", label: "拍板快，定了就不爱回头", value: 3 },
    ],
  },
  {
    id: "sbti-test-ac3",
    dimension: "Ac3",
    prompt: "真正落到执行上，他更常见的状态是：",
    options: [
      { key: "A", label: "容易拖到死线才醒", value: 1 },
      { key: "B", label: "能做，但看时机和状态", value: 2 },
      { key: "C", label: "推进欲强，不落地会一直惦记", value: 3 },
    ],
  },
  {
    id: "sbti-test-so1",
    dimension: "So1",
    prompt: "陌生场合或新关系里，他的社交起手更像：",
    options: [
      { key: "A", label: "慢热，被动，需要攒气", value: 1 },
      { key: "B", label: "有人来就接，没人来也不硬凑", value: 2 },
      { key: "C", label: "愿意主动打开场子", value: 3 },
    ],
  },
  {
    id: "sbti-test-so2",
    dimension: "So2",
    prompt: "熟络之后的人际距离，他更接近：",
    options: [
      { key: "A", label: "更想融合，容易把人划进内圈", value: 1 },
      { key: "B", label: "亲近和留缝都会有", value: 2 },
      { key: "C", label: "边界感偏强，靠太近会先退半步", value: 3 },
    ],
  },
  {
    id: "sbti-test-so3",
    dimension: "So3",
    prompt: "表达真实想法时，他更像：",
    options: [
      { key: "A", label: "更直接，不爱绕", value: 1 },
      { key: "B", label: "看气氛留一点余地", value: 2 },
      { key: "C", label: "很会按场景分层表达自己", value: 3 },
    ],
  },
] as const;

function scoreAnswer(answer: PersonalityAnswer["answer"]) {
  if (answer === "C") return 3;
  if (answer === "B") return 2;
  return 1;
}

function scoreToLevel(score: number): SbtiTestLevel {
  if (score <= 1) return "L";
  if (score === 2) return "M";
  return "H";
}

function levelToNumber(level: SbtiTestLevel) {
  return level === "L" ? 1 : level === "M" ? 2 : 3;
}

function parsePattern(pattern: string): SbtiTestLevel[] {
  return pattern.replaceAll("-", "").split("") as SbtiTestLevel[];
}

function briefText(input: string) {
  return input.split(/[，。]/)[0]?.trim() ?? input.trim();
}

function levelsSummary(levels: Record<SbtiTestDimensionKey, SbtiTestLevel>) {
  return SBTI_TEST_DIMENSION_ORDER
    .map((dimension) => ({
      dimension,
      level: levels[dimension],
      weight: levels[dimension] === "M" ? 0 : 1,
    }))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3)
    .map(({ dimension, level }) => {
      const meta = SBTI_TEST_DIMENSIONS[dimension];
      const name = meta.name.replace(/^[A-Za-z0-9]+\s*/, "");
      return `${name}：${briefText(meta.levels[level])}`;
    })
    .join("；");
}

export function isSbtiTestCode(code: string): code is SbtiTestCode {
  return SBTI_TEST_RESULT_CODES.includes(code as SbtiTestCode);
}

export function getSbtiTestTypeMeta(code: string) {
  if (!isSbtiTestCode(code)) return null;
  return {
    code,
    ...SBTI_TEST_TYPE_LIBRARY[code],
  };
}

export function levelFromSbtiAnswer(answer: PersonalityAnswer["answer"]): SbtiTestLevel {
  return scoreToLevel(scoreAnswer(answer));
}

export function answerFromSbtiLevel(level: SbtiTestLevel): PersonalityAnswer["answer"] {
  if (level === "H") return "C";
  if (level === "M") return "B";
  return "A";
}

export function scoreSbtiTestAnswers(
  answers: PersonalityAnswer[],
  fallback?: Partial<Record<SbtiTestDimensionKey, SbtiTestLevel>>,
) {
  const answerMap = new Map(answers.map((item) => [item.id, item] as const));
  const levels = {} as Record<SbtiTestDimensionKey, SbtiTestLevel>;

  for (const question of SBTI_TEST_QUESTION_BANK) {
    const answer = answerMap.get(question.id);
    levels[question.dimension] =
      answer ? levelFromSbtiAnswer(answer.answer) : fallback?.[question.dimension] ?? "M";
  }

  return levels;
}

export function matchSbtiTestType(levels: Record<SbtiTestDimensionKey, SbtiTestLevel>) {
  const userVector = SBTI_TEST_DIMENSION_ORDER.map((dimension) => levelToNumber(levels[dimension]));
  const ranked = SBTI_TEST_NORMAL_TYPES.map((type) => {
    const vector = parsePattern(type.pattern).map(levelToNumber);
    let distance = 0;
    let exact = 0;

    for (let index = 0; index < vector.length; index += 1) {
      const diff = Math.abs(userVector[index] - vector[index]);
      distance += diff;
      if (diff === 0) exact += 1;
    }

    const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));
    return {
      ...type,
      ...SBTI_TEST_TYPE_LIBRARY[type.code],
      distance,
      exact,
      similarity,
    };
  }).sort((left, right) => {
    if (left.distance !== right.distance) return left.distance - right.distance;
    if (right.exact !== left.exact) return right.exact - left.exact;
    return right.similarity - left.similarity;
  });

  const bestNormal = ranked[0];
  if (!bestNormal) {
    const fallback = SBTI_TEST_TYPE_LIBRARY.HHHH;
    return {
      code: "HHHH" as const,
      title: fallback.title,
      intro: fallback.intro,
      imagePath: fallback.imagePath,
      pattern: "",
      similarity: 0,
      badge: "标准人格库未命中",
    };
  }

  if (bestNormal.similarity < 60) {
    const fallback = SBTI_TEST_TYPE_LIBRARY.HHHH;
    return {
      code: "HHHH" as const,
      title: fallback.title,
      intro: fallback.intro,
      imagePath: fallback.imagePath,
      pattern: "",
      similarity: bestNormal.similarity,
      badge: `标准人格库最高匹配仅 ${bestNormal.similarity}%`,
    };
  }

  return {
    code: bestNormal.code,
    title: bestNormal.title,
    intro: bestNormal.intro,
    imagePath: bestNormal.imagePath,
    pattern: bestNormal.pattern,
    similarity: bestNormal.similarity,
    badge: `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/15 维`,
  };
}

export function buildSbtiTestResult(
  answers: PersonalityAnswer[],
  fallback?: Partial<Record<SbtiTestDimensionKey, SbtiTestLevel>>,
): SbtiArchetype {
  const levels = scoreSbtiTestAnswers(answers, fallback);
  const matched = matchSbtiTestType(levels);
  const summarySeed = levelsSummary(levels);

  return {
    code: matched.code,
    title: matched.title,
    summary: summarySeed
      ? `${summarySeed}。`
      : "15 维人格向量已经完成匹配。",
    meme: matched.intro,
    imagePath: matched.imagePath,
    badge: matched.badge,
    similarity: matched.similarity,
    pattern: matched.pattern,
    levels,
  };
}

export function sbtiLevelsFromHeuristics(input: {
  shipVelocity: number;
  ambiguityFit: number;
  feedbackEnergy: number;
  syncRhythm: number;
  goalsCount: number;
  languagesCount: number;
  evidenceCount: number;
}) {
  const {
    shipVelocity,
    ambiguityFit,
    feedbackEnergy,
    syncRhythm,
    goalsCount,
    languagesCount,
    evidenceCount,
  } = input;

  const decide = (score: number, high = 62, low = 42): SbtiTestLevel => {
    if (score >= high) return "H";
    if (score <= low) return "L";
    return "M";
  };

  return {
    S1: decide(44 + evidenceCount * 10 + goalsCount * 4, 66, 38),
    S2: decide(46 + goalsCount * 8 + languagesCount * 3, 66, 38),
    S3: decide(32 + shipVelocity * 0.6 + goalsCount * 10, 66, 38),
    E1: decide(94 - syncRhythm * 0.7 - ambiguityFit * 0.2, 66, 38),
    E2: decide(28 + syncRhythm * 0.45 + feedbackEnergy * 0.18, 66, 38),
    E3: decide(96 - syncRhythm * 0.8, 66, 38),
    A1: decide(30 + ambiguityFit * 0.35 + feedbackEnergy * 0.12, 66, 38),
    A2: decide(102 - ambiguityFit * 0.75, 66, 38),
    A3: decide(28 + shipVelocity * 0.38 + goalsCount * 12, 66, 38),
    Ac1: decide(20 + shipVelocity * 0.55 + ambiguityFit * 0.2, 66, 38),
    Ac2: decide(30 + shipVelocity * 0.5 + feedbackEnergy * 0.25, 66, 38),
    Ac3: decide(18 + shipVelocity * 0.78, 66, 38),
    So1: decide(18 + syncRhythm * 0.8, 66, 38),
    So2: decide(95 - syncRhythm * 0.75, 66, 38),
    So3: decide(104 - feedbackEnergy * 0.82, 66, 38),
  } satisfies Record<SbtiTestDimensionKey, SbtiTestLevel>;
}

export function scoreSbtiCompatibility(left: SbtiArchetype, right: SbtiArchetype) {
  if (!left.levels || !right.levels) {
    return left.code === right.code ? 5 : 2;
  }

  const exact = SBTI_TEST_DIMENSION_ORDER.filter(
    (dimension) => left.levels?.[dimension] && left.levels?.[dimension] === right.levels?.[dimension],
  ).length;
  const near = SBTI_TEST_DIMENSION_ORDER.filter((dimension) => {
    const leftLevel = left.levels?.[dimension];
    const rightLevel = right.levels?.[dimension];
    if (!leftLevel || !rightLevel || leftLevel === rightLevel) return false;
    return Math.abs(levelToNumber(leftLevel) - levelToNumber(rightLevel)) === 1;
  }).length;

  return clamp(round(exact * 0.45 + near * 0.12), 0, 10);
}
