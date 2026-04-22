import patternsRaw from "../patterns/injection-patterns.json" with { type: "json" };
import type { Finding, Pattern, Severity } from "../types.js";

const patterns = patternsRaw as unknown as Pattern[];

type CompiledPattern = Pattern & { compiled: RegExp };

function parseInlineFlags(rawRegex: string): { body: string; flags: string } {
  const m = /^\(\?([imsu]+)\)/.exec(rawRegex);
  if (!m) return { body: rawRegex, flags: "" };
  return { body: rawRegex.slice(m[0].length), flags: m[1] };
}

const COMPILED: CompiledPattern[] = patterns.map((p) => {
  const { body, flags } = parseInlineFlags(p.regex);
  const finalFlags = new Set(flags.split(""));
  finalFlags.add("g");
  if (p.multiline) finalFlags.add("m");
  try {
    return { ...p, compiled: new RegExp(body, [...finalFlags].join("")) };
  } catch (err) {
    const rawMessage = (err as Error).message;
    const sanitized = rawMessage.split(body).join("<redacted>");
    throw new Error(`Pattern ${p.id} (${p.name}) failed to compile: ${sanitized}`);
  }
});

const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

const EXEC_TRIGGERS = ["decode", "eval", "bash", "exec", "pipe", "curl", "wget"];
const IMPERATIVE_WORDS = /\b(do|use|always|never|must|should)\b/i;

function computeLineOffsets(content: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) {
      offsets.push(i + 1);
    }
  }
  return offsets;
}

function lineColFromIndex(
  offsets: number[],
  index: number,
): { line: number; column: number } {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (offsets[mid] <= index) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return { line: lo + 1, column: index - offsets[lo] + 1 };
}

function buildSnippet(content: string, matchStart: number): string {
  const start = Math.max(0, matchStart - 40);
  const end = Math.min(content.length, matchStart + 40);
  let snippet = content.slice(start, end).replace(/\n/g, " · ");
  if (snippet.length > 80) snippet = snippet.slice(0, 80);
  return snippet;
}

export function isInsideFencedCodeBlock(
  lines: string[],
  lineNumber: number,
): boolean {
  let fenceCount = 0;
  for (let i = 0; i < lineNumber - 1; i++) {
    if (lines[i].trimStart().startsWith("```")) {
      fenceCount++;
    }
  }
  return fenceCount % 2 === 1;
}

function hasExecTriggerNearby(lines: string[], matchLine: number): boolean {
  const start = Math.max(0, matchLine - 1 - 3);
  const end = Math.min(lines.length - 1, matchLine - 1 + 3);
  for (let i = start; i <= end; i++) {
    const lower = lines[i].toLowerCase();
    for (const trigger of EXEC_TRIGGERS) {
      if (lower.includes(trigger)) return true;
    }
  }
  return false;
}

export async function scanForPromptInjection(
  filePath: string,
  content: string,
): Promise<Finding[]> {
  const lines = content.split("\n");
  const lineOffsets = computeLineOffsets(content);
  const findings: Finding[] = [];

  for (const p of COMPILED) {
    p.compiled.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = p.compiled.exec(content)) !== null) {
      if (match[0].length === 0) {
        p.compiled.lastIndex++;
        continue;
      }
      const { line, column } = lineColFromIndex(lineOffsets, match.index);
      const snippet = buildSnippet(content, match.index);

      let severity: Severity = p.severity;
      let description = p.description;

      if (p.contextAware === "base64") {
        if (isInsideFencedCodeBlock(lines, line)) {
          severity = "INFO";
        } else if (hasExecTriggerNearby(lines, line)) {
          severity = "CRITICAL";
        }
      } else if (p.contextAware === "hex") {
        if (isInsideFencedCodeBlock(lines, line)) {
          severity = "INFO";
        }
      } else if (p.contextAware === "html-comment") {
        const commentBody =
          match[1] !== undefined
            ? match[1]
            : match[0].replace(/^<!--/, "").replace(/-->$/, "");

        let matchedOtherId: string | null = null;
        for (const other of COMPILED) {
          if (other.id === "PI024") continue;
          other.compiled.lastIndex = 0;
          if (other.compiled.test(commentBody)) {
            matchedOtherId = other.id;
            break;
          }
        }

        if (matchedOtherId) {
          severity = "CRITICAL";
          description = `HTML comment contains a smuggled injection pattern (matched: ${matchedOtherId})`;
        } else if (
          commentBody.length > 200 &&
          IMPERATIVE_WORDS.test(commentBody)
        ) {
          severity = "WARNING";
        } else {
          continue;
        }
      }

      findings.push({
        file: filePath,
        line,
        column,
        snippet,
        patternId: p.id,
        patternName: p.name,
        severity,
        category: p.category,
        description,
      });
    }
  }

  const dedupMap = new Map<string, Finding>();
  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.patternId}`;
    const existing = dedupMap.get(key);
    if (
      !existing ||
      SEVERITY_RANK[f.severity] > SEVERITY_RANK[existing.severity]
    ) {
      dedupMap.set(key, f);
    }
  }
  return Array.from(dedupMap.values());
}
