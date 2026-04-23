# Git Hooks Skill

Patterns for project-tracked Git hooks.

## Enabling tracked hooks

Git looks in `.git/hooks/` by default, which is not committed. Point Git at a tracked directory instead:

```bash
git config core.hooksPath .githooks
```

After that, scripts in `.githooks/` run for every developer on the repo. The developer should make them executable:

```bash
chmod 755 .githooks/pre-commit
```

## Pre-commit example

```bash
#!/usr/bin/env bash
set -euo pipefail

# Run type-check and tests before allowing the commit
npm run build
npm test
```

## Commit-msg example

```bash
#!/usr/bin/env bash
set -euo pipefail

# Reject commit messages with a single word
if ! grep -qE '.{10,}' "$1"; then
  echo "Commit message must be at least 10 characters"
  exit 1
fi
```

## Skipping hooks

Developers follow the project's instructions on when it's acceptable to skip hooks with `--no-verify`. The short answer: almost never.

## Installing for new clones

Add a `postinstall` script in `package.json` that runs `git config core.hooksPath .githooks` so the setting is applied on `npm install`.
