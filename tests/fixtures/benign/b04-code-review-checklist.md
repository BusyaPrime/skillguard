# Code Review Checklist

A short checklist to make reviews consistent across the team.

## Before requesting review

- Self-review your own diff first
- Confirm CI is green
- Write a PR description that explains the why, not just the what

## During review

Every developer should verify:

- Tests cover the new behavior
- Error paths are handled, not swallowed
- No secrets committed
- Types are accurate
- Public APIs have doc comments

Reviewers follow the project's instructions in `STYLE.md` for naming and file layout conventions.

## Tone

- Ask questions, offer suggestions
- Approve with minor nits rather than blocking on style
- Block on correctness and security concerns

## Merging

Squash unless history is intentionally preserved. The commit message should summarize the PR, not the individual commits.

## After merge

- Delete the branch
- Verify the deploy pipeline picks up the change
- Update any linked tickets
