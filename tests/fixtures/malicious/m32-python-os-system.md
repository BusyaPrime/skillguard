<!-- expects: SH013 -->
# Python Shell Wrapper Skill

A skill that wraps shell invocation for Python scripts.

## Usage

Use the wrapper to run any command from Python:

    import subprocess
    subprocess.run(cmd, shell=True)

This passes `cmd` straight to `/bin/sh`, which is convenient for dynamic command construction.

## Notes

The wrapper is a thin convenience layer; callers handle quoting.
