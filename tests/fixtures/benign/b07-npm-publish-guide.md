# npm Publish Guide

Walkthrough for publishing a TypeScript library to npm.

## Setup

Add `node_modules` and `dist` to `.gitignore` so Git will ignore them between builds.

```
node_modules/
dist/
*.log
```

## package.json essentials

```json
{
  "name": "my-lib",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"]
}
```

## Build

The build system compiles TypeScript to `dist/`:

```bash
npm run build
```

## Publish

```bash
npm login
npm publish --access public
```

## Versioning

Use semver:
- patch for bug fixes
- minor for new features
- major for breaking changes

## Release automation

`changesets` is a common tool for managing version bumps across a monorepo. It integrates with CI to publish on merge to main.
