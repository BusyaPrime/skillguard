import { describe, it, expect } from "vitest";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BIN = resolve(REPO_ROOT, "bin/skillguard-mcp.js");
const DIST = resolve(REPO_ROOT, "dist/mcp-server.js");

async function sendRequests(
  requests: object[],
): Promise<Array<Record<string, unknown>>> {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn("node", [BIN], {
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let err = "";
    proc.stdout.on("data", (c: Buffer) => {
      output += c.toString();
    });
    proc.stderr.on("data", (c: Buffer) => {
      err += c.toString();
    });
    proc.on("error", rejectPromise);
    proc.on("close", (code) => {
      if (code !== 0) return rejectPromise(new Error(`mcp exit ${code}: ${err}`));
      const lines = output.trim().split("\n").filter(Boolean);
      try {
        resolvePromise(lines.map((l) => JSON.parse(l)));
      } catch (e) {
        rejectPromise(new Error(`parse fail: ${e}; out=${output}`));
      }
    });
    for (const req of requests) proc.stdin.write(JSON.stringify(req) + "\n");
    proc.stdin.end();
  });
}

describe("MCP server smoke", () => {
  it("dist/mcp-server.js exists (run npm run build first)", () => {
    expect(existsSync(DIST)).toBe(true);
  });

  it("responds to initialize with server info and tools capability", async () => {
    const [resp] = await sendRequests([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { capabilities: {} } },
    ]);
    expect(resp.id).toBe(1);
    const result = resp.result as any;
    expect(result.serverInfo.name).toBe("skillguard");
    expect(result.capabilities.tools).toBeDefined();
    expect(result.protocolVersion).toBe("2024-11-05");
  });

  it("tools/list returns scan_file, scan_directory, get_pattern_count", async () => {
    const responses = await sendRequests([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
    ]);
    const listResp = responses.find((r) => r.id === 2) as any;
    const names = (listResp.result.tools as Array<{ name: string }>).map(
      (t) => t.name,
    );
    expect(names).toContain("scan_file");
    expect(names).toContain("scan_directory");
    expect(names).toContain("get_pattern_count");
  });

  it("tools/call get_pattern_count returns expected totals", async () => {
    const responses = await sendRequests([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "get_pattern_count", arguments: {} },
      },
    ]);
    const callResp = responses.find((r) => r.id === 2) as any;
    const text = callResp.result.content[0].text as string;
    const counts = JSON.parse(text);
    expect(counts.prompt_injection).toBe(30);
    expect(counts.shell_commands).toBe(18);
    expect(counts.unicode_groups).toBe(2);
    expect(counts.total).toBe(50);
  });

  it("unknown method returns -32601", async () => {
    const responses = await sendRequests([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
      { jsonrpc: "2.0", id: 2, method: "bogus/method" },
    ]);
    const err = responses.find((r) => r.id === 2) as any;
    expect(err.error.code).toBe(-32601);
  });
});
