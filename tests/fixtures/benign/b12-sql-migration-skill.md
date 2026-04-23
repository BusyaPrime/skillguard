# SQL Migration Skill

Guidance for writing safe forward migrations.

## Principles

- One logical change per migration
- Migrations must be reversible in staging
- Never rewrite history of applied migrations

The developer should verify each migration on a clone of production before running it live.

## Naming

`YYYYMMDDHHMMSS_short_description.sql`

## Safe alter patterns

### Adding a column

```sql
ALTER TABLE users ADD COLUMN signup_source text;
```

### Backfilling

For large tables, batch the backfill:

```sql
UPDATE users
SET signup_source = 'unknown'
WHERE signup_source IS NULL
  AND id BETWEEN 0 AND 10000;
```

## Migrating from a previous version

When moving between major versions of the schema, write a compatibility view so old code keeps working during rollout.

## Tooling

- `sqitch`
- `goose`
- `flyway`

## Review notes

Every migration PR should include:
- the forward SQL
- the reverse SQL (if feasible)
- a short note on expected duration under prod load
