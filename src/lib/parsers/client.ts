import { SKILL_KEYWORDS } from "@/lib/constants";
import type {
  EvidenceFragment,
  ParsedSource,
  SignalBundle,
  SignalBundleProfile,
  SkillWeight,
  StyleAxisKey,
} from "@/lib/types";
import { clamp, dedupe, simpleHash } from "@/lib/utils";

const chatLinePattern =
  /^(?:(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+)?(\d{1,2}:\d{2}(?::\d{2})?)\s+([^\n:：]{1,24})[:：]\s*(.+)$/;

function sanitizeText(text: string) {
  return text
    .replace(/\0/g, "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function tokenize(text: string) {
  return sanitizeText(text).toLowerCase();
}

function scoreSkills(text: string, reasonsPrefix: string) {
  const lower = tokenize(text);
  const skills: SkillWeight[] = [];

  for (const [name, keywords] of Object.entries(SKILL_KEYWORDS)) {
    const hits = keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
    if (!hits.length) continue;

    skills.push({
      name,
      score: hits.length * 22 + 20,
      reasons: [`${reasonsPrefix} 命中 ${hits.slice(0, 2).join(" / ")}`],
    });
  }

  return skills;
}

function evidenceFromText(
  sourceId: string,
  title: string,
  text: string,
  skills: SkillWeight[],
) {
  const lines = sanitizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 16);
  const topSkill = skills[0]?.name;

  return lines.slice(0, 4).map(
    (quote, index): EvidenceFragment => ({
      id: `${sourceId}-ev-${index}`,
      sourceId,
      title,
      quote,
      skill: topSkill,
      weight: clamp(64 - index * 8 + (skills[0]?.score ?? 0) / 8, 20, 95),
    }),
  );
}

function collaborationHintsFromText(text: string) {
  const lower = tokenize(text);
  const hints: Partial<Record<StyleAxisKey, number>> = {
    shipVelocity: 52,
    ambiguityFit: 50,
    feedbackEnergy: 48,
    syncRhythm: 52,
  };

  const apply = (
    axis: StyleAxisKey,
    keywords: string[],
    weight: number,
    fallbackWeight = 0,
  ) => {
    const hits = keywords.filter((keyword) => lower.includes(keyword));
    hints[axis] = (hints[axis] ?? 50) + hits.length * weight + fallbackWeight;
  };

  apply("shipVelocity", ["ship", "launch", "demo", "mvp", "上线"], 8);
  apply("shipVelocity", ["research", "audit", "analyze", "调研"], -5);
  apply("ambiguityFit", ["idea", "prototype", "探索", "模糊"], 7);
  apply("ambiguityFit", ["schema", "spec", "边界", "约束"], -4);
  apply("feedbackEnergy", ["feedback", "review", "critique", "复盘"], 6);
  apply("feedbackEnergy", ["gentle", "soft", "照顾"], -4);
  apply("syncRhythm", ["async", "document", "notion", "文档"], -6);
  apply("syncRhythm", ["call", "sync", "workshop", "群里"], 6);

  return Object.fromEntries(
    Object.entries(hints).map(([key, value]) => [key, clamp(value ?? 50, 12, 92)]),
  ) as Record<StyleAxisKey, number>;
}

function baseSource(
  id: string,
  kind: ParsedSource["kind"],
  title: string,
  excerpt: string,
  stats: Record<string, number | string>,
  skills: SkillWeight[],
) {
  return {
    id,
    kind,
    title,
    excerpt,
    stats,
    skills,
    evidence: evidenceFromText(id, title, excerpt, skills),
    collaborationHints: collaborationHintsFromText(excerpt),
  } satisfies ParsedSource;
}

function parseMarkdownText(id: string, title: string, content: string) {
  const excerpt = sanitizeText(content).slice(0, 1400);
  const skills = scoreSkills(excerpt, title);

  return baseSource(
    id,
    title.toLowerCase().endsWith(".md") ? "markdown" : "text",
    title,
    excerpt,
    {
      characters: excerpt.length,
      headings: (content.match(/^#+\s+/gm) ?? []).length,
    },
    skills,
  );
}

export function parseManualInput(title: string, content: string) {
  return parseMarkdownText(`src-manual-${simpleHash(`${title}-${content}`)}`, title, content);
}

function analyzeChatLog(id: string, title: string, content: string) {
  const lines = sanitizeText(content).split("\n");
  const speakers = new Set<string>();
  const activeHours = new Array<number>();
  let messageCount = 0;
  let matches = 0;

  lines.forEach((line) => {
    const match = line.match(chatLinePattern);
    if (!match) return;
    matches += 1;
    messageCount += 1;
    speakers.add(match[3]);
    const hour = Number(match[2].slice(0, 2));
    if (!Number.isNaN(hour)) activeHours.push(hour);
  });

  const excerpt = lines.slice(0, 40).join("\n").slice(0, 1400);
  const skills = scoreSkills(excerpt, `${title} 聊天记录`);
  skills.push({
    name: "Collaboration Signal",
    score: 68,
    reasons: ["聊天记录能反映协作语气、反馈方式和活跃时间"],
  });

  return {
    ...baseSource(id, "chat", title, excerpt, {
      messageCount,
      matchedLines: matches,
      speakers: speakers.size,
      activeWindow:
        activeHours.length > 0
          ? `${Math.min(...activeHours)}:00-${Math.max(...activeHours)}:00`
          : "unknown",
    }, skills),
    collaborationHints: {
      shipVelocity: activeHours.some((hour) => hour >= 22) ? 62 : 54,
      ambiguityFit: 58,
      feedbackEnergy: title.includes("review") ? 66 : 56,
      syncRhythm: speakers.size > 2 ? 64 : 50,
    },
  } satisfies ParsedSource;
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data, disableWorker: true } as never).promise;
  const maxPages = Math.min(pdf.numPages, 4);
  const chunks: string[] = [];

  for (let pageIndex = 1; pageIndex <= maxPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    chunks.push(
      textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }

  return sanitizeText(chunks.join("\n"));
}

async function extractImageSignals(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = objectUrl;
  });

  let text = "";
  try {
    const Tesseract = await import("tesseract.js");
    const result = await Promise.race([
      Tesseract.recognize(file, "eng+chi_sim", {
        logger: () => undefined,
      }),
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 12_000);
      }),
    ]);
    if (!result) {
      text = "";
    } else {
      text = sanitizeText(result.data.text).slice(0, 1000);
    }
  } catch {
    text = "";
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return {
    width: image.width,
    height: image.height,
    text,
  };
}

