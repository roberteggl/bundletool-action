/**
 * Unit tests for the Java prerequisite check.
 */
import { afterEach, expect, it, vi } from 'vitest'
import type { Logger } from '../src/logging/logger.js'

const { exec } = vi.hoisted(() => ({
  exec: vi.fn(async () => 0)
}))

vi.mock('@actions/exec', () => ({
  exec
}))

const { ensureJava } = await import('../src/bundletool/java.js')

const logger: Logger = {
  info: vi.fn(),
  notice: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  verbose: vi.fn(),
  group: vi.fn(async (_name, fn) => fn())
}

describe('ensureJava', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('succeeds when java -version exits 0', async () => {
    await expect(ensureJava('java', logger)).resolves.toBeUndefined()
    expect(exec).toHaveBeenCalledWith(
      'java',
      ['-version'],
      expect.objectContaining({ silent: true })
    )
  })

  it('fails when java is missing', async () => {
    exec.mockRejectedValueOnce(new Error('not found'))

    await expect(ensureJava('java', logger)).rejects.toThrow(
      /Java was not found/
    )
  })
})
