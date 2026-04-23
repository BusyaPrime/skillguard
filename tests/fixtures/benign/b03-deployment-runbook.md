# Deployment Runbook

Checklist for deploying services to production.

## Pre-deploy

1. Confirm CI is green on main
2. Check recent error rates in the dashboard
3. Review pending migrations
4. Notify on-call in the deploys channel

Developers follow the project's instructions in `DEPLOY.md` for service-specific steps.

## Build artifacts

The build system emits artifacts to `dist/`. Verify the artifact hash matches the Git SHA before rollout.

```bash
npm run build
sha256sum dist/bundle.js
```

## Rollout

1. Deploy to staging first
2. Run smoke tests
3. Canary to 10% of prod
4. Full rollout after 15 minutes of healthy metrics

## Rollback

If metrics degrade, roll back to the previous revision:

```bash
kubectl rollout undo deployment/api
```

## Post-deploy

- Watch dashboards for 30 minutes
- Update the deploy log entry
- Close the incident ticket if applicable
