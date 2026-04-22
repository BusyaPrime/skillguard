import type { Finding, Severity } from "../types.js";
import {
  buildSnippet,
  computeLineOffsets,
  dedupeFindings,
  isInsideFencedCodeBlock,
  lineColFromIndex,
} from "../utils.js";

type HiddenCharGroup = {
  id: string;
  name: string;
  chars: number[];
  severity: Severity;
  category: string;
  description: string;
};

const GROUPS: HiddenCharGroup[] = [
  {
    id: "UC001",
    name: "zero-width-chars",
    chars: [0x200b, 0x200c, 0x200d],
    severity: "WARNING",
    category: "obfuscation",
    description:
      "Zero-width Unicode characters (ZWSP/ZWNJ/ZWJ) can hide instructions from human readers",
  },
  {
    id: "UC002",
    name: "bidi-override",
    chars: [0x202d, 0x202e, 0x200e, 0x200f, 0x2066, 0x2067, 0x2068, 0x2069],
    severity: "CRITICAL",
    category: "obfuscation",
    description:
      "Bidirectional text override characters can reorder visible text in misleading ways",
  },
];

export async function scanForHiddenUnicode(
  filePath: string,
  content: string,
): Promise<Finding[]> {
  const lines = content.split("\n");
  const offsets = computeLineOffsets(content);
  const findings: Finding[] = [];

  for (const group of GROUPS) {
    const charSet = new Set(group.chars);
    for (let i = 0; i < content.length; i++) {
      if (charSet.has(content.charCodeAt(i))) {
        const { line, column } = lineColFromIndex(offsets, i);
        const severity: Severity = isInsideFencedCodeBlock(lines, line)
          ? "INFO"
          : group.severity;
        findings.push({
          file: filePath,
          line,
          column,
          snippet: buildSnippet(content, i),
          patternId: group.id,
          patternName: group.name,
          severity,
          category: group.category,
          description: group.description,
          detector: "hidden-unicode",
        });
      }
    }
  }

  return dedupeFindings(findings);
}
