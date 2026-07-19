import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    exclude: ['dist/**', 'node_modules/**'],
    globals: true,
    include: ['**/*.test.ts'],
    coverage: {
      include: ['src/**'],
      provider: 'v8',
      reporter: ['json-summary', 'text', 'lcov'],
      reportsDirectory: './coverage'
    }
  }
})
