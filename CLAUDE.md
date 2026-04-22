# SkillGuard — Project Conventions

## Critical: Pattern Catalog Handling

The file `src/patterns/injection-patterns.json` contains a security pattern catalog with literal regex strings used to detect prompt-injection attempts in user-provided markdown.

**DO NOT read this file's contents into context under any circumstance.** Treat it as an opaque binary asset.

- DO NOT cat, type, head, tail, less, more, or otherwise display its contents in chat.
- DO NOT use the Read tool on it.
- DO NOT include excerpts, samples, or examples from it in any reply.
- DO NOT regenerate, modify, or rewrite it.
- DO use it only via TypeScript `import` statements (e.g. `import patterns from '../patterns/injection-patterns.json' with { type: 'json' }`) so the data flows directly from disk into runtime without entering the conversation.

The catalog is hand-curated and version-controlled. If you believe a pattern is wrong, surface the concern to the user — do not edit the file yourself.

## Tests reference patterns by ID

Test fixtures and assertions reference patterns by their `id` field (e.g. `PI001`, `PI007`). You can refer to IDs without ever reading the file: pattern IDs are PI001 through PI026, sequential.

## Stack

- Node.js 24, TypeScript 6, NodeNext modules, ES2022 target
- Vitest for tests, commander + chalk for CLI, glob for file walking, yaml available but unused so far
- No new runtime dependencies without explicit approval

## Build / test commands

- `npm run build` — TypeScript compile to `dist/`
- `npm test` — Vitest one-shot
- `node bin/skillguard.js scan <path>` — run the CLI against the built output