function fileTypeFor(file: File) {
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(md|mdx)$/.test(lower)) return "markdown";
  if (/\.(png|jpg|jpeg|webp)$/.test(lower)) return "image";
  if (/\.(txt|csv|json|html|htm)$/.test(lower)) return "chat";
  return "text";
}

export async function parseFile(file: File): Promise<ParsedSource> {
  const id = `src-${simpleHash(`${file.name}-${file.size}-${file.lastModified}`)}`;
  const type = fileTypeFor(file);

  if (type === "pdf") {
    let text = "";
    try {
      text = await extractPdfText(file);
    } catch {
      text = `${file.name} PDF，暂时未能提取文本，保留文件级信号。`;
    }
    return baseSource(
      id,
      "pdf",
      file.name,
      text,
      {
        pagesPreviewed: 4,
        bytes: file.size,
      },
      scoreSkills(text, `${file.name} PDF`),
    );
  }

  if (type === "image") {
    const signal = await extractImageSignals(file);
    const excerpt = signal.text
      ? signal.text
      : `${file.name}，尺寸 ${signal.width}x${signal.height}，未抽到 OCR 文本。`;
    return baseSource(
      id,
      "image",
      file.name,
      excerpt,
      {
        width: signal.width,
        height: signal.height,
        bytes: file.size,
      },
      scoreSkills(excerpt, `${file.name} 图片 OCR`),
    );
  }

  const text = await file.text();
  if (type === "chat") {
    return analyzeChatLog(id, file.name, text);
  }

  return parseMarkdownText(id, file.name, text);
}

async function fetchGitHubJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }

  return (await response.json()) as T;
}

