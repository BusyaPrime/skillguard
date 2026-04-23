import { createInterface } from "node:readline";
import { readFileSync, statSync } from "node:fs";
import { glob } from "glob";
import { scanForPromptInjection } from "./checks/prompt-injection.js";
import { scanForShellCommands } from "./checks/shell-commands.js";
import { scanForHiddenUnicode } from "./checks/hidden-unicode.js";
import injectionPatterns from "./patterns/injection-patterns.json" with { type: "json" };
import shellPatterns from "./patterns/shell-blocklist.json" with { type: "json" };
import type { Finding } from "./types.js";

const PI_COUNT = (injectionPatterns as unknown as unknown[]).length;
const SH_COUNT = (shellPatterns as unknown as unknown[]).length;
const UC_COUNT = 2;

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcError = { code: number; message: string; data?: unknown };

function respond(
  id: number | string | undefined,
  result?: unknown,
  error?: JsonRpcError,
): void {
  const msg: Record<string, unknown> = { jsonrpc: "2.0", id };
  if (error) msg.error = error;
  else msg.result = result;
  process.stdout.write(JSON.stringify(msg) + "\n");
}

const TOOLS = [
  {
    name: "scan_file",
    description:
      "Scan a single markdown file for prompt injection, dangerous shell commands, and hidden Unicode. Returns an array of findings.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the file to scan" },
      },
      required: ["path"],
    },
  },
  {
    name: "scan_directory",
    description:
      "Recursively scan all .md files in a directory. Returns { scanned, findings }.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute path to the directory to scan",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "get_pattern_count",
    description:
      "Return the number of patterns per detector and the total. Useful for verifying which version of SkillGuard is running.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

async function scanAll(filePath: string, content: string): Promise<Finding[]> {
  const [pi, sh, uc] = await Promise.all([
    scanForPromptInjection(filePath, content),
    scanForShellCommands(filePath, content),
    scanForHiddenUnicode(filePath, content),
  ]);
  return [...pi, ...sh, ...uc];
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  if (name === "get_pattern_count") {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            prompt_injection: PI_COUNT,
            shell_commands: SH_COUNT,
            unicode_groups: UC_COUNT,
            total: PI_COUNT + SH_COUNT + UC_COUNT,
          }),
        },
      ],
    };
  }

  if (name === "scan_file") {
    const path = args?.path;
    if (typeof path !== "string") throw new Error("scan_file requires { path: string }");
    const content = readFileSync(path, "utf8");
    const findings = await scanAll(path, content);
    return { content: [{ type: "text", text: JSON.stringify(findings) }] };
  }

  if (name === "scan_directory") {
    const path = args?.path;
    if (typeof path !== "string") throw new Error("scan_directory requires { path: string }");
    const stat = statSync(path);
    if (!stat.isDirectory()) throw new Error(`${path} is not a directory`);
    const files = await glob("**/*.md", { cwd: path, absolute: true, nodir: true });
    const all: Finding[] = [];
    for (const f of files) {
      const content = readFileSync(f, "utf8");
      all.push(...(await scanAll(f, content)));
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ scanned: files.length, findings: all }),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  let req: JsonRpcRequest;
  try {
    req = JSON.parse(line) as JsonRpcRequest;
  } catch {
    return;
  }

  try {
    if (req.method === "initialize") {
      respond(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "skillguard", version: "0.1.0" },
      });
    } else if (req.method === "notifications/initialized") {
      // notification, no response
    } else if (req.method === "tools/list") {
      respond(req.id, { tools: TOOLS });
    } else if (req.method === "tools/call") {
      const params = req.params ?? {};
      const toolName = params.name as string | undefined;
      const toolArgs = params.arguments as Record<string, unknown> | undefined;
      if (!toolName) {
        respond(req.id, undefined, {
          code: -32602,
          message: "tools/call requires params.name",
        });
        return;
      }
      const result = await handleToolCall(toolName, toolArgs);
      respond(req.id, result);
    } else {
      respond(req.id, undefined, {
        code: -32601,
        message: `Method not found: ${req.method}`,
      });
    }
  } catch (err) {
    respond(req.id, undefined, {
      code: -32000,
      message: (err as Error).message,
    });
  }
});

rl.on("close", () => process.exit(0));
