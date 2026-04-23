---
name: security-scan
description: Scan skill files, SKILL.md files, CLAUDE.md files, and MCP server descriptions for prompt injection, dangerous shell commands, and hidden Unicode. Use when the user asks to check if a skill is safe, before installing a new skill, or when reviewing security of installed skills.
when_to_use: When user asks "is this skill safe", "scan my skills", "check for prompt injection", "review this SKILL.md", "security check", or before installing any skill from an untrusted source.
---

# Security Scan

You have access to SkillGuard, a security scanner for Claude Code skills.

## How to use

Run the CLI to scan files or directories:

```bash
npx skillguard scan <path>
```

Common paths to scan:
- `~/.claude/skills/` — all installed user skills
- `./.claude/skills/` — project-level skills
- Any directory containing SKILL.md or CLAUDE.md files

## Options

- `--json` — output findings as JSON (useful for programmatic processing)
- `--deep` — (coming soon) use LLM-as-judge for deeper analysis

## Interpreting results

- **CRITICAL** — high-confidence security issue, do not install without review
- **WARNING** — suspicious but may be legitimate, review manually
- **INFO** — informational, likely benign but flagged for awareness

## What it catches

Three detection engines:

1. **Prompt injection** — 30 patterns detecting instruction overrides, delimiter smuggling, data exfiltration requests, permission bypass, obfuscation, and deception ("do not tell the user" style directives).
2. **Shell commands** — 18 patterns detecting dangerous shell execution (`curl | bash`, reverse shells, base64-decode-exec), credential access, persistence (dotfile writes, cron injection), defense evasion (firewall disable, killing security tools), and supply-chain hooks (npm preinstall pipes).
3. **Hidden Unicode** — zero-width characters (ZWSP/ZWNJ/ZWJ) and bidirectional overrides (RLO/LRO/isolate controls) that can hide text from human reviewers.

If CRITICAL findings are found, recommend the user not install the skill and surface the specific pattern IDs and file locations. If only WARNING findings are found, show them to the user and let them decide. For INFO findings, mention only if the user asks for full detail.