function parseRepoUrl(input: string) {
  const match = input
    .trim()
    .match(/github\.com\/([^/\s]+)\/([^/\s#?]+)(?:\/|$)/i);

  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

async function fetchTextFromDownloadUrl(downloadUrl?: string | null) {
  if (!downloadUrl) return "";
  const response = await fetch(downloadUrl);
  if (!response.ok) return "";
  return sanitizeText(await response.text());
}

export async function parseGithubRepo(repoUrl: string) {
  const parsed = parseRepoUrl(repoUrl);
  if (!parsed) {
    throw new Error("GitHub 仓库链接格式无效");
  }

  const repo = await fetchGitHubJson<{
    description: string | null;
    default_branch: string;
    stargazers_count: number;
    html_url: string;
  }>(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);

  const [readmeMeta, tree, languages] = await Promise.all([
    fetchGitHubJson<{ download_url?: string }>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
    ).catch(() => ({ download_url: "" })),
    fetchGitHubJson<{ tree: Array<{ path: string; type: string }> }>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${repo.default_branch}?recursive=1`,
    ),
    fetchGitHubJson<Record<string, number>>(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/languages`,
    ),
  ]);

  const [readmeText, packageText, requirementsText] = await Promise.all([
    fetchTextFromDownloadUrl(readmeMeta.download_url),
    fetchTextFromDownloadUrl(
      `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${repo.default_branch}/package.json`,
    ),
    fetchTextFromDownloadUrl(
      `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${repo.default_branch}/requirements.txt`,
    ),
  ]);

  const depSource = [packageText, requirementsText].join("\n");
  const languagesList = Object.keys(languages);
  const topTreeEntries = tree.tree
    .filter((item) => item.type === "blob")
    .slice(0, 60)
    .map((item) => item.path)
    .join(", ");

  const excerpt = sanitizeText(
    [
      repo.description ?? "",
      readmeText.slice(0, 900),
      depSource.slice(0, 420),
      topTreeEntries.slice(0, 320),
    ].join("\n"),
  );

  const skills = scoreSkills(excerpt, `${parsed.owner}/${parsed.repo} repo`);
  languagesList.forEach((language) => {
    skills.push({
      name:
        language === "TypeScript"
          ? "Frontend Systems"
          : language === "Python"
            ? "AI Workflow"
            : "Backend APIs",
      score: 12,
      reasons: [`GitHub languages 命中 ${language}`],
    });
  });

  return baseSource(
    `src-github-${parsed.owner}-${parsed.repo}`,
    "github",
    `${parsed.owner}/${parsed.repo}`,
    excerpt,
    {
      stars: repo.stargazers_count,
      filesPreviewed: tree.tree.length,
      languages: languagesList.join(", "),
    },
    skills,
  );
}

export function buildSignalBundle(
  profile: SignalBundleProfile,
  sources: ParsedSource[],
) {
  const candidateSkills = sources.flatMap((source) => source.skills);
  const evidencePool = sources.flatMap((source) => source.evidence);
  const collaborationHints: Record<StyleAxisKey, number> = {
    shipVelocity: 0,
    ambiguityFit: 0,
    feedbackEnergy: 0,
    syncRhythm: 0,
  };

  sources.forEach((source) => {
    (Object.keys(collaborationHints) as StyleAxisKey[]).forEach((axis) => {
      collaborationHints[axis] += source.collaborationHints[axis] ?? 0;
    });
  });

  const divisor = Math.max(sources.length, 1);
  (Object.keys(collaborationHints) as StyleAxisKey[]).forEach((axis) => {
    collaborationHints[axis] = clamp(
      collaborationHints[axis] / divisor || 50,
      12,
      92,
    );
  });

  return {
    version: "1",
    profile: {
      ...profile,
      goals: dedupe(profile.goals.filter(Boolean)),
      languages: dedupe(profile.languages.filter(Boolean)),
    },
    sources,
    candidateSkills,
    evidencePool,
    collaborationHints,
    zeroRawRetention: true,
    zeroRawLogging: true,
    createdAt: new Date().toISOString(),
  } satisfies SignalBundle;
}
