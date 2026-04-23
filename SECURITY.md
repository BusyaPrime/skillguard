# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities via [GitHub Security Advisories](https://github.com/BusyaPrime/skillguard/security/advisories/new) rather than opening a public issue.

You should receive an initial response within 48 hours.

## Scope

SkillGuard is a static pattern-matching scanner. It:

- Does **not** execute scanned files
- Does **not** make network requests
- Does **not** load or evaluate code from inputs

The primary attack surface is regex denial-of-service (ReDoS) via crafted input that triggers catastrophic backtracking. Reports of patterns with pathological complexity on specific input are welcome.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
