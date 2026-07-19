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

  it('falls back to any jar asset when bundletool-all is missing', async () => {
    global.fetch = vi.fn(async () =>
      Response.json({
        tag_name: '1.0.0',
        assets: [
          {
            name: 'bundletool.jar',
            browser_download_url: 'https://example.com/bundletool.jar'
          }
        ]
      })
    ) as unknown as typeof fetch

    const release = await resolveRelease({ version: '1.0.0' }, logger)

    expect(release.assetName).toBe('bundletool.jar')
    expect(release.downloadUrl).toBe('https://example.com/bundletool.jar')
  })

  it('adds an authorization header when a GitHub token is present', async () => {
    const previousToken = process.env.GITHUB_TOKEN
    process.env.GITHUB_TOKEN = 'ghp_test'

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

    await resolveRelease({ version: 'latest' }, logger)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_test'
        })
      })
    )

    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN
    } else {
      process.env.GITHUB_TOKEN = previousToken
    }
  })

  it('throws when the GitHub API cannot be reached', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch

    await expect(resolveRelease({ version: 'latest' }, logger)).rejects.toThrow(
      /Failed to reach GitHub Releases API/
    )
  })

  it('throws on unexpected GitHub API responses', async () => {
    global.fetch = vi.fn(
      async () =>
        new Response('rate limited', { status: 403, statusText: 'Forbidden' })
    ) as unknown as typeof fetch

    await expect(resolveRelease({ version: 'latest' }, logger)).rejects.toThrow(
      /Unexpected GitHub API response/
    )
  })

  it('uses a custom version label for override URLs with latest', async () => {
    const release = await resolveRelease(
      {
        version: 'latest',
        url: 'https://example.com/bundletool.jar'
      },
      logger
    )

    expect(release.version).toBe('custom')
  })
})
