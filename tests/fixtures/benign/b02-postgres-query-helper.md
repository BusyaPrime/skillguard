# Postgres Query Helper

Patterns for writing safe and performant PostgreSQL queries in application code.

## Parameterized queries

Always use parameter binding, never string interpolation:

```sql
SELECT id, email FROM users WHERE id = $1
```

## Common patterns

### Pagination with keyset

```sql
SELECT id, created_at FROM events
WHERE id > $1
ORDER BY id ASC
LIMIT 50
```

The above example scales well because the index on `id` supports both the filter and the order.

### Upsert

```sql
INSERT INTO counters (key, value) VALUES ($1, 1)
ON CONFLICT (key) DO UPDATE SET value = counters.value + 1
```

## Migrating queries

If you are upgrading from a previous version of PostgreSQL, check that your queries still use supported syntax. Window function behavior changed between 11 and 12.

## Indexes

Partial indexes reduce size when only a subset of rows is queried:

```sql
CREATE INDEX idx_active_users ON users (email) WHERE deleted_at IS NULL
```

## Explain plans

Use `EXPLAIN (ANALYZE, BUFFERS)` to see actual row counts and cache behavior.
