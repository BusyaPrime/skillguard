export type Severity = "CRITICAL" | "WARNING" | "INFO";

export type DetectorName = "prompt-injection" | "shell-command" | "hidden-unicode";

export type Pattern = {
  id: string;
  name: string;
  regex: string;
  severity: Severity;
  category: string;
  description: string;
  example: string;
  references: string[];
  contextAware?: "base64" | "hex" | "html-comment";
  multiline?: boolean;
};

export type Finding = {
  file: string;
  line: number;
  column: number;
  snippet: string;
  patternId: string;
  patternName: string;
  severity: Severity;
  category: string;
  description: string;
  detector?: DetectorName;
};
