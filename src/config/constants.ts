export const BUNDLETOOL_COMMANDS = ['build-apks', 'extract-apks'] as const

export const BUILD_MODES = ['universal', 'default', 'system'] as const

/**
 * First-class flags owned by the action. Passing these via extra-args is
 * rejected so configuration stays unambiguous.
 */
export const RESERVED_EXTRA_FLAGS = [
  '--bundle',
  '--output',
  '--output-dir',
  '--mode',
  '--ks',
  '--ks-pass',
  '--ks-key-alias',
  '--key-pass',
  '--device-spec',
  '--connected-device',
  '--overwrite',
  '--apks'
] as const

export const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/

/** Bundletool release tags look like 1.18.3 (optional leading v). */
export const VERSION_PATTERN = /^v?\d+\.\d+\.\d+$/
