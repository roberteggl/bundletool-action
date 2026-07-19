# Bundletool Action

GitHub Action that converts Android App Bundles (`.aab`) into APKs using
[Google bundletool](https://developer.android.com/tools/bundletool).

> **Status:** Milestone 3 — installs bundletool and securely materializes
> signing credentials (keystore path or base64, password files, cleanup).
> APK generation lands in M4–M5.

## Features (planned)

- Automatic bundletool download with version pinning and caching
- Universal APK and `.apks` generation
- Optional APK signing from a keystore path or base64 GitHub Secret
- Device-specific APK extraction
- Dry-run and verbose logging
- Forward-compatible `extra-args` for new bundletool flags

## Usage (current)

```yaml
- name: Setup Java
  uses: actions/setup-java@v5
  with:
    distribution: temurin
    java-version: '17'

- name: Install bundletool
  id: bundletool
  uses: roberteggl/bundletool-action@main
  with:
    aab-file: app/build/outputs/bundle/release/app-release.aab
    bundletool-version: '1.18.3'
    dry-run: false
    verbose: true

- name: Show installed JAR
  run: java -jar "${{ steps.bundletool.outputs.bundletool-path }}" version
```

Dry-run resolves the release and sets `bundletool-version` without downloading:

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
| `command`               | no               | `build-apks` | `build-apks` or `extract-apks` |
| `mode`                  | no               | `universal`  | Bundletool build mode          |
| `output`                | no               | -            | Output `.apks` / APK path      |
| `output-dir`            | no               | -            | Directory for extracted APKs   |
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
| `device-spec`           | no               | -            | Device specification JSON      |
| `extract-universal-apk` | no               | `true`       | Extract `universal.apk`        |
| `keep-apks`             | no               | `true`       | Keep the `.apks` archive       |
| `extra-args`            | no               | -            | Extra bundletool CLI args      |
| `working-directory`     | no               | `.`          | Base directory for paths       |
| `dry-run`               | no               | `false`      | Validate and plan only         |
| `verbose`               | no               | `false`      | Verbose logging                |

## Outputs

| Output               | Description                           |
| -------------------- | ------------------------------------- |
| `apks-path`          | Path to the generated `.apks` archive |
| `apk-path`           | Path to the extracted universal APK   |
| `output-dir`         | Directory containing extracted APKs   |
| `bundletool-version` | Resolved bundletool version           |
| `bundletool-path`    | Path to the bundletool JAR            |

Outputs `bundletool-version` and `bundletool-path` are set by the installer
(M2). Signing credentials are materialized to temp files (M3) and removed
during cleanup. Artifact outputs are populated by later milestones.

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
| M4        | `build-apks` execution                |
| M5        | Universal APK extraction              |
| M6        | Device-specific extraction            |
| M7        | Hardening & docs                      |
| M8        | Release automation                    |

## License

MIT
