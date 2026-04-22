import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForShellCommands } from "../src/checks/shell-commands.js";
import patternsRaw from "../src/patterns/shell-blocklist.json" with { type: "json" };
import type { Pattern } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "fixtures");
const SHELL_IDS = new Set(["SH001", "SH002", "SH003", "SH004", "SH005", "SH006", "SH007", "SH008", "SH009", "SH010", "SH011", "SH012", "SH013", "SH014", "SH015", "SH016", "SH017", "SH018"]);

function parseExpects(content: string): string[] {
  const m = /<!--\s*expects:\s*([^>]+?)\s*-->/.exec(content.split("\n")[0]);
  if (!m) return [];
  return m[1].split(",").map((s) => s.trim()).filter(Boolean);
}

describe("shell command catalog", () => {
  it("module loads", async () => {
    const mod = await import("../src/checks/shell-commands.js");
    expect(typeof mod.scanForShellCommands).toBe("function");
  });

  it("catalog has 18 patterns", () => {
    const patterns = patternsRaw as unknown as Pattern[];
    expect(patterns.length).toBe(18);
    for (const p of patterns) expect(SHELL_IDS.has(p.id)).toBe(true);
  });

  it("every pattern compiles and self-matches", () => {
    const patterns = patternsRaw as unknown as Pattern[];
    for (const p of patterns) {
      const m = /^\(\?([imsu]+)\)/.exec(p.regex);
      const body = m ? p.regex.slice(m[0].length) : p.regex;
      const flags = m ? m[1] : "";
      const fs = new Set(flags.split(""));
      fs.add("g");
      if (p.multiline) fs.add("m");
      const re = new RegExp(body, [...fs].join(""));
      expect(re.test(p.example), `${p.id} did not match own example`).toBe(true);
    }
  });
});

describe("shell benign fixtures", () => {
  const benignDir = join(FIXTURES, "benign");
  const files = readdirSync(benignDir).filter((f) => f.endsWith(".md"));

  it.each(files)("%s produces no shell findings", async (filename) => {
    const filepath = join(benignDir, filename);
    const content = readFileSync(filepath, "utf8");
    const findings = await scanForShellCommands(filepath, content);
    expect(
      findings.map((f) => `${f.patternId}/${f.severity}`),
      `benign file ${filename} triggered shell patterns`,
    ).toEqual([]);
  });
});

describe("shell malicious fixtures", () => {
  const maliciousDir = join(FIXTURES, "malicious");
  const files = readdirSync(maliciousDir)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => {
      const content = readFileSync(join(maliciousDir, f), "utf8");
      const expected = parseExpects(content);
      return expected.some((id) => SHELL_IDS.has(id));
    });

  it.each(files)("%s triggers expected shell patterns", async (filename) => {
    const filepath = join(maliciousDir, filename);
    const content = readFileSync(filepath, "utf8");
    const expected = parseExpects(content).filter((id) => SHELL_IDS.has(id));
    expect(expected.length).toBeGreaterThan(0);

    const findings = await scanForShellCommands(filepath, content);
    const foundIds = new Set(findings.map((f) => f.patternId));
    for (const id of expected) {
      expect(
        foundIds.has(id),
        `expected ${id} in ${filename}; got [${[...foundIds].join(", ")}]`,
      ).toBe(true);
    }

    const unexpectedHigh = findings.filter(
      (f) =>
        (f.severity === "CRITICAL" || f.severity === "WARNING") &&
        !expected.includes(f.patternId),
    );
    expect(
      unexpectedHigh.map((f) => `${f.patternId}/${f.severity}`),
      `unexpected high-sev in ${filename}`,
    ).toEqual([]);
  });
});
