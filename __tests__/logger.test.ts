/**
 * Unit tests for the action logger wrapper.
 */
import * as core from '@actions/core'
import { afterEach, expect, it, vi } from 'vitest'
import { createLogger } from '../src/logging/logger.js'

vi.mock('@actions/core', () => import('../__fixtures__/core.js'))

describe('createLogger', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('routes standard messages through @actions/core', () => {
    const logger = createLogger(false)

    logger.info('info')
    logger.notice('notice')
    logger.warning('warning')
    logger.error('error')
    logger.debug('debug')

    expect(core.info).toHaveBeenCalledWith('info')
    expect(core.notice).toHaveBeenCalledWith('notice')
    expect(core.warning).toHaveBeenCalledWith('warning')
    expect(core.error).toHaveBeenCalledWith('error')
    expect(core.debug).toHaveBeenCalledWith('debug')
  })

  it('prints verbose messages at info level when verbose is enabled', () => {
    const logger = createLogger(true)

    logger.verbose('details')

    expect(core.info).toHaveBeenCalledWith('[verbose] details')
    expect(core.debug).not.toHaveBeenCalled()
  })

  it('prints verbose messages at debug level when verbose is disabled', () => {
    const logger = createLogger(false)

    logger.verbose('details')

    expect(core.debug).toHaveBeenCalledWith('details')
    expect(core.info).not.toHaveBeenCalledWith('[verbose] details')
  })

  it('wraps callbacks in a GitHub Actions log group', async () => {
    const logger = createLogger(false)

    const result = await logger.group('Step', async () => 'done')

    expect(result).toBe('done')
    expect(core.startGroup).toHaveBeenCalledWith('Step')
    expect(core.endGroup).toHaveBeenCalled()
  })
})
