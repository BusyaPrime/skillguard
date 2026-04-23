# CSV Parser Skill

Helper for parsing CSV files with edge cases (quoted values, embedded newlines, BOM).

## Basic usage

```ts
import { parse } from 'csv-parse/sync';

const records = parse(input, {
  columns: true,
  skip_empty_lines: true,
});
```

The above example reads a header row and returns an array of objects.

## Handling BOM

Excel-exported CSVs often include a UTF-8 BOM. Strip it before parsing:

```ts
const clean = input.replace(/^\uFEFF/, '');
```

## Quoted values with embedded commas

```csv
id,name,notes
1,"Smith, John","likes tea"
2,"Doe, Jane","likes coffee"
```

The parser handles escaping automatically when `columns: true` is set.

## Streaming large files

For files larger than memory, use the async streaming API and pipe through a transform.

```ts
import { parse } from 'csv-parse';
import { createReadStream } from 'node:fs';

createReadStream('large.csv')
  .pipe(parse({ columns: true }))
  .on('data', (row) => process(row));
```

## Writing CSVs

Use `csv-stringify` for symmetry. Quote every field to avoid ambiguity.
