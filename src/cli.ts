import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";
import { Command } from "commander";
import chalk from "chalk";
import { glob } from "glob";
import { scanForPromptInjection } from "./checks/prompt-injection.js";
import { scanForShellCommands } from "./checks/shell-commands.js";
import { scanForHiddenUnicode } from "./checks/hidden-unicode.js";
import type { Finding, Severity } from "./types.js";
import { SEVERITY_RANK } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
) as { version: string; description: string };

function colorForSeverity(severity: Severity, text: string): string {
  if (severity === "CRITICAL") return chalk.red(text);
  if (severity === "WARNING") return chalk.yellow(text);
  return chalk.gray(chalk.dim(text));
}

async function scanOne(filePath: string, content: string): Promise<Finding[]> {
  const [pi, sh, uc] = await Promise.all([
    scanForPromptInjection(filePath, content),
    scanForShellCommands(filePath, content),
    scanForHiddenUnicode(filePath, content),
  ]);
  return [...pi, ...sh, ...uc];
}

async function runScan(
  targetPath: string,
  jsonOutput: boolean,
): Promise<number> {
  const abs = resolve(targetPath);
  let files: string[];
  try {
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      files = await glob("**/*.md", {
        cwd: abs,
        absolute: true,
        nodir: true,
      });
    } else {
      files = [abs];
    }
  } catch {
    console.error(chalk.red(`Path not found: ${targetPath}`));
    return 2;
  }

  const allFindings: Finding[] = [];
  for (const f of files) {
    const content = readFileSync(f, "utf8");
    allFindings.push(...(await scanOne(f, content)));
  }

  if (jsonOutput) {
    console.log(JSON.stringify(allFindings, null, 2));
    return allFindings.some((f) => f.severity === "CRITICAL") ? 1 : 0;
  }

  const critical = allFindings.filter((f) => f.severity === "CRITICAL").length;
  const warning = allFindings.filter((f) => f.severity === "WARNING").length;
  const info = allFindings.filter((f) => f.severity === "INFO").length;

  console.log(
    chalk.bold(
      `SkillGuard scanned ${files.length} file(s) across 3 detectors — ${critical} critical, ${warning} warning, ${info} info`,
    ),
  );

  if (allFindings.length === 0) {
    console.log(chalk.green("No findings."));
    return 0;
  }

  allFindings.sort((a, b) => {
    const d = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (d !== 0) return d;
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });

  for (const f of allFindings) {
    const rel = relative(process.cwd(), f.file).replaceAll("\\", "/");
    const tag = `[${f.severity}/${f.detector ?? "unknown"}]`;
    const header = `${tag} ${rel}:${f.line}:${f.column}  ${f.patternName}`;
    console.log(colorForSeverity(f.severity, header));
    console.log(chalk.dim(`   > ${f.snippet}`));
  }

  return allFindings.some((f) => f.severity === "CRITICAL") ? 1 : 0;
}

const program = new Command();

program.name("skillguard").description(pkg.description).version(pkg.version);

program
  .command("scan <path>")
  .description("Scan a directory or file for skill/MCP security issues")
  .option("--deep", "Enable deep analysis via LLM judge (future)")
  .option("--json", "Emit findings as JSON instead of formatted text")
  .addHelpText(
    "after",
    `
Examples:
  $ skillguard scan ./skills
  $ skillguard scan ./my-skill.md --json
  $ skillguard scan ./claude-code-config.md | less

Exit codes:
  0   no CRITICAL findings
  1   at least one CRITICAL finding
  2   path not found
`,
  )
  .action(async (path: string, opts: { json?: boolean }) => {
    const code = await runScan(path, !!opts.json);
    process.exit(code);
  });

program.addHelpText(
  "after",
  `
Detectors (run on every scan):
  prompt-injection   catalog of 26 prompt-injection regex patterns
  shell-command      catalog of 12 dangerous shell command patterns
  hidden-unicode     zero-width and bidirectional override characters

See SECURITY.md for vulnerability reporting and scope.
`,
);

program.parse(process.argv);
