/**
 * Unit tests for input parsing and validation.
 */
import * as core from '@actions/core'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('@actions/core', () => import('../__fixtures__/core.js'))

const { parseInputs } = await import('../src/config/inputs.js')

function mockInputs(values: Record<string, string>): void {
  core.getInput.mockImplementation((name: string) => values[name] ?? '')
}

describe('parseInputs', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('parses defaults for a minimal build-apks config', () => {
    mockInputs({
      'aab-file': 'app.aab'
    })

    const { config, warnings } = parseInputs()

    expect(config.command).toBe('build-apks')
    expect(config.mode).toBe('universal')
    expect(config.bundletool.version).toBe('latest')
    expect(config.cache).toBe(true)
    expect(config.dryRun).toBe(false)
    expect(config.signing.enabled).toBe(false)
    expect(config.signing.signRequested).toBe(true)
    expect(config.extraArgs).toEqual([])
    expect(warnings).toEqual([])
  })

  it('parses extra-args into an array', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'extra-args': '--local-testing --verbose',
      sign: 'false'
    })

    const { config } = parseInputs()

    expect(config.extraArgs).toEqual(['--local-testing', '--verbose'])
  })

  it('masks signing secrets', () => {
    mockInputs({
      'aab-file': 'app.aab',
      keystore: 'release.jks',
      'keystore-password': 'store-secret',
      'key-alias': 'upload',
      'key-password': 'key-secret',
      'keystore-base64': ''
    })

    parseInputs()

    expect(core.setSecret).toHaveBeenCalledWith('store-secret')
    expect(core.setSecret).toHaveBeenCalledWith('key-secret')
  })

  it('defaults key-password to keystore-password', () => {
    mockInputs({
      'aab-file': 'app.aab',
      keystore: 'release.jks',
      'keystore-password': 'store-secret',
      'key-alias': 'upload'
    })

    const { config } = parseInputs()

    expect(config.signing.keyPassword).toBe('store-secret')
    expect(config.signing.enabled).toBe(true)
  })

  it('rejects unknown commands', () => {
    mockInputs({
      'aab-file': 'app.aab',
      command: 'install-apks',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/Invalid command/)
  })

  it('rejects unknown modes', () => {
    mockInputs({
      'aab-file': 'app.aab',
      mode: 'instant',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/Invalid mode/)
  })

  it('rejects providing both keystore and keystore-base64', () => {
    mockInputs({
      'aab-file': 'app.aab',
      keystore: 'a.jks',
      'keystore-base64': 'YWJj',
      'keystore-password': 'secret',
      'key-alias': 'upload'
    })

    expect(() => parseInputs()).toThrow(
      /Provide either "keystore" or "keystore-base64"/
    )
  })

  it('rejects reserved flags in extra-args', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'extra-args': '--mode=default',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/reserved flag "--mode"/)
  })

  it('rejects invalid sha256 digests', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'bundletool-sha256': 'not-a-digest',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/bundletool-sha256/)
  })

  it('rejects invalid bundletool versions', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'bundletool-version': 'vnext',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/Invalid bundletool-version/)
  })

  it('accepts pinned bundletool versions', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'bundletool-version': '1.18.3',
      sign: 'false'
    })

    const { config } = parseInputs()
    expect(config.bundletool.version).toBe('1.18.3')
  })

  it('rejects invalid bundletool URLs', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'bundletool-url': 'ftp://example.com/bundletool.jar',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/Invalid bundletool-url protocol/)
  })

  it('requires device-spec for extract-apks', () => {
    mockInputs({
      command: 'extract-apks',
      'output-dir': 'out',
      sign: 'false'
    })

    expect(() => parseInputs()).toThrow(/device-spec/)
  })

  it('warns when extract-universal-apk is set for non-universal mode', () => {
    mockInputs({
      'aab-file': 'app.aab',
      mode: 'default',
      'extract-universal-apk': 'true',
      sign: 'false'
    })

    const { warnings } = parseInputs()
    expect(
      warnings.some((w) => w.message.includes('extract-universal-apk'))
    ).toBe(true)
  })

  it('warns when keystore is provided with sign=false', () => {
    mockInputs({
      'aab-file': 'app.aab',
      keystore: 'release.jks',
      'keystore-password': 'secret',
      'key-alias': 'upload',
      sign: 'false'
    })

    const { config, warnings } = parseInputs()
    expect(config.signing.enabled).toBe(false)
    expect(warnings.some((w) => w.message.includes('sign=false'))).toBe(true)
  })

  it('rejects invalid boolean values', () => {
    mockInputs({
      'aab-file': 'app.aab',
      'dry-run': 'maybe'
    })

    expect(() => parseInputs()).toThrow(/Invalid boolean/)
  })
})
