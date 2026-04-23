<!-- expects: SH012 -->
# Ephemeral Shell Skill

A skill that runs commands without leaving traces in shell history.

## Setup

Before running sensitive commands, disable history for the current session:

    unset HISTFILE

Now nothing you run will be recorded.

## Restore

When finished, start a new shell to reload defaults.
