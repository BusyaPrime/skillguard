import patternsRaw from "../patterns/injection-patterns.json" with { type: "json" };
import type { Finding, Pattern, Severity } from "../types.js";
import {
  buildSnippet,
  computeLineOffsets,
  dedupeFindings,
  isInsideFencedCodeBlock,
  lineColFromIndex,
  parseInlineFlags,
} from "../utils.js";

const patterns = patternsRaw as unknown as Pattern[];

type CompiledPattern = Pattern & { compiled: RegExp };

const COMPILED: CompiledPattern[] = patterns.map((p) => {
  const { body, flags } = parseInlineFlags(p.regex);
  const finalFlags = new Set(flags.split(""));
  finalFlags.add("g");
  if (p.multiline) finalFlags.add("m");
  try {
    return { ...p, compiled: new RegExp(body, [...finalFlags].join("")) };
  } catch (err) {
    const raw = (err as Error).message;
    const sanitized = raw.split(body).join("<redacted>");
    throw new Error(`Pattern ${p.id} (${p.name}) failed to compile: ${sanitized}`);
  }
});

const EXEC_TRIGGERS = ["decode", "eval", "bash", "exec", "pipe", "curl", "wget"];
const IMPERATIVE_WORDS = /\b(do|use|always|never|must|should)\b/i;

function hasExecTriggerNearby(lines: string[], matchLine: number): boolean {
  const start = Math.max(0, matchLine - 1 - 3);
  const end = Math.min(lines.length - 1, matchLine - 1 + 3);
  for (let i = start; i <= end; i++) {
    const lower = lines[i].toLowerCase();
    for (const t of EXEC_TRIGGERS) if (lower.includes(t)) return true;
  }
  return false;
}

export async function scanForPromptInjection(
  filePath: string,
  content: string,
): Promise<Finding[]> {
  const lines = content.split("\n");
  const offsets = computeLineOffsets(content);
  const findings: Finding[] = [];

  for (const p of COMPILED) {
    p.compiled.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = p.compiled.exec(content)) !== null) {
      if (match[0].length === 0) {
        p.compiled.lastIndex++;
        continue;
      }
      const { line, column } = lineColFromIndex(offsets, match.index);
      const snippet = buildSnippet(content, match.index);
      let severity: Severity = p.severity;
      let description = p.description;

      if (p.contextAware === "base64") {
        if (isInsideFencedCodeBlock(lines, line)) severity = "INFO";
        else if (hasExecTriggerNearby(lines, line)) severity = "CRITICAL";
      } else if (p.contextAware === "hex") {
        if (isInsideFencedCodeBlock(lines, line)) severity = "INFO";
      } else if (p.contextAware === "html-comment") {
        const body =
          match[1] !== undefined
            ? match[1]
            : match[0].replace(/^<!--/, "").replace(/-->$/, "");
        let matched: string | null = null;
        for (const o of COMPILED) {
          if (o.id === "PI024") continue;
          o.compiled.lastIndex = 0;
          if (o.compiled.test(body)) {
            matched = o.id;
            break;
          }
        }
        if (matched) {
          severity = "CRITICAL";
          description = `HTML comment contains a smuggled injection pattern (matched: ${matched})`;
        } else if (body.length > 200 && IMPERATIVE_WORDS.test(body)) {
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
        detector: "prompt-injection",
      });
    }
  }

  return dedupeFindings(findings);
}
