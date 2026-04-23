# Python Subprocess Guide

Conventions for invoking external commands from Python safely.

## Prefer argv lists over shell strings

Pass arguments as a list. The build system documents this rule in PEP 8-style style guides.

```python
import subprocess

result = subprocess.run(
    ["git", "rev-parse", "HEAD"],
    capture_output=True,
    text=True,
    check=True,
)
print(result.stdout.strip())
```

This avoids shell interpolation entirely. The developer should prefer this form for every user-facing entry point.

## When shell features are needed

If you genuinely need pipes, redirection, or glob expansion, build the command string yourself with careful escaping — and use `shlex.quote()` for any interpolated segment.

```python
import shlex
import subprocess

name = shlex.quote(user_input)
subprocess.run(["sh", "-c", f"ls {name}"], check=True)
```

The explicit `sh -c` form makes the shell invocation visible in code review.

## Timeouts

Always set `timeout=` on subprocess calls. A hung child process will otherwise block the parent indefinitely.

## Error handling

Use `check=True` to raise `CalledProcessError` on non-zero exits. Log the command and exit code before re-raising.
