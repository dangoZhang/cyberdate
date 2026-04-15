export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function joinClasses(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

export function dedupe<T>(items: T[]) {
  return [...new Set(items)];
}

export function toTitleCase(input: string) {
  return input.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function round(value: number) {
  return Math.round(value);
}

export function simpleHash(input: string) {
  let hash = 5381;
  for (const char of input) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return (hash >>> 0).toString(16);
}

export function buildShareCode(alias: string, stableSeed: string) {
  const aliasPart = simpleHash(alias || "cyberdate").slice(0, 4).toUpperCase();
  const seedPart = simpleHash(stableSeed).slice(0, 6).toUpperCase();
  return `CD-${aliasPart}-${seedPart}`;
}

export function resolveTwinShareCode(
  alias: string,
  accountId: string,
  previousShareCode?: string | null,
) {
  return previousShareCode ?? buildShareCode(alias, accountId);
}

export function scoreLabel(score: number) {
  if (score >= 80) return "高";
  if (score >= 60) return "中";
  return "低";
}
