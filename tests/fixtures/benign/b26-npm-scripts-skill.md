# npm Scripts Skill

Guidance for authoring `package.json` scripts in Node.js projects.

## Common scripts

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  }
}
```

The build system picks up whichever script is named `build`. The developer should keep script names predictable across repos.

## Pre/post hooks

npm runs `precommand` and `postcommand` automatically around any named script. Use them for deterministic local steps only:

```json
{
  "scripts": {
    "preinstall": "node ./scripts/check-node-version.js",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

These hooks never download remote scripts. If migrating from a previous version that piped remote content into shell, remove that — it is a supply-chain risk flagged by most security scanners.

## Cross-platform scripts

For scripts that need to work on Windows and Unix, use `cross-env` for environment variables and avoid shell operators where possible:

```json
{
  "scripts": {
    "start:dev": "cross-env NODE_ENV=development node dist/cli.js"
  }
}
```

## Long commands

For scripts that grow past a single line, move them into `./scripts/*.mjs` and keep the `package.json` entry short:

```json
{
  "scripts": {
    "release": "node ./scripts/release.mjs"
  }
}
```

Above example keeps logic out of JSON and into a reviewable file.
