# SkillGuard

![CI](https://github.com/OWNER/skillguard/actions/workflows/ci.yml/badge.svg)

Security scanner for Claude Code skills, MCP servers, and CLAUDE.md files.

You install skills from GitHub. You trust that they do what they say. But a SKILL.md is just a markdown file — and markdown is read by an LLM that can execute code on your machine. One line of "ignore previous instructions" buried in an otherwise normal-looking skill, and your agent is no longer working for you.

SkillGuard scans skill files before you install them. It checks for prompt injection patterns, dangerous shell commands, and hidden Unicode tricks. It takes five seconds and requires no API key.

## Install

```bash
npx skillguard scan ~/.claude/skills
```

That is it. Scans every `.md` file in the directory and prints what it finds.

Scan a single file:

```bash
npx skillguard scan ./some-skill/SKILL.md
```

Scan a repo before you install it:

```bash
git clone https://github.com/someone/cool-skill /tmp/cool-skill
npx skillguard scan /tmp/cool-skill
```

## What it catches

| Category | What it looks for | Severity |
|---|---|---|
| Instruction override | Ignore-previous-instructions variants, role-swap phrases, fake system tags | CRITICAL |
| Prompt smuggling | Model-specific delimiter tokens, fake role headers, system-boundary headings | CRITICAL / WARNING |
| Data exfiltration | Requests to read or send sensitive files, environment variable dumping, encode-and-send patterns | CRITICAL |
| Permission bypass | Run-without-asking phrases, unsafe CLI flags, disable-safety-checks instructions | CRITICAL |
| Obfuscation (prompt) | Long base64/hex outside code blocks, HTML comment smuggling | CRITICAL / WARNING / INFO |
| Shell commands | `curl \| bash`, `rm -rf $HOME`, reverse shells, credential reads, base64-decode-pipe-exec, history tampering, crontab injection, writes to dotfiles | CRITICAL / WARNING |
| Hidden Unicode | Zero-width characters (ZWSP/ZWNJ/ZWJ), bidirectional overrides (RLO/LRO/isolate controls) | CRITICAL / WARNING |

**50 patterns total** across three detectors (30 prompt-injection + 18 shell-command + 2 Unicode groups). Each prompt-injection entry is documented with references to OWASP LLM Top 10 and published prompt-injection research.

## How it works

No AI, no API key, no network calls. Just regex pattern matching against a hand-curated catalog of known-bad strings plus a small Unicode block scanner.

The scanner reads each `.md` file and runs three detectors over the content:

- **prompt-injection** — 30 catalog patterns targeting instruction-override, role-swap, token smuggling, exfiltration, obfuscation, deception ("do not tell the user"), and jailbreak framing.
- **shell-command** — 18 catalog patterns targeting dangerous shell invocations (remote-execution pipes, destructive commands, credential reads, persistence primitives, history tampering, Python `subprocess(..., shell=True)`, npm lifecycle-hook pipes, DNS exfiltration, firewall disable, killing security daemons). Blockquoted examples (Markdown `> `) are ignored so "what NOT to do" snippets in docs don't false-positive.
- **hidden-unicode** — scans for zero-width and bidirectional control codepoints that can hide text from human reviewers.

Context-aware severity adjustments handle common false-positive scenarios — for example, a long base64 blob inside a fenced code block is downgraded to INFO since it is likely a legitimate data fixture. A zero-width character found inside a code block (e.g. a Unicode discussion) is likewise downgraded.

Exit code is 1 if any CRITICAL finding exists, 0 otherwise. Use it in CI.

## JSON output

```bash
npx skillguard scan ./skills --json
```

Emits an array of Finding objects with `file`, `line`, `column`, `patternId`, `severity`, `category`, `description`, `snippet`, and `detector`.

## Why this exists

Anthropic's own documentation warns that skills can execute arbitrary code and should be reviewed before installation. But nobody reviews a 200-line SKILL.md by hand — and the growing ecosystem of community skills, marketplace plugins, and awesome-lists has no automated verification.

SkillGuard does not replace human review. It catches the obvious stuff so you can focus on the subtle stuff.

## Roadmap

- **Repository reputation check** — GitHub account age, follower count, star velocity
- **--deep mode** — optional LLM-as-judge pass for patterns too nuanced for regex
- **MCP server manifest scanning** — extend beyond `.md` to detect risky tool descriptors

## Limitations

This is regex-based pattern matching, not AI comprehension. It catches known-bad literal strings and their common variants. A sufficiently creative attacker can evade it. Defense in depth — use SkillGuard as one layer, not the only layer.

The scanner has no knowledge of what a skill is supposed to do. It can tell you "this file contains a phrase that looks like prompt injection" but not "this skill's stated purpose does not match its actual behavior." That is what --deep mode will address.

## MCP Server

SkillGuard ships with an MCP (Model Context Protocol) server. Add it to Claude Code, Cursor, or any MCP-compatible client so your agent can scan skills on demand:

```json
{
  "mcpServers": {
    "skillguard": {
      "command": "npx",
      "args": ["-y", "skillguard-mcp"]
    }
  }
}
```

The server exposes three tools over stdio JSON-RPC:

- `scan_file({ path })` — scan a single file, returns findings array
- `scan_directory({ path })` — recursively scan a directory of `.md` files
- `get_pattern_count()` — report detector sizes (useful for verifying which build is running)

No authentication, no network calls — the server reads files locally and runs the same three detectors as the CLI.

## Claude Code Plugin

The repository also includes a Claude Code plugin bundle (`plugin/`) that registers a `security-scan` skill. Install it as a plugin to make SkillGuard available as an agent skill with guidance on how and when to invoke the CLI.

## Contributing

PRs welcome. Run `npm test` before submitting. See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## License

MIT
