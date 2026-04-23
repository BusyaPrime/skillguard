import patternsRaw from "../patterns/shell-blocklist.json" with { type: "json" };
import type { Finding, Pattern } from "../types.js";
import {
  buildSnippet,
  computeLineOffsets,
  dedupeFindings,
  isInsideBlockquote,
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

export async function scanForShellCommands(
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
      if (isInsideBlockquote(lines, line)) continue;
      const snippet = buildSnippet(content, match.index);
      findings.push({
        file: filePath,
        line,
        column,
        snippet,
        patternId: p.id,
        patternName: p.name,
        severity: p.severity,
        category: p.category,
        description: p.description,
        detector: "shell-command",
      });
    }
  }

  return dedupeFindings(findings);
}
