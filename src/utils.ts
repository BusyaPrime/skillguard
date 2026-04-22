import type { Finding, Severity } from "./types.js";

export const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 2,
  INFO: 1,
};

export function parseInlineFlags(rawRegex: string): { body: string; flags: string } {
  const m = /^\(\?([imsu]+)\)/.exec(rawRegex);
  if (!m) return { body: rawRegex, flags: "" };
  return { body: rawRegex.slice(m[0].length), flags: m[1] };
}

export function computeLineOffsets(content: string): number[] {
  const offsets: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) offsets.push(i + 1);
  }
  return offsets;
}

export function lineColFromIndex(
  offsets: number[],
  index: number,
): { line: number; column: number } {
  let lo = 0;
  let hi = offsets.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (offsets[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return { line: lo + 1, column: index - offsets[lo] + 1 };
}

export function buildSnippet(content: string, matchStart: number): string {
  const start = Math.max(0, matchStart - 40);
  const end = Math.min(content.length, matchStart + 40);
  let snippet = content.slice(start, end).replace(/\n/g, " · ");
  if (snippet.length > 80) snippet = snippet.slice(0, 80);
  return snippet;
}

export function isInsideFencedCodeBlock(lines: string[], lineNumber: number): boolean {
  let fenceCount = 0;
  for (let i = 0; i < lineNumber - 1; i++) {
    if (lines[i].trimStart().startsWith("```")) fenceCount++;
  }
  return fenceCount % 2 === 1;
}

export function isInsideBlockquote(lines: string[], lineNumber: number): boolean {
  const line = lines[lineNumber - 1];
  if (!line) return false;
  return /^\s*>\s/.test(line);
}

export function dedupeFindings(findings: Finding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const f of findings) {
    const key = `${f.file}:${f.line}:${f.patternId}`;
    const existing = map.get(key);
    if (!existing || SEVERITY_RANK[f.severity] > SEVERITY_RANK[existing.severity]) {
      map.set(key, f);
    }
  }
  return Array.from(map.values());
}
