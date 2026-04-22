# SkillGuard

Security scanner for Claude Code skills, MCP servers, and CLAUDE.md files.

You install skills from GitHub. You trust that they do what they say. But a SKILL.md is just a markdown file — and markdown is read by an LLM that can execute code on your machine. One line of "ignore previous instructions" buried in an otherwise normal-looking skill, and your agent is no longer working for you.

SkillGuard scans skill files before you install them. It checks for prompt injection patterns, data exfiltration phrases, permission bypass attempts, and obfuscation tricks. It takes five seconds and requires no API key.

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
| Obfuscation | Long base64/hex outside code blocks, hidden whitespace text, HTML comment smuggling, ROT13/leetspeak markers | WARNING / INFO |

26 patterns total. Each documented with references to OWASP LLM Top 10 and published prompt injection research.

## How it works

No AI, no API key, no network calls. Just regex pattern matching against a hand-curated catalog of known-bad strings.

The scanner reads each `.md` file, runs all 26 patterns against the text, and reports matches with file, line number, and a short snippet for context. Context-aware severity adjustments handle common false-positive scenarios — for example, base64 inside a fenced code block is downgraded to INFO since it is likely a legitimate data fixture.

Exit code is 1 if any CRITICAL finding exists, 0 otherwise. Use it in CI.

## JSON output

```bash
npx skillguard scan ./skills --json
```

## Why this exists

Anthropic's own documentation warns that skills can execute arbitrary code and should be reviewed before installation. But nobody reviews a 200-line SKILL.md by hand — and the growing ecosystem of community skills, marketplace plugins, and awesome-lists has no automated verification.

SkillGuard does not replace human review. It catches the obvious stuff so you can focus on the subtle stuff.

## Roadmap

- **Shell command scanner** — detect dangerous commands in embedded scripts
- **Hidden Unicode detector** — zero-width characters, RTL overrides, homoglyph substitutions
- **Repository reputation check** — GitHub account age, follower count, star velocity
- **--deep mode** — optional LLM-as-judge pass for patterns too nuanced for regex

## Limitations

This is regex-based pattern matching, not AI comprehension. It catches known-bad literal strings and their common variants. A sufficiently creative attacker can evade it. Defense in depth — use SkillGuard as one layer, not the only layer.

The scanner has no knowledge of what a skill is supposed to do. It can tell you "this file contains a phrase that looks like prompt injection" but not "this skill's stated purpose does not match its actual behavior." That is what --deep mode will address.

## License

MIT
