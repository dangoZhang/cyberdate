import { getMbtiGuide, getSbtiGuide } from "@/lib/personality-guide";
import type {
  PersonalityAnswer,
  QuizResult,
  SbtiArchetype,
} from "@/lib/types";

type MbtiDimension = readonly ["E", "I"] | readonly ["S", "N"] | readonly ["T", "F"] | readonly ["J", "P"];
type SbtiDimension = readonly ["S", "D"] | readonly ["B", "A"] | readonly ["T", "R"] | readonly ["I", "S"];

type QuestionPair<TDimension extends readonly [string, string]> = {
  id: string;
  dimension: TDimension;
  prompt: string;
  options: readonly [string, string];
};

export const MBTI_QUESTION_BANK: QuestionPair<MbtiDimension>[] = [
  {
    id: "mbti-ei-1",
    dimension: ["E", "I"],
    prompt: "要开一个新项目时，他更自然的起手动作是：",
    options: ["先把想法抛出来拉人讨论", "先自己整理成型再拿出来"],
  },
  {
    id: "mbti-ei-2",
    dimension: ["E", "I"],
    prompt: "遇到卡点时，他更常见的处理方式是：",
    options: ["一边聊一边把解法试出来", "先独立消化，再带方案回来"],
  },
  {
    id: "mbti-sn-1",
    dimension: ["S", "N"],
    prompt: "看一份陌生材料时，他更先抓的是：",
    options: ["已经发生的事实和约束", "潜在方向、趋势和模式"],
  },
  {
    id: "mbti-sn-2",
    dimension: ["S", "N"],
    prompt: "做判断时，他更依赖：",
    options: ["现成证据、案例和细节", "抽象理解和跨场景联想"],
  },
  {
    id: "mbti-tf-1",
    dimension: ["T", "F"],
    prompt: "给别人反馈时，他默认更像：",
    options: ["先讲结论、问题和代价", "先照顾感受，再推进结论"],
  },
  {
    id: "mbti-tf-2",
    dimension: ["T", "F"],
    prompt: "做取舍时，他更优先考虑：",
    options: ["逻辑闭环和效率", "关系感受和团队气氛"],
  },
  {
    id: "mbti-jp-1",
    dimension: ["J", "P"],
    prompt: "面对多线程任务时，他更舒服的状态是：",
    options: ["先排优先级和里程碑", "边做边调，给自己留机动空间"],
  },
  {
    id: "mbti-jp-2",
    dimension: ["J", "P"],
    prompt: "离上线很近时，他更像：",
    options: ["锁住方案按清单推进", "继续试更好的做法直到最后"],
  },
];

export const SBTI_QUESTION_BANK: QuestionPair<SbtiDimension>[] = [
  {
    id: "sbti-sd-1",
    dimension: ["S", "D"],
    prompt: "面对模糊目标时，他更常见的动作是：",
    options: ["先压出能跑的最小版本", "先把边界和方案想清楚"],
  },
  {
    id: "sbti-sd-2",
    dimension: ["S", "D"],
    prompt: "要证明一个想法可行时，他更偏向：",
    options: ["尽快做演示拿反馈", "先推演风险再决定要不要做"],
  },
  {
    id: "sbti-ba-1",
    dimension: ["B", "A"],
    prompt: "信息不完整时，他更可能：",
    options: ["先往前拱，边做边补约束", "先补证据，再进入执行"],
  },
  {
    id: "sbti-ba-2",
    dimension: ["B", "A"],
    prompt: "遇到未知问题时，他更像：",
    options: ["先试一个方向再收束", "先把变量列清楚再出手"],
  },
  {
    id: "sbti-tr-1",
    dimension: ["T", "R"],
    prompt: "在协作里指出问题时，他更像：",
    options: ["直说核心问题，不绕", "先观察语境，再留余地表达"],
  },
  {
    id: "sbti-tr-2",
    dimension: ["T", "R"],
    prompt: "面对分歧时，他更容易：",
    options: ["快速抛出判断和立场", "先消化，再给出态度"],
  },
  {
    id: "sbti-is-1",
    dimension: ["I", "S"],
    prompt: "默认工作节奏上，他更适合：",
    options: ["低打扰、强异步推进", "边聊边改、高频同步"],
  },
  {
    id: "sbti-is-2",
    dimension: ["I", "S"],
    prompt: "合作推进方式上，他更舒服的是：",
    options: ["各自推进，关键节点对齐", "持续共创，随时同步状态"],
  },
];

function tallyAnswers(
  answers: PersonalityAnswer[],
  bank: QuestionPair<readonly [string, string]>[],
) {
  const score = new Map<string, number>();

  for (const item of bank) {
    const answer = answers.find((candidate) => candidate.id === item.id)?.answer;
    const winner = answer === "B" ? item.dimension[1] : item.dimension[0];
    score.set(winner, (score.get(winner) ?? 0) + 1);
  }

  return score;
}

function choosePair(
  score: Map<string, number>,
  pair: readonly [string, string],
  fallback: string,
) {
  const left = score.get(pair[0]) ?? 0;
  const right = score.get(pair[1]) ?? 0;
  if (left === right) return fallback;
  return left > right ? pair[0] : pair[1];
}

export function scoreMbtiAnswers(
  answers: PersonalityAnswer[],
  fallback: readonly [string, string, string, string],
) {
  const score = tallyAnswers(answers, MBTI_QUESTION_BANK);
  const code = [
    choosePair(score, ["E", "I"], fallback[0]),
    choosePair(score, ["S", "N"], fallback[1]),
    choosePair(score, ["T", "F"], fallback[2]),
    choosePair(score, ["J", "P"], fallback[3]),
  ].join("");
  return code;
}

export function scoreSbtiAnswers(
  answers: PersonalityAnswer[],
  fallback: readonly [string, string, string, string],
) {
  const score = tallyAnswers(answers, SBTI_QUESTION_BANK);
  const code = [
    choosePair(score, ["S", "D"], fallback[0]),
    choosePair(score, ["B", "A"], fallback[1]),
    choosePair(score, ["T", "R"], fallback[2]),
    choosePair(score, ["I", "S"], fallback[3]),
  ].join("");
  return code;
}

export function buildMbtiResult(code: string, answers: PersonalityAnswer[]): QuizResult {
  const guide = getMbtiGuide(code);
  const reasons = answers
    .map((item) => item.rationale.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return {
    code,
    label: guide?.title ?? `${code} 型`,
    summary: reasons || guide?.description || `${code} 型倾向来自素材中的稳定协作与表达模式。`,
  };
}

export function buildSbtiResult(code: string, answers: PersonalityAnswer[]): SbtiArchetype {
  const guide = getSbtiGuide(code);
  const reasons = answers
    .map((item) => item.rationale.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");

  return {
    code,
    title: guide?.title ?? `${code} 型`,
    summary: reasons || guide?.description || `${code} 型协作人格来自素材中的推进方式和交流习惯。`,
    meme: guide?.subtitle ?? "这是一张偏娱乐化的协作人格卡。",
  };
}
