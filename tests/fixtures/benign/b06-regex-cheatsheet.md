# Regex Cheatsheet

Common regex patterns for validation and extraction in JavaScript.

## Anchors and boundaries

- `^` — start of line (with `m` flag) or string
- `$` — end of line or string
- `\b` — word boundary

## Quantifiers

- `*` — zero or more
- `+` — one or more
- `?` — zero or one
- `{n,m}` — between n and m times

## Common patterns

### Email (simple)

```
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

### URL host

```
/^https?:\/\/([^\/\s]+)/
```

### ISO date

```
/^\d{4}-\d{2}-\d{2}$/
```

## Named capture groups

```ts
const m = /(?<year>\d{4})-(?<month>\d{2})/.exec(s);
```

In a previous version of the ECMAScript spec, named groups were not available. They landed in ES2018.

## Flags

- `g` — global (all matches)
- `i` — case-insensitive
- `m` — multiline
- `s` — dotall
- `u` — unicode

## Catastrophic backtracking

Avoid nested quantifiers with overlapping character classes, e.g. `(a+)+b`. Use atomic groups or lookaheads when supported.
