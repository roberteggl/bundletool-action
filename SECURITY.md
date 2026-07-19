# Security policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x   | :white_check_mark: |

## Reporting a vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Report security issues privately to [security@eggl.dev](mailto:security@eggl.dev).
Include:

- Description of the issue and potential impact
- Steps to reproduce
- Affected versions or commits
- Any suggested fix (optional)

You should receive an acknowledgment within a few business days. We will work
with you on a fix and coordinate disclosure.

## Scope

In scope:

- This repository’s action code (`src/`, `dist/index.js`, `action.yml`)
- Credential handling (keystore decoding, secret masking, temp file cleanup)
- Supply-chain risks (bundletool download URL, checksum verification)

Out of scope:

- Vulnerabilities in [Google bundletool](https://github.com/google/bundletool)
  itself (report upstream)
- Compromise of user-provided keystores or workflow secrets
- Misconfiguration in consumer workflows

## Security practices

- Signing passwords and base64 keystores are masked via `core.setSecret`
- Temporary signing material is written with restrictive permissions and cleaned
  up in a `finally` block
- Optional `bundletool-sha256` verifies the downloaded JAR digest
- `extra-args` cannot override first-class flags owned by the action
