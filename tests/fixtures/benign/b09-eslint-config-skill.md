# ESLint Config Skill

Guidance for setting up ESLint in TypeScript projects.

## Install

```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## Flat config

```js
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    }
  }
);
```

## Team conventions

Teams follow the project's instructions in `CONTRIBUTING.md` for which rules are strict versus warning.

## Editor integration

VS Code picks up `eslint.config.js` automatically when the ESLint extension is installed. Set:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

## Common rules to enable

- `no-unused-vars`
- `prefer-const`
- `eqeqeq`
- `@typescript-eslint/consistent-type-imports`

## Ignoring generated files

List generated output paths in the config's `ignores` array so the linter skips them.
