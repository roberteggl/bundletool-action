/**
 * Unit tests for universal APK path resolution.
 */
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { resolveUniversalApkPath } from '../src/artifacts/paths.js'

describe('resolveUniversalApkPath', () => {
  it('uses an explicit .apk output path', () => {
    expect(
      resolveUniversalApkPath({
        workingDirectory: '/work',
        apksPath: '/work/app.apks',
        output: 'dist/release.apk'
      })
    ).toBe(join('/work', 'dist/release.apk'))
  })

  it('uses output-dir with the aab basename', () => {
    expect(
      resolveUniversalApkPath({
        workingDirectory: '/work',
        aabFile: 'build/app-release.aab',
        apksPath: '/work/app-release.apks',
        outputDir: 'artifacts'
      })
    ).toBe(join('/work', 'artifacts', 'app-release.apk'))
  })

  it('defaults to the apks directory with matching basename', () => {
    expect(
      resolveUniversalApkPath({
        workingDirectory: '/work',
        aabFile: '/work/app.aab',
        apksPath: '/tmp/out/app.apks'
      })
    ).toBe(join('/tmp/out', 'app.apk'))
  })
})
