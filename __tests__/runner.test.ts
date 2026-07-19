/**
 * Unit tests for the bundletool runner.
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

const exec = vi.fn(async () => 0)
vi.mock('@actions/exec', () => ({ exec }))

const { runBundletool } = await import('../src/bundletool/runner.js')

describe('runBundletool', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('invokes java -jar with the provided args', async () => {
    await runBundletool({
      javaBin: 'java',
      jarPath: '/cache/bundletool.jar',
      args: ['build-apks', '--bundle=app.aab', '--output=app.apks'],
      logger
    })

    expect(exec).toHaveBeenCalledWith(
      'java',
      [
        '-jar',
        '/cache/bundletool.jar',
        'build-apks',
        '--bundle=app.aab',
        '--output=app.apks'
      ],
      expect.objectContaining({ ignoreReturnCode: true })
    )
  })

  it('throws when bundletool exits non-zero', async () => {
    exec.mockResolvedValueOnce(2)

    await expect(
      runBundletool({
        javaBin: 'java',
        jarPath: '/cache/bundletool.jar',
        args: ['build-apks'],
        logger
      })
    ).rejects.toThrow(/exited with code 2/)
  })
})
