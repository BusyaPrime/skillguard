import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForPromptInjection } from "../src/checks/prompt-injection.js";
import patternsRaw from "../src/patterns/injection-patterns.json" with { type: "json" };
import type { Pattern } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures");

function parseExpects(content: string): string[] {
  const firstLine = content.split("\n")[0];
  const m = /<!--\s*expects:\s*([^>]+?)\s*-->/.exec(firstLine);
  if (!m) return [];
  return m[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

describe("pattern catalog", () => {
  it("module loads without throw", async () => {
    const mod = await import("../src/checks/prompt-injection.js");
    expect(typeof mod.scanForPromptInjection).toBe("function");
  });

  it("every pattern regex compiles", () => {
    const patterns = patternsRaw as unknown as Pattern[];
    expect(patterns.length).toBeGreaterThan(0);
    for (const p of patterns) {
      expect(
        () => {
          const m = /^\(\?([imsu]+)\)/.exec(p.regex);
          const body = m ? p.regex.slice(m[0].length) : p.regex;
          const flags = m ? m[1] : "";
          const finalFlags = new Set(flags.split(""));
          finalFlags.add("g");
          if (p.multiline) finalFlags.add("m");
          new RegExp(body, [...finalFlags].join(""));
        },
        `pattern ${p.id} failed to compile`,
      ).not.toThrow();
    }
  });

  it("every pattern matches its own example", () => {
    const patterns = patternsRaw as unknown as Pattern[];
    for (const p of patterns) {
      const m = /^\(\?([imsu]+)\)/.exec(p.regex);
      const body = m ? p.regex.slice(m[0].length) : p.regex;
      const flags = m ? m[1] : "";
      const finalFlags = new Set(flags.split(""));
      finalFlags.add("g");
      if (p.multiline) finalFlags.add("m");
      const re = new RegExp(body, [...finalFlags].join(""));
      expect(
        re.test(p.example),
        `pattern ${p.id} did not match its own example`,
      ).toBe(true);
    }
  });
});

describe("benign fixtures", () => {
  const benignDir = join(FIXTURES, "benign");
  const files = readdirSync(benignDir).filter((f) => f.endsWith(".md"));

  it.each(files)("%s produces no findings", async (filename) => {
    const filepath = join(benignDir, filename);
    const content = readFileSync(filepath, "utf8");
    const findings = await scanForPromptInjection(filepath, content);
    expect(
      findings,
      `benign file ${filename} triggered: ${findings
        .map((f) => `${f.patternId}/${f.severity}`)
        .join(", ")}`,
    ).toEqual([]);
  });
});

describe("malicious fixtures", () => {
  const maliciousDir = join(FIXTURES, "malicious");
  const files = readdirSync(maliciousDir).filter((f) => f.endsWith(".md"));

  it.each(files)("%s triggers expected patterns", async (filename) => {
    const filepath = join(maliciousDir, filename);
    const content = readFileSync(filepath, "utf8");
    const expected = parseExpects(content);
    expect(
      expected.length,
      `${filename} must declare an "<!-- expects: PIxxx -->" comment on line 1`,
    ).toBeGreaterThan(0);

    const findings = await scanForPromptInjection(filepath, content);
    const foundIds = new Set(findings.map((f) => f.patternId));

    for (const id of expected) {
      expect(
        foundIds.has(id),
        `expected ${id} to fire on ${filename}; got: [${[...foundIds].join(
          ", ",
        )}]`,
      ).toBe(true);
    }

    const unexpectedHigh = findings.filter(
      (f) =>
        (f.severity === "CRITICAL" || f.severity === "WARNING") &&
        !expected.includes(f.patternId),
    );
    expect(
      unexpectedHigh.map((f) => `${f.patternId}/${f.severity}`),
      `unexpected high-severity findings in ${filename}`,
    ).toEqual([]);
  });
});
