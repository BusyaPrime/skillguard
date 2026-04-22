import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForHiddenUnicode } from "../src/checks/hidden-unicode.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures");
const UC_IDS = new Set(["UC001", "UC002"]);

function parseExpects(content: string): string[] {
  const m = /<!--\s*expects:\s*([^>]+?)\s*-->/.exec(content.split("\n")[0]);
  if (!m) return [];
  return m[1].split(",").map((s) => s.trim()).filter(Boolean);
}

describe("hidden-unicode detector", () => {
  it("module loads", async () => {
    const mod = await import("../src/checks/hidden-unicode.js");
    expect(typeof mod.scanForHiddenUnicode).toBe("function");
  });

  it("clean ASCII produces no findings", async () => {
    const findings = await scanForHiddenUnicode("t", "hello world\nno hidden chars here");
    expect(findings).toEqual([]);
  });

  it("ZWSP produces UC001/WARNING", async () => {
    const findings = await scanForHiddenUnicode("t", "hello\u200Bworld");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].patternId).toBe("UC001");
    expect(findings[0].severity).toBe("WARNING");
  });

  it("RLO produces UC002/CRITICAL", async () => {
    const findings = await scanForHiddenUnicode("t", "before\u202Eafter");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].patternId).toBe("UC002");
    expect(findings[0].severity).toBe("CRITICAL");
  });

  it("hidden char inside fenced code block downgrades to INFO", async () => {
    const content = "normal text\n```\nfoo\u200Bbar\n```\n";
    const findings = await scanForHiddenUnicode("t", content);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe("INFO");
  });
});

describe("unicode benign fixtures", () => {
  const benignDir = join(FIXTURES, "benign");
  const files = readdirSync(benignDir).filter((f) => f.endsWith(".md"));

  it.each(files)("%s produces no unicode findings", async (filename) => {
    const filepath = join(benignDir, filename);
    const content = readFileSync(filepath, "utf8");
    const findings = await scanForHiddenUnicode(filepath, content);
    expect(
      findings.map((f) => `${f.patternId}/${f.severity}`),
      `benign file ${filename} triggered unicode patterns`,
    ).toEqual([]);
  });
});

describe("unicode malicious fixtures", () => {
  const maliciousDir = join(FIXTURES, "malicious");
  const files = readdirSync(maliciousDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => {
      const content = readFileSync(join(maliciousDir, f), "utf8");
      const expected = parseExpects(content);
      return expected.some((id) => UC_IDS.has(id));
    });

  it.each(files)("%s triggers expected unicode patterns", async (filename) => {
    const filepath = join(maliciousDir, filename);
    const content = readFileSync(filepath, "utf8");
    const expected = parseExpects(content).filter((id) => UC_IDS.has(id));
    expect(expected.length).toBeGreaterThan(0);

    const findings = await scanForHiddenUnicode(filepath, content);
    const foundIds = new Set(findings.map((f) => f.patternId));
    for (const id of expected) {
      expect(
        foundIds.has(id),
        `expected ${id} in ${filename}; got [${[...foundIds].join(", ")}]`,
      ).toBe(true);
    }
  });
});
