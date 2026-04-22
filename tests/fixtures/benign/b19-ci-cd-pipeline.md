# CI/CD Pipeline Skill

Reference for authoring deploy pipelines with SSH-based artifact transfer.

## SSH agent setup

Bring up an ephemeral SSH agent inside the job and load the deploy key from a secret:

```bash
eval $(ssh-agent)
ssh-add <(echo "$DEPLOY_KEY_BASE64" | base64 -d)
```

The `eval $(ssh-agent)` pattern is standard — it captures `SSH_AUTH_SOCK` and `SSH_AGENT_PID` into the current shell. Nothing here runs attacker-controlled input.

Developers follow the project's instructions in `deploy.md` for which secrets map to which environment.

## Deploy step

```bash
rsync -az --delete dist/ "deploy@$HOST:/srv/app/"
ssh "deploy@$HOST" "systemctl --user restart app"
```

## Rollback

The previous version of the artifact lives at `/srv/app.prev/`. Swap the symlink to roll back.

## Notifications

On failure, POST a summary to the team's incident webhook. Don't include secrets in the payload.
