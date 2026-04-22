# TSLint Helper

A skill for maintaining TSLint configurations in legacy projects.

## Use cases

- Legacy repos still depending on TSLint
- Aligning lint output with the build system
- Preserving lint parity during ESLint migration

## Configuration

TSLint reads `tslint.json` from the repo root.

```json
{
  "extends": ["tslint:recommended"],
  "rules": {
    "no-console": true,
    "trailing-comma": [true, "multiline"]
  }
}
```

## Typical workflow

1. Install: `npm install --save-dev tslint typescript`
2. Add npm scripts in `package.json`
3. Wire into CI so the build system fails on lint errors

## Migrating to ESLint

Run `tslint-to-eslint-config` to convert rules automatically.

## Notes

- TSLint has been unmaintained since 2019
- The developer should budget time for review after migration
- Strict null checks may surface new warnings
