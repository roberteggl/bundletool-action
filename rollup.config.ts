// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import esbuild from 'rollup-plugin-esbuild'

const config = {
  input: 'src/index.ts',
  output: {
    esModule: true,
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    esbuild({
      target: 'node24',
      sourceMap: true,
      // Typechecking is handled separately via `pnpm typecheck`.
      tsconfig: 'tsconfig.json'
    }),
    nodeResolve({ preferBuiltins: true }),
    commonjs()
  ]
}

export default config
