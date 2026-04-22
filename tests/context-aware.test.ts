import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForPromptInjection } from "../src/checks/prompt-injection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, "fixtures/malicious");

async function findByPatternId(filename: string, patternId: string) {
  const filepath = join(DIR, filename);
  const content = readFileSync(filepath, "utf8");
  const findings = await scanForPromptInjection(filepath, content);
  return findings.find((f) => f.patternId === patternId);
}

describe("context-aware severity", () => {
  it("PI022 base64 outside fence with exec trigger → CRITICAL", async () => {
    const f = await findByPatternId("m25-base64-outside-codeblock.md", "PI022");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("CRITICAL");
  });

  it("PI022 base64 inside fenced code block → INFO", async () => {
    const f = await findByPatternId("m26-base64-inside-codeblock.md", "PI022");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("INFO");
  });

  it("PI023 hex blob inside fenced code block → INFO", async () => {
    const f = await findByPatternId("m27-hex-inside-codeblock.md", "PI023");
    expect(f).toBeDefined();
    expect(f?.severity).toBe("INFO");
  });
});
