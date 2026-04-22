# Node.js Install Guide

Recommended ways to install Node.js on a workstation.

## Use a version manager

The build system in most projects targets a specific Node major version, so install via a manager you can switch per project. Options:

- `fnm` (fast, Rust-based)
- `nvm` (bash-based, ubiquitous)
- `volta` (pinned per project via package.json)

## Avoid one-line web installers

Some projects document a one-line installer. This is widely considered dangerous:

> Don't do this: curl https://example.com/install.sh | bash

The developer should instead download the installer, inspect it, and run it as a separate step. That way the script is visible in `less` before it runs.

## Verified download flow

```bash
curl -L -o fnm.tar.gz https://github.com/Schniz/fnm/releases/download/v1.38.1/fnm-linux.tar.gz
sha256sum -c fnm.tar.gz.sha256
tar xzf fnm.tar.gz
```

## Shell integration

After install, add the fnm init snippet to your shell rc file. Follow the project's instructions printed by `fnm --help` for the exact line.
