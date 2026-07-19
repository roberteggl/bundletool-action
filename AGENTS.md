# Agent guide

Maintainer and agent notes for `bundletool-action`. User-facing docs live in
[README.md](./README.md).

## Project overview

TypeScript GitHub Action (Node 24) that wraps [Google bundletool](https://github.com/google/bundletool):

- `build-apks` - AAB → `.apks` (default mode: universal APK extraction)
- `extract-apks` - device-specific APKs from an existing `.apks` archive
- Optional signing, bundletool download/cache, dry-run, verbose logging

Entry: `src/main.ts` → bundled to `dist/index.js` (committed; required for
`uses:`).

## Development

Requires Node.js 24+ and pnpm 11+.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm bundle    # format + package dist/
pnpm local-action   # uses .env (see .env.example)
```

CI runs lint, typecheck, unit tests, `check-dist`, and an integration job with
fixture AABs under `__fixtures__/android/`.

## Releasing

Automated on `v*` tag push (`.github/workflows/release.yml`):

1. Validate (lint, test, bundle, verify `dist/` committed)
2. Changelog via [git-cliff](https://git-cliff.org/) (`cliff.toml`)
3. GitHub Release (`softprops/action-gh-release`)
4. Move major version tag (e.g. `v0` for `v0.1.0`)

```bash
pnpm bundle
git add dist/
git commit -m "chore: bundle dist for release"   # if dist/ changed

git tag v0.1.0
git push origin v0.1.0
```

Use [Conventional Commits](https://www.conventionalcommits.org/) on `main` for
release notes grouping.

## Roadmap

| Milestone | Scope                                 | Status |
| --------- | ------------------------------------- | ------ |
| M0        | Scaffold, inputs, dry-run planning    | ✅     |
| M1        | Hardened config & logging             | ✅     |
| M2        | Bundletool installer + cache + SHA    | ✅     |
| M3        | Signing materialization               | ✅     |
| M4        | `build-apks` execution                | ✅     |
| M5        | Universal APK extraction              | ✅     |
| M6        | Device-specific extraction            | ✅     |
| M7        | Hardening, docs, E2E CI fixtures      | ✅     |
| M8        | Release automation, CodeQL            | ✅     |

### Post-v0.1 ideas

- GitHub Marketplace listing
- macOS integration CI job
- Windows support (if bundletool + zip path proven)
- Input aliases for `ethanneff/bundletool-action` camelCase (optional)

## Layout

```
src/
  main.ts                 # entrypoint
  config/                 # inputs, validation, redaction
  bundletool/             # installer, runner, commands
  artifacts/              # universal APK zip extract
  signing/                # keystore materialization
dist/index.js             # shipped action bundle
__fixtures__/android/     # vendored bundletool test AAB + device spec
```
