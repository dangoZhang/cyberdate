import { strFromU8, unzipSync } from "fflate";

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

const chatLinePatterns = [
  /^(?:(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+)?(\d{1,2}:\d{2}(?::\d{2})?)\s+([^\n:：]{1,32})[:：]\s*(.+)$/,
  /^\[(\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^\n:：]{1,32})[:：]\s*(.+)$/,
  /^([^\n:：]{1,32})\s+\((\d{4}[-/]\d{1,2}[-/]\d{1,2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\)[:：]?\s*(.+)$/,
  /^([^\n:：]{1,32})[:：]\s*(.+)$/,
] as const;

const ARCHIVE_ENTRY_LIMIT = 24;
const ARCHIVE_ENTRY_BYTES_LIMIT = 2 * 1024 * 1024;
const ARCHIVE_TOTAL_BYTES_LIMIT = 12 * 1024 * 1024;

export type ParseUploadOptions = {
  archiveDepth?: number;
};

type UploadFileKind =
  | "zip"
  | "pdf"
  | "markdown"
  | "image"
  | "chat"
  | "text";

type ParsedChatEntry = {
  speaker: string;
  message: string;
  hour: number | null;
  timestamp?: string;
};

const wechatTxtHeaderPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+)$/;
const qqTxtHeaderPattern = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(.+?)(?:\((\d+)\))?\s*$/;

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

function normalizeSpeakerName(value: string) {
  return sanitizeText(value)
    .toLowerCase()
    .replace(/[\s"'“”‘’()[\]{}<>._-]+/g, "");
}

const AUTO_SELF_SPEAKERS = new Set(
  dedupe(["我", "自己", "本人", "me", "myself", "self", "owner", "user"].map(normalizeSpeakerName)),
);

function speakerIsAutoDetectedSelf(speaker: string) {
  const normalizedSpeaker = normalizeSpeakerName(speaker);
  if (!normalizedSpeaker) return false;
  return AUTO_SELF_SPEAKERS.has(normalizedSpeaker);
}

function parseChatLine(line: string): ParsedChatEntry | null {
  const safeLine = line.trim();
  if (!safeLine) return null;

  for (const pattern of chatLinePatterns) {
    const match = safeLine.match(pattern);
    if (!match) continue;

    if (pattern === chatLinePatterns[0] || pattern === chatLinePatterns[1]) {
      const hour = Number(match[2]?.slice(0, 2));
      return {
        speaker: sanitizeText(match[3] ?? ""),
        message: sanitizeText(match[4] ?? ""),
        hour: Number.isNaN(hour) ? null : hour,
        timestamp: `${match[1] ?? ""} ${match[2] ?? ""}`.trim(),
      };
    }

    if (pattern === chatLinePatterns[2]) {
      const hour = Number(match[3]?.slice(0, 2));
      return {
        speaker: sanitizeText(match[1] ?? ""),
        message: sanitizeText(match[4] ?? ""),
        hour: Number.isNaN(hour) ? null : hour,
        timestamp: `${match[2] ?? ""} ${match[3] ?? ""}`.trim(),
      };
    }

    return {
      speaker: sanitizeText(match[1] ?? ""),
      message: sanitizeText(match[2] ?? ""),
      hour: null,
    };
  }

  return null;
}

function parseHourFromTimestamp(value: string) {
  const match = value.match(/\b(\d{1,2}):\d{2}(?::\d{2})?\b/);
  if (!match) return null;
  const hour = Number(match[1]);
  return Number.isNaN(hour) ? null : hour;
}

function parseWechatTxtEntries(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  const entries: ParsedChatEntry[] = [];
  let current: ParsedChatEntry | null = null;

  for (const line of lines) {
    const safeLine = line.trimEnd();
    const match = safeLine.match(wechatTxtHeaderPattern);
    if (match) {
      if (current?.message.trim()) {
        current.message = sanitizeText(current.message);
        entries.push(current);
      }
      current = {
        timestamp: match[1],
        speaker: sanitizeText(match[2]),
        message: "",
        hour: parseHourFromTimestamp(match[1]),
      };
      continue;
    }

    if (!current) continue;
    if (!safeLine.trim()) continue;
    current.message = current.message ? `${current.message}\n${safeLine}` : safeLine;
  }

  if (current?.message.trim()) {
    current.message = sanitizeText(current.message);
    entries.push(current);
  }

  return entries;
}

function parseQqTxtEntries(content: string) {
  const lines = content.replace(/\r/g, "").split("\n");
  const entries: ParsedChatEntry[] = [];
  let current: ParsedChatEntry | null = null;

  for (const line of lines) {
    const safeLine = line.trimEnd();
    const match = safeLine.match(qqTxtHeaderPattern);
    if (match) {
      if (current?.message.trim()) {
        current.message = sanitizeText(current.message);
        entries.push(current);
      }
      current = {
        timestamp: match[1],
        speaker: sanitizeText(match[2]),
        message: "",
        hour: parseHourFromTimestamp(match[1]),
      };
      continue;
    }

    if (!current) continue;
    if (!safeLine.trim() || safeLine.startsWith("===") || safeLine.startsWith("消息")) continue;
    current.message = current.message ? `${current.message}\n${safeLine}` : safeLine;
  }

  if (current?.message.trim()) {
    current.message = sanitizeText(current.message);
    entries.push(current);
  }

  return entries;
}

function parseLiuhenJsonEntries(content: string) {
  try {
    const data = JSON.parse(content) as unknown;
    const list = Array.isArray(data)
      ? data
      : typeof data === "object" && data
        ? ((data as { messages?: unknown; data?: unknown }).messages
          ?? (data as { messages?: unknown; data?: unknown }).data
          ?? [])
        : [];
    if (!Array.isArray(list)) return [];

    return list
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const timestamp = String(
          record.time
          ?? record.timestamp
          ?? record.date
          ?? "",
        ).trim();
        const speaker = sanitizeText(
          String(record.sender ?? record.nickname ?? record.from ?? ""),
        );
        const message = sanitizeText(
          String(record.content ?? record.message ?? record.text ?? ""),
        );
        if (!speaker || !message) return null;
        return {
          timestamp: timestamp || undefined,
          speaker,
          message,
          hour: parseHourFromTimestamp(timestamp),
        } as ParsedChatEntry;
      })
      .filter((item): item is ParsedChatEntry => Boolean(item));
  } catch {
    return [];
  }
}

function stripHtmlToText(content: string) {
  return sanitizeText(
    content
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">"),
  );
}

function detectExSkillChatEntries(title: string, content: string) {
  const lowerTitle = title.toLowerCase();
  const normalizedContent = lowerTitle.endsWith(".html") || lowerTitle.endsWith(".htm")
    ? stripHtmlToText(content)
    : content;

  const candidates: Array<{ format: string; entries: ParsedChatEntry[] }> = [
    { format: "liuhen_json", entries: lowerTitle.endsWith(".json") ? parseLiuhenJsonEntries(normalizedContent) : [] },
    { format: "wechatmsg_txt", entries: parseWechatTxtEntries(normalizedContent) },
    { format: "qq_txt", entries: parseQqTxtEntries(normalizedContent) },
    {
      format: "line",
      entries: normalizedContent
        .split("\n")
        .map((line) => parseChatLine(line))
        .filter((item): item is ParsedChatEntry => Boolean(item)),
    },
  ];

  return candidates.sort((left, right) => right.entries.length - left.entries.length)[0] ?? {
    format: "line",
    entries: [],
  };
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

function analyzeChatLog(
  id: string,
  title: string,
  content: string,
) {
  const sanitizedContent = content.replace(/\r/g, "");
  const speakers = new Set<string>();
  const activeHours = new Array<number>();
  const detected = detectExSkillChatEntries(title, sanitizedContent);
  const parsedEntries = detected.entries;
  let messageCount = 0;
  const matches = parsedEntries.length;

  parsedEntries.forEach((entry) => {
    messageCount += 1;
    speakers.add(entry.speaker);
    if (entry.hour !== null) activeHours.push(entry.hour);
  });

  const selfEntries = parsedEntries.filter((entry) => speakerIsAutoDetectedSelf(entry.speaker));

  if (!selfEntries.length) {
    throw new Error(
      `聊天记录 ${title} 无法自动识别本人发言。当前只支持导出后会把你的消息标成“我”或 “me” 的聊天格式。`,
    );
  }

  const selectedEntries = selfEntries;
  const selectedLines = selectedEntries.map((entry) => entry.message);
  const excerpt = sanitizeText(selectedLines.slice(0, 40).join("\n")).slice(0, 1400);
  const skills = scoreSkills(excerpt, `${title} 聊天记录`);
  skills.push({
    name: "Collaboration Signal",
    score: 74,
    reasons: [
      "只保留你在聊天中的发言，减少他人内容对人格蒸馏的干扰",
    ],
  });

  const baseHints = collaborationHintsFromText(excerpt);

  return {
    ...baseSource(
      id,
      "chat",
      title,
      excerpt,
      {
        messageCount,
        matchedLines: matches,
        speakers: speakers.size,
        chatFormat: detected.format,
        selfMessages: selfEntries.length,
        selectedMessages: selectedEntries.length,
        extractionMode: "self_only",
        extractionBasis: "auto_self_marker",
        activeWindow:
          activeHours.length > 0
            ? `${Math.min(...activeHours)}:00-${Math.max(...activeHours)}:00`
            : "unknown",
      },
      skills,
    ),
    collaborationHints: {
      shipVelocity: clamp((baseHints.shipVelocity ?? 52) + (activeHours.some((hour) => hour >= 22) ? 8 : 0), 12, 92),
      ambiguityFit: clamp(baseHints.ambiguityFit ?? 58, 12, 92),
      feedbackEnergy: clamp((baseHints.feedbackEnergy ?? 56) + (title.includes("review") ? 10 : 0), 12, 92),
      syncRhythm: clamp((baseHints.syncRhythm ?? 50) + (speakers.size > 2 ? 10 : 0), 12, 92),
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

function fileTypeForName(fileName: string): UploadFileKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".zip")) return "zip";
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(md|mdx)$/.test(lower)) return "markdown";
  if (/\.(png|jpg|jpeg|webp)$/.test(lower)) return "image";
  if (/\.(txt|csv|json|html|htm|log)$/.test(lower)) return "chat";
  return "text";
}

function mimeTypeForName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (/\.(md|mdx)$/.test(lower)) return "text/markdown";
  if (/\.(png)$/.test(lower)) return "image/png";
  if (/\.(jpg|jpeg)$/.test(lower)) return "image/jpeg";
  if (/\.(webp)$/.test(lower)) return "image/webp";
  return "text/plain";
}

