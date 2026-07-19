/**
 * Unit tests for the GitHub release client.
 */
import { afterEach, expect, it, vi } from 'vitest'
import type { Logger } from '../src/logging/logger.js'

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

const { resolveRelease } = await import('../src/bundletool/release-client.js')

describe('resolveRelease', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.resetAllMocks()
  })

  it('uses an override URL when provided', async () => {
    const release = await resolveRelease(
      {
        version: '1.18.3',
        url: 'https://example.com/bundletool.jar'
      },
      logger
    )

    expect(release).toEqual({
      version: '1.18.3',
      downloadUrl: 'https://example.com/bundletool.jar',
      assetName: 'bundletool.jar'
    })
  })

  it('resolves the latest release from GitHub', async () => {
    global.fetch = vi.fn(async () =>
      Response.json({
        tag_name: '1.18.3',
        assets: [
          {
            name: 'bundletool-all-1.18.3.jar',
            browser_download_url:
              'https://github.com/google/bundletool/releases/download/1.18.3/bundletool-all-1.18.3.jar'
          }
        ]
      })
    ) as unknown as typeof fetch

    const release = await resolveRelease({ version: 'latest' }, logger)

    expect(release.version).toBe('1.18.3')
    expect(release.assetName).toBe('bundletool-all-1.18.3.jar')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/google/bundletool/releases/latest',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github+json'
        })
      })
    )
  })

  it('throws when the release is missing', async () => {
    global.fetch = vi.fn(
      async () =>
        new Response('Not Found', { status: 404, statusText: 'Not Found' })
    ) as unknown as typeof fetch

    await expect(resolveRelease({ version: '0.0.0' }, logger)).rejects.toThrow(
      /Bundletool release not found/
    )
  })

  it('throws when no jar asset exists', async () => {
    global.fetch = vi.fn(async () =>
      Response.json({
        tag_name: '1.0.0',
        assets: [{ name: 'notes.txt', browser_download_url: 'https://x/notes' }]
      })
    ) as unknown as typeof fetch

    await expect(resolveRelease({ version: '1.0.0' }, logger)).rejects.toThrow(
      /No \.jar asset/
    )
  })
})
