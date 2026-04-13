import { describe, expect, it } from "vitest";

import { distillSignalBundle, distillSignalBundleWithBaseline } from "@/lib/deterministic-distill";
import type { SignalBundle } from "@/lib/types";

const bundle: SignalBundle = {
  version: "1",
  profile: {
    alias: "Zero",
    role: "AI builder",
    bio: "做浏览器自动化和 workflow 产品。",
    goals: ["browser automation", "ai workflow", "shareable tools"],
    languages: ["中文", "English"],
    timezone: "Asia/Hong_Kong",
  },
  sources: [],
  candidateSkills: [
    { name: "AI Workflow", score: 120, reasons: ["README 命中 workflow"] },
    {
      name: "Browser Automation",
      score: 118,
      reasons: ["依赖中命中 playwright"],
    },
    {
      name: "Frontend Systems",
      score: 90,
      reasons: ["README 命中 next.js"],
    },
  ],
  evidencePool: [
    {
      id: "ev-1",
      sourceId: "src-1",
      title: "README",
      quote: "Built browser automations with Playwright and multi-agent workflows.",
      skill: "Browser Automation",
      weight: 82,
    },
  ],
  collaborationHints: {
    shipVelocity: 74,
    ambiguityFit: 68,
    feedbackEnergy: 61,
    syncRhythm: 42,
  },
  zeroRawRetention: true,
  zeroRawLogging: true,
  createdAt: new Date("2026-04-10T00:00:00.000Z").toISOString(),
};

describe("distillSignalBundle", () => {
  it("builds a complete twin card", () => {
    const twin = distillSignalBundle(bundle);

    expect(twin.skills).toHaveLength(3);
    expect(twin.evidence).toHaveLength(1);
    expect(twin.sharePolicy.scope).toBe("matches");
    expect(twin.sbti.code).toHaveLength(4);
    expect(twin.mbti.code).toMatch(/^[EI][SN][TF][JP]$/);
    expect(twin.imsb.code).toMatch(/^(IM|IS|IB|MI|MS|MB|SI|SM|SB|BI|BM|BS)$/);
    expect(twin.privacyStatement).toContain("结构化线索");
  });

  it("updates from an existing twin baseline", () => {
    const previousTwin = distillSignalBundle(bundle);
    const updatedTwin = distillSignalBundleWithBaseline(
      {
        ...bundle,
        candidateSkills: [
          { name: "Growth Ops", score: 96, reasons: ["新增 landing page signal"] },
        ],
        evidencePool: [
          {
            id: "ev-2",
            sourceId: "src-2",
            title: "New note",
            quote: "Added landing page experiments and distribution loops this week.",
            skill: "Growth Ops",
            weight: 88,
          },
        ],
      },
      previousTwin,
    );

    expect(updatedTwin.skills.some((skill) => skill.name === "AI Workflow")).toBe(true);
    expect(updatedTwin.skills.some((skill) => skill.name === "Growth Ops")).toBe(true);
    expect(updatedTwin.evidence.some((item) => item.title === "New note")).toBe(true);
  });
});
