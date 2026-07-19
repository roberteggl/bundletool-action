/**
 * Unit tests for the bundletool installer.
 */
import { afterEach, expect, it, vi } from 'vitest'
import type { Logger } from '../src/logging/logger.js'

const { downloadTool, cacheFile, find, verifySha256, resolveRelease } =
  vi.hoisted(() => ({
    downloadTool: vi.fn(async () => '/tmp/downloaded.jar'),
    cacheFile: vi.fn(async () => '/cache/bundletool/1.18.3'),
    find: vi.fn(() => ''),
    verifySha256: vi.fn(async () => undefined),
    resolveRelease: vi.fn(async () => ({
      version: '1.18.3',
      downloadUrl:
        'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar',
      assetName: 'bundletool-all-1.18.3.jar'
    }))
  }))

vi.mock('@actions/tool-cache', () => ({
  downloadTool,
  cacheFile,
  find
}))

vi.mock('../src/bundletool/sha256.js', () => ({
  verifySha256,
  sha256File: vi.fn()
}))

vi.mock('../src/bundletool/release-client.js', () => ({
  resolveRelease
}))

const { ensureBundletool } = await import('../src/bundletool/installer.js')

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

describe('ensureBundletool', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('skips download during dry-run', async () => {
    const installed = await ensureBundletool(
      { version: 'latest' },
      { cache: true, dryRun: true, logger }
    )

    expect(installed).toMatchObject({
      version: '1.18.3',
      dryRun: true
    })
    expect(installed.jarPath).toBeUndefined()
    expect(downloadTool).not.toHaveBeenCalled()
  })

  it('downloads and caches on a cache miss', async () => {
    find.mockReturnValue('')

    const installed = await ensureBundletool(
      { version: '1.18.3', sha256: 'a'.repeat(64) },
      { cache: true, dryRun: false, logger }
    )

    expect(downloadTool).toHaveBeenCalled()
    expect(verifySha256).toHaveBeenCalledWith(
      '/cache/bundletool/1.18.3/bundletool.jar',
      'a'.repeat(64)
    )
    expect(cacheFile).toHaveBeenCalled()
    expect(installed.jarPath).toBe('/cache/bundletool/1.18.3/bundletool.jar')
    expect(installed.fromCache).toBe(false)
  })

  it('reuses the tool cache on a hit', async () => {
    find.mockReturnValue('/cache/bundletool/1.18.3')

    const installed = await ensureBundletool(
      { version: '1.18.3' },
      { cache: true, dryRun: false, logger }
    )

    expect(downloadTool).not.toHaveBeenCalled()
    expect(installed.fromCache).toBe(true)
    expect(installed.jarPath).toBe('/cache/bundletool/1.18.3/bundletool.jar')
  })
})
