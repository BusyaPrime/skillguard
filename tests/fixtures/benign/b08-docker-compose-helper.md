# Docker Compose Helper

Patterns for local development with docker-compose.

## Basic service

```yaml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    volumes:
      - .:/app
      - /app/node_modules
```

## Volumes and gitignore

Docker-created volume directories should be added to `.gitignore` so Git will ignore them:

```
.docker/
.postgres-data/
```

## Postgres service

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD: devsecret
    volumes:
      - .postgres-data:/var/lib/postgresql/data
```

## Common commands

```bash
docker compose up -d
docker compose logs -f api
docker compose down
```

## Healthchecks

Add healthchecks to ensure dependent services start in order:

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U app"]
    interval: 5s
    retries: 5
```
