import { BLOCKED_KEYWORD_GROUPS } from "@/lib/constants";
import type { SignalBundle } from "@/lib/types";

type ExchangeSafetyOutput = {
  messages: Array<{ content: string }>;
  summary: string;
  nextLine: string;
};

type BlockedHit = {
  label: string;
  term: string;
};

function normalizeText(text: string) {
  return text.toLowerCase();
}

export function findBlockedKeyword(text: string): BlockedHit | null {
  const normalized = normalizeText(text);

  for (const group of BLOCKED_KEYWORD_GROUPS) {
    const term = group.terms.find((item) =>
      normalized.includes(item.toLowerCase()),
    );

    if (term) {
      return {
        label: group.label,
        term,
      };
    }
  }

  return null;
}

export function buildBundleSafetyText(bundle: SignalBundle) {
  return [
    bundle.profile.alias,
    bundle.profile.role,
    bundle.profile.bio,
    ...bundle.profile.goals,
    ...bundle.sources.flatMap((source) => [source.title, source.excerpt]),
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildExchangeSafetyText(text: string, exchange?: ExchangeSafetyOutput) {
  return [
    text,
    ...(exchange?.messages.map((message) => message.content) ?? []),
    exchange?.summary ?? "",
    exchange?.nextLine ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
