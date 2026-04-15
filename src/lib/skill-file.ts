import { displayRole, displaySkillName } from "@/lib/display-text";
import type { TwinCard } from "@/lib/types";

export function buildSkillFile(twin: TwinCard) {
  const labels = twin.exSkill?.labels;
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
    "## ex-skill 标签",
    `依恋类型：${labels?.attachmentStyle ?? "待补充"}`,
    `爱的语言：${labels?.loveLanguages.join(" · ") || "待补充"}`,
    `性格标签：${labels?.traitTags.join(" · ") || "待补充"}`,
    `星座：${labels?.zodiac ?? "待补充"}`,
    `MBTI 64 子型：${labels?.mbti64.code ?? "待补充"} · ${labels?.mbti64.label ?? "待补充"}`,
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
    "## Relationship Memory",
    twin.exSkill?.relationshipMemory ?? "未生成 Relationship Memory。",
    "",
    "## Persona",
    twin.exSkill?.persona ?? "未生成 Persona。",
    "",
    "## 证据片段",
    ...twin.evidence.map(
      (item, index) =>
        `${index + 1}. ${item.quote}（${item.title} · ${item.sourceId}）`,
    ),
  ];

  return lines.join("\n");
}
