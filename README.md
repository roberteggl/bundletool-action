# Bundletool Action

[![Continuous Integration](https://github.com/roberteggl/bundletool-action/actions/workflows/ci.yml/badge.svg)](https://github.com/roberteggl/bundletool-action/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/roberteggl/bundletool-action/graph/badge.svg?token=YST64KYO88)](https://codecov.io/github/roberteggl/bundletool-action)
![Coverage](./badges/coverage.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GitHub Action that converts Android App Bundles (`.aab`) into APKs using
[Google bundletool](https://developer.android.com/tools/bundletool).

> **Status:** v0.1 — early release. Pin `roberteggl/bundletool-action@v0.1.0`
> (or `@v0` for the latest 0.x).

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
  uses: roberteggl/bundletool-action@v0.1.0
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
  uses: roberteggl/bundletool-action@v0.1.0
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
  uses: roberteggl/bundletool-action@v0.1.0
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

## Migration from `ethanneff/bundletool-action`

This action is a modern replacement for
[`ethanneff/bundletool-action`](https://github.com/ethanneff/bundletool-action).
The common case — signed universal APK from an AAB — works the same; inputs
use kebab-case and signing is optional.

### Before

```yaml
- uses: ethanneff/bundletool-action@master
  id: bundletool
  with:
    aabFile: app/build/outputs/bundle/release/app-release.aab
    base64Keystore: ${{ secrets.KEYSTORE_BASE64 }}
    keystorePassword: ${{ secrets.KEYSTORE_PASSWORD }}
    keystoreAlias: ${{ secrets.KEY_ALIAS }}
    keyPassword: ${{ secrets.KEY_PASSWORD }}
    bundleToolVersion: '1.18.3'

- uses: actions/upload-artifact@v4
  with:
    name: app-apk
    path: app-release.apk
```

### After

```yaml
- uses: actions/setup-java@v5
  with:
    distribution: temurin
    java-version: '17'

- uses: roberteggl/bundletool-action@v0.1.0
  id: bundletool
  with:
    aab-file: app/build/outputs/bundle/release/app-release.aab
    keystore-base64: ${{ secrets.KEYSTORE_BASE64 }}
    keystore-password: ${{ secrets.KEYSTORE_PASSWORD }}
    key-alias: ${{ secrets.KEY_ALIAS }}
    key-password: ${{ secrets.KEY_PASSWORD }}
    bundletool-version: '1.18.3'

- uses: actions/upload-artifact@v4
  with:
    name: app-apk
    path: ${{ steps.bundletool.outputs.apk-path }}
```

Add `setup-java` before the action — Java is not bundled. Pin
`roberteggl/bundletool-action@v0.1.0` (or `@v0` for the latest 0.x) instead of
`@main`.

### Input mapping

| `ethanneff/bundletool-action` | This action           | Notes                          |
| ----------------------------- | --------------------- | ------------------------------ |
| `aabFile`                     | `aab-file`            | Required for `build-apks`      |
| `base64Keystore`              | `keystore-base64`     | Or use `keystore` (file path)  |
| `keystorePassword`            | `keystore-password`   | Required when signing          |
| `keystoreAlias`               | `key-alias`           | Required when signing          |
| `keyPassword`                 | `key-password`        | Defaults to `keystore-password` |
| `bundleToolVersion`           | `bundletool-version`  | Default `latest`               |

### Output mapping

| `ethanneff/bundletool-action` | This action    | Notes                                |
| ----------------------------- | -------------- | ------------------------------------ |
| `apkPath`                     | `apk-path`     | Use the output instead of a hardcoded path |
| _(none)_                      | `apks-path`    | `.apks` archive (kept by default)    |
| _(none)_                      | `bundletool-version` | Resolved bundletool version    |
| _(none)_                      | `bundletool-path`    | Path to the JAR on the runner  |

### Behavior differences

- **Signing is optional** — set `sign: false` to build without a keystore (for
  example in tests). When signing, provide the same secrets as before.
- **Default output names** — `{aab-basename}.apk` and `{aab-basename}.apks` in
  the working directory, same as the original action.
- **Keeps `.apks`** — the intermediate archive is retained (`keep-apks: true`).
  Set `keep-apks: false` to delete it after extracting the universal APK.
- **No shell `unzip`** — extraction runs in Node; no dependency on system
  `unzip`/`mv`.
- **Bundletool caching** — the JAR is cached via `@actions/tool-cache`
  (`cache: true` by default).
- **More commands** — `command: extract-apks` for device-specific APKs from an
  existing `.apks` file; `dry-run` and `verbose` for debugging.
- **Runtime** — Node 24 (vs Node 20). Runs on `ubuntu-latest` and `macos`;
  Windows is not explicitly tested.

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

## License

MIT
