# Bundletool Action

[![Continuous Integration](https://github.com/roberteggl/bundletool-action/actions/workflows/ci.yml/badge.svg)](https://github.com/roberteggl/bundletool-action/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/roberteggl/bundletool-action/graph/badge.svg?token=YST64KYO88)](https://codecov.io/github/roberteggl/bundletool-action)
![Coverage](./badges/coverage.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GitHub Action that converts Android App Bundles (`.aab`) into APKs using
[Google bundletool](https://developer.android.com/tools/bundletool).

> **Status:** Milestone 6 — AAB → universal APK, plus device-specific
> `extract-apks` from an existing `.apks` archive.

## Features

- Automatic bundletool download with version pinning and caching
- Universal APK and `.apks` generation
- Optional APK signing from a keystore path or base64 GitHub Secret
- Device-specific APK extraction via `extract-apks`
- Dry-run and verbose logging
- Forward-compatible `extra-args` for new bundletool flags

## Usage

### Universal APK from AAB

```yaml
- name: Setup Java
  uses: actions/setup-java@v5
  with:
    distribution: temurin
    java-version: '17'

- name: Build universal APK from AAB
  id: bundletool
  uses: roberteggl/bundletool-action@main
  with:
    aab-file: app/build/outputs/bundle/release/app-release.aab
    bundletool-version: '1.18.3'
    keystore-base64: ${{ secrets.KEYSTORE_BASE64 }}
    keystore-password: ${{ secrets.KEYSTORE_PASSWORD }}
    key-alias: ${{ secrets.KEY_ALIAS }}
    key-password: ${{ secrets.KEY_PASSWORD }}
    mode: universal
    extract-universal-apk: true
    verbose: true

- name: Upload APK
  uses: actions/upload-artifact@v4
  with:
    name: app-apk
    path: ${{ steps.bundletool.outputs.apk-path }}
```

### Device-specific APKs from an `.apks` archive

```yaml
- name: Extract APKs for a device
  id: extract
  uses: roberteggl/bundletool-action@main
  with:
    command: extract-apks
    apks-file: app-release.apks
    device-spec: device-spec.json
    output-dir: extracted-apks
    verbose: true

- name: Upload device APKs
  uses: actions/upload-artifact@v4
  with:
    name: device-apks
    path: ${{ steps.extract.outputs.output-dir }}
```

Dry-run resolves bundletool and plans the command without downloading or
executing:

```yaml
- name: Plan bundletool conversion
  uses: roberteggl/bundletool-action@main
  with:
    aab-file: app/build/outputs/bundle/release/app-release.aab
    dry-run: true
    verbose: true
```

Configuration is validated up front: unknown commands/modes, reserved
`extra-args`, invalid SHA-256 digests, and incomplete signing inputs fail fast
with clear errors. Secrets are masked in logs via `core.setSecret`.

## Inputs

| Input                   | Required         | Default      | Description                    |
| ----------------------- | ---------------- | ------------ | ------------------------------ |
| `aab-file`              | for `build-apks` | -            | Path to the `.aab` file        |
| `apks-file`             | for `extract-apks` | -          | Path to an existing `.apks`    |
| `command`               | no               | `build-apks` | `build-apks` or `extract-apks` |
| `mode`                  | no               | `universal`  | Bundletool build mode          |
| `output`                | no               | -            | Output `.apks` / APK path      |
| `output-dir`            | for `extract-apks` | -          | Directory for extracted APKs   |
| `bundletool-version`    | no               | `latest`     | Bundletool release tag         |
| `bundletool-url`        | no               | -            | Override JAR download URL      |
| `bundletool-sha256`     | no               | -            | Expected JAR checksum          |
| `cache`                 | no               | `true`       | Cache the JAR via tool-cache   |
| `java-bin`              | no               | `java`       | Java executable                |
| `keystore`              | no               | -            | Path to keystore file          |
| `keystore-base64`       | no               | -            | Base64-encoded keystore        |
| `keystore-password`     | no               | -            | Keystore password              |
| `key-alias`             | no               | -            | Key alias                      |
| `key-password`          | no               | -            | Key password                   |
| `sign`                  | no               | `true`       | Sign when keystore is provided |
| `device-spec`           | for `extract-apks` | -          | Device specification JSON      |
| `extract-universal-apk` | no               | `true`       | Extract `universal.apk`        |
| `keep-apks`             | no               | `true`       | Keep the `.apks` archive       |
| `extra-args`            | no               | -            | Extra bundletool CLI args      |
| `working-directory`     | no               | `.`          | Base directory for paths       |
| `dry-run`               | no               | `false`      | Validate and plan only         |
| `verbose`               | no               | `false`      | Verbose logging                |

For `build-apks`, `device-spec` is optional and is forwarded to bundletool when
set (prefer `mode: default` for device-targeted builds).

## Outputs

| Output               | Description                           |
| -------------------- | ------------------------------------- |
| `apks-path`          | Path to the `.apks` archive           |
| `apk-path`           | Path to the extracted universal APK   |
| `output-dir`         | Directory containing extracted APKs   |
| `bundletool-version` | Resolved bundletool version           |
| `bundletool-path`    | Path to the bundletool JAR            |

## Development

Requires Node.js 24+ and [pnpm](https://pnpm.io/) 10+.

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm package
```

Lint and format with Biome:

```bash
pnpm lint
pnpm format:write
```

Run the action locally:

```bash
cp .env.example .env
pnpm local-action
```

## Roadmap

| Milestone | Scope                                 |
| --------- | ------------------------------------- |
| M0        | Scaffold, inputs, dry-run planning ✅ |
| M1        | Hardened config & logging ✅          |
| M2        | Bundletool installer + cache + SHA ✅ |
| M3        | Signing materialization ✅            |
| M4        | `build-apks` execution ✅             |
| M5        | Universal APK extraction ✅           |
| M6        | Device-specific extraction ✅         |
| M7        | Hardening & docs                      |
| M8        | Release automation ✅                 |

## Releasing

Releases are automated when a `v*` tag is pushed. The workflow validates the
build, generates release notes from [Conventional Commits](https://www.conventionalcommits.org/)
with [git-cliff](https://git-cliff.org/), publishes a GitHub Release, and moves
the major version tag (for example `v1`) to the new release.

```bash
# Ensure dist/ is up to date and committed
pnpm bundle
git add dist/
git commit -m "chore: bundle dist for release"

# Tag and push (use semver, e.g. v1.0.0)
git tag v1.0.0
git push origin v1.0.0
```

Use [Conventional Commits](https://www.conventionalcommits.org/) on `main` so
release notes are grouped correctly (`feat:`, `fix:`, `docs:`, etc.).

## License

MIT
