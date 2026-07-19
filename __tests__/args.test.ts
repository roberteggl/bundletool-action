/**
 * Unit tests for build-apks argument building.
 */
import { expect, it } from 'vitest'
import {
  buildApksArgs,
  buildExtractApksArgs,
  redactBundletoolArgs
} from '../src/bundletool/args.js'

describe('buildApksArgs', () => {
  it('builds unsigned build-apks args with overwrite', () => {
    expect(
      buildApksArgs({
        aabFile: '/tmp/app.aab',
        output: '/tmp/app.apks',
        mode: 'universal',
        extraArgs: ['--local-testing']
      })
    ).toEqual([
      'build-apks',
      '--bundle=/tmp/app.aab',
      '--output=/tmp/app.apks',
      '--mode=universal',
      '--overwrite',
      '--local-testing'
    ])
  })

  it('includes device-spec when provided', () => {
    expect(
      buildApksArgs({
        aabFile: 'app.aab',
        output: 'app.apks',
        mode: 'default',
        deviceSpec: 'device.json',
        extraArgs: []
      })
    ).toEqual([
      'build-apks',
      '--bundle=app.aab',
      '--output=app.apks',
      '--mode=default',
      '--overwrite',
      '--device-spec=device.json'
    ])
  })

  it('includes signing file: password flags', () => {
    expect(
      buildApksArgs({
        aabFile: 'app.aab',
        output: 'app.apks',
        mode: 'default',
        extraArgs: [],
        signing: {
          keystorePath: '/tmp/signing.keystore',
          keyAlias: 'upload',
          keystorePasswordFile: '/tmp/keystore.pass',
          keyPasswordFile: '/tmp/key.pass'
        }
      })
    ).toEqual([
      'build-apks',
      '--bundle=app.aab',
      '--output=app.apks',
      '--mode=default',
      '--overwrite',
      '--ks=/tmp/signing.keystore',
      '--ks-pass=file:/tmp/keystore.pass',
      '--ks-key-alias=upload',
      '--key-pass=file:/tmp/key.pass'
    ])
  })
})

describe('buildExtractApksArgs', () => {
  it('builds extract-apks args', () => {
    expect(
      buildExtractApksArgs({
        apksFile: '/tmp/app.apks',
        outputDir: '/tmp/out',
        deviceSpec: '/tmp/device.json',
        extraArgs: ['--output-format=json']
      })
    ).toEqual([
      'extract-apks',
      '--apks=/tmp/app.apks',
      '--output-dir=/tmp/out',
      '--device-spec=/tmp/device.json',
      '--output-format=json'
    ])
  })
})

describe('redactBundletoolArgs', () => {
  it('redacts password file paths', () => {
    expect(
      redactBundletoolArgs([
        '--ks-pass=file:/tmp/keystore.pass',
        '--key-pass=file:/tmp/key.pass',
        '--mode=universal'
      ])
    ).toEqual([
      '--ks-pass=file:[redacted]',
      '--key-pass=file:[redacted]',
      '--mode=universal'
    ])
  })
})
