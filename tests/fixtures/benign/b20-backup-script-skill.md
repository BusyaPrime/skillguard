# Backup Script Skill

Patterns for writing nightly backup scripts.

## Script outline

```bash
#!/usr/bin/env bash
set -euo pipefail

SRC=/var/lib/app
DEST=/srv/backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

tar czf "$DEST/app-$STAMP.tar.gz" "$SRC"
```

## Scheduling

Run the script nightly via the system scheduler. The previous version of this runbook described a loop in Python; cron is simpler.

The documented cron entry looks like:

```
0 2 * * * /usr/local/bin/app-backup.sh >> /var/log/app-backup.log 2>&1
```

The developer should install this entry by pasting it into the scheduler file with their preferred editor. Do not pipe arbitrary content into the scheduler — always review before saving.

## Retention

Keep 14 daily, 8 weekly, 6 monthly. Run `find` with `-mtime` to prune older archives.

## Restore drill

Once a month, pull an archive to a staging host and exercise restore. Above example assumes one-host backups; for multi-host, extend with a per-host prefix.
