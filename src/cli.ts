import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import chalk from "chalk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../package.json"), "utf8"),
) as { version: string; description: string };

const program = new Command();

program
  .name("skillguard")
  .description(pkg.description)
  .version(pkg.version);

program
  .command("scan <path>")
  .description("Scan a directory for skill/MCP security issues")
  .option("--deep", "Enable deep analysis via LLM judge (future)")
  .option("--json", "Emit results as JSON (future)")
  .action((path: string) => {
    console.log(chalk.cyan(`Scanning ${path}... (not implemented yet)`));
  });

program.parse(process.argv);
