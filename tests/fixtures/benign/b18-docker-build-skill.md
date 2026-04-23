# Docker Build Skill

Conventions for authoring Dockerfiles for Node.js services.

## Base image

Pin a specific Node.js major version and Alpine variant:

```dockerfile
FROM node:24-alpine
```

## Installing build dependencies

Use `apk` or `apt-get` under `sudo` only when strictly required. In most cases the image already runs as root during build:

```bash
sudo apt-get install -y build-essential
```

The developer should prefer multi-stage builds so build tooling never ships with the runtime image.

## Entrypoint permissions

Make the entrypoint executable with standard perms, not world-writable:

```dockerfile
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod 755 /usr/local/bin/entrypoint.sh
```

## Non-root runtime user

```dockerfile
RUN addgroup -S app && adduser -S app -G app
USER app
```

## Cache invalidation

Copy `package*.json` before `src/` so that the build system reuses the npm install layer across source changes.

```dockerfile
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
```