function isArchiveEntrySupported(entryName: string) {
  return /\.(zip|pdf|md|mdx|png|jpg|jpeg|webp|txt|csv|json|html|htm|log)$/i.test(entryName);
}

function basenameFromEntryName(entryName: string) {
  return entryName.split(/[/\\]/).filter(Boolean).pop() ?? entryName;
}

function cloneBytes(bytes: Uint8Array) {
  return Uint8Array.from(bytes);
}

function decorateArchiveSource(
  source: ParsedSource,
  archiveName: string,
  entryName: string,
): ParsedSource {
  const nextId = `src-${simpleHash(`${archiveName}-${entryName}-${source.id}`)}`;
  const nextTitle = source.title.includes(" · ")
    ? `${archiveName} · ${source.title}`
    : `${archiveName} · ${entryName}`;

  return {
    ...source,
    id: nextId,
    title: nextTitle,
    stats: {
      ...source.stats,
      archive: archiveName,
      entry: entryName,
    },
    evidence: source.evidence.map((entry, index) => ({
      ...entry,
      id: `${nextId}-ev-${index}`,
      sourceId: nextId,
      title: nextTitle,
    })),
  };
}

async function parseSingleFile(file: File): Promise<ParsedSource> {
  const id = `src-${simpleHash(`${file.name}-${file.size}-${file.lastModified}`)}`;
  const type = fileTypeForName(file.name);

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

async function parseArchiveFile(
  file: File,
  options: ParseUploadOptions = {},
): Promise<ParsedSource[]> {
  const archiveBytes = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(archiveBytes);
  const parsedSources: ParsedSource[] = [];
  let totalBytes = 0;

  for (const [entryName, entryBytes] of Object.entries(entries)) {
    if (parsedSources.length >= ARCHIVE_ENTRY_LIMIT) break;
    if (!entryName || entryName.endsWith("/")) continue;
    if (entryName.startsWith("__MACOSX/")) continue;
    if (!isArchiveEntrySupported(entryName)) continue;
    if (entryBytes.byteLength > ARCHIVE_ENTRY_BYTES_LIMIT) continue;

    totalBytes += entryBytes.byteLength;
    if (totalBytes > ARCHIVE_TOTAL_BYTES_LIMIT) break;

    const kind = fileTypeForName(entryName);

    if (kind === "zip") {
      if ((options.archiveDepth ?? 0) >= 1) continue;
      const nestedArchive = new File([cloneBytes(entryBytes)], basenameFromEntryName(entryName), {
        type: "application/zip",
      });
      const nestedSources = await parseArchiveFile(nestedArchive, {
        ...options,
        archiveDepth: (options.archiveDepth ?? 0) + 1,
      });
      parsedSources.push(
        ...nestedSources.map((source) => decorateArchiveSource(source, file.name, entryName)),
      );
      continue;
    }

    if (kind === "chat" || kind === "markdown" || kind === "text") {
      const textContent = strFromU8(entryBytes);
      const source = kind === "chat"
        ? analyzeChatLog(
          `src-${simpleHash(`${file.name}-${entryName}`)}`,
          entryName,
          textContent,
        )
        : parseMarkdownText(
          `src-${simpleHash(`${file.name}-${entryName}`)}`,
          entryName,
          textContent,
        );
      parsedSources.push(decorateArchiveSource(source, file.name, entryName));
      continue;
    }

    const nestedFile = new File([cloneBytes(entryBytes)], basenameFromEntryName(entryName), {
      type: mimeTypeForName(entryName),
    });
    const source = await parseSingleFile(nestedFile);
    parsedSources.push(decorateArchiveSource(source, file.name, entryName));
  }

  if (!parsedSources.length) {
    throw new Error("压缩包里没有可解析的聊天记录、项目文档、图片或 PDF。");
  }

  return parsedSources.slice(0, ARCHIVE_ENTRY_LIMIT);
}

export async function parseUploadFile(
  file: File,
  options: ParseUploadOptions = {},
): Promise<ParsedSource[]> {
  if (fileTypeForName(file.name) === "zip") {
    return parseArchiveFile(file, options);
  }

  return [await parseSingleFile(file)];
}

export async function parseFile(
  file: File,
  options: ParseUploadOptions = {},
): Promise<ParsedSource> {
  void options;
  return parseSingleFile(file);
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
