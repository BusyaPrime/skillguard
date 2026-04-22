# Sentry Integration Skill

Patterns for instrumenting a Node.js service with Sentry.

## Install

```bash
npm install @sentry/node
```

## Init

```ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  release: process.env.GIT_SHA,
});
```

The above example reads configuration from environment variables and sets a 10% trace sample rate.

## Source maps

The build system uploads source maps to Sentry during the release step:

```bash
sentry-cli releases files $GIT_SHA upload-sourcemaps ./dist
```

## Capturing

```ts
try {
  await doWork();
} catch (err) {
  Sentry.captureException(err);
  throw err;
}
```

## PII filtering

Configure `beforeSend` to scrub obvious PII from event payloads before they leave the process.

## Performance

Sentry supports tracing for HTTP and database spans. Start with a low sample rate (1-10%) and raise it once the ingest budget is understood.
