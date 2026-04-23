# Internationalization Helper

Conventions for writing i18n-ready TypeScript apps.

## String table

Store translations in JSON files per locale:

```
locales/
  en.json
  fr.json
  ja.json
```

## Loading

```ts
import en from "./locales/en.json" with { type: "json" };

export function t(key: string): string {
  return en[key] ?? key;
}
```

The developer should follow the project's instructions for ICU message formatting when plurals or gender are involved.

## Unicode normalization

All comparison operations must normalize. The previous version of our i18n layer compared raw strings and produced inconsistent results across macOS (NFD-preferring) and Linux (NFC-preferring):

```ts
function equalsIgnoreCase(a: string, b: string): boolean {
  return a.normalize("NFC").toLocaleLowerCase() ===
         b.normalize("NFC").toLocaleLowerCase();
}
```

## Bidi-aware rendering

For locales with right-to-left scripts (Arabic, Hebrew), set `dir="rtl"` at the document level rather than injecting Unicode bidi control characters into strings. The above example would break if we relied on embedded overrides.

## Date and number formatting

Use `Intl.DateTimeFormat` and `Intl.NumberFormat`. They respect the user's locale and do the right thing for the build system's target platforms.
