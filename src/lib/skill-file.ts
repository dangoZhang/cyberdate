import { displayRole, displaySkillName } from "@/lib/display-text";
import type { TwinCard } from "@/lib/types";

export function buildSkillFile(twin: TwinCard) {
  const lines = [
    `# ${twin.alias} 的技能档案`,
    "",
    `生成时间：${twin.generatedAt}`,
    `分享码：${twin.shareCode}`,
    `角色：${displayRole(twin.role)}`,
    "",
    "## 核心技能",
    ...twin.skills.map(
      (skill, index) => `${index + 1}. ${displaySkillName(skill.name)}（${skill.confidence}）`,
    ),
    "",
    "## MBTI",
    `${twin.mbti.code} · ${twin.mbti.label}`,
    twin.mbti.summary,
    "",
    "## SBTI",
    `${twin.sbti.code} · ${twin.sbti.title}`,
    twin.sbti.summary,
    "",
    "## 技能摘要",
    twin.skillProfile?.overview ?? twin.summary,
    ...(twin.skillProfile?.coreStrengths ?? []),
    "",
    "## 人格画像",
    twin.personaProfile?.overview ?? "未生成详细人格画像。",
    ...(twin.personaProfile?.speakingStyle ?? []),
    ...(twin.personaProfile?.collaborationPattern ?? []),
    "",
    "## 记忆线索",
    twin.memoryProfile?.overview ?? "未生成详细记忆线索。",
    ...(twin.memoryProfile?.timeline ?? []),
    "",
    "## 证据片段",
    ...twin.evidence.map(
      (item, index) =>
        `${index + 1}. ${item.quote}（${item.title} · ${item.sourceId}）`,
    ),
  ];

  return lines.join("\n");
}
