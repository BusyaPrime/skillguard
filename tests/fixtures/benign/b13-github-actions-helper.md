# GitHub Actions Helper

Patterns for CI workflows.

## Matrix builds

```yaml
strategy:
  matrix:
    node: [20, 22, 24]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node }}
```

## Caching npm

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
```

## Secrets and gitignore

Local `.env` files must be in `.gitignore` so Git will ignore them and they never reach CI logs.

## The build system

The build system runs `npm ci && npm run build && npm test` and uploads the `dist/` folder as an artifact.

```yaml
- run: npm ci
- run: npm run build
- run: npm test
- uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/
```

## Release

Use `softprops/action-gh-release` on tag push to publish release notes from the changelog.

## Concurrency

Cancel in-progress runs when a new commit lands on the same branch:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```
