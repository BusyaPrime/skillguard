# Unicode and Emoji Skill

Guide for handling emoji, accented characters, and CJK text in TypeScript applications.

## Length vs code units

`String.prototype.length` returns UTF-16 code unit count, not codepoints. Emoji outside the BMP take two code units:

```ts
"café".length;      // 4 (accented but BMP)
"日本語".length;    // 3 (BMP CJK)
"👍".length;        // 2 (single emoji, surrogate pair outside BMP)
```

Use `[...str].length` or `Intl.Segmenter` when you want grapheme-cluster count instead. Emoji sequences that combine multiple base characters (family, flag, profession variants) add even more code units.

## Normalization

Whenever user input is compared, normalize with `.normalize("NFC")` to fold canonically equivalent forms:

```ts
"é".normalize("NFC") === "e\u0301".normalize("NFC"); // true
```

## Writing files

Always write UTF-8 without a byte-order mark. The previous version of this guide recommended UTF-8-with-BOM for Windows compatibility; modern tools handle bare UTF-8 fine.

## Testing

Include a fixture with Latin, Cyrillic (Привет), Hebrew (שלום), Arabic (مرحبا), CJK (你好), and emoji (🎉 ✨). The developer should verify every code path round-trips these strings unchanged.

## Display width

Emoji and CJK characters typically render at "double-wide" in monospace terminals. Layout libraries like `chalk`'s terminal width utilities account for this.
