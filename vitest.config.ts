import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Fix for external dependency issues
    server: {
      deps: {
        external: ['wa-sqlite', 'electric-sql']
      }
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'frontend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'api/**/*.{test,spec}.{js,ts}'
    ],
    // TDD Configuration
    watch: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: false
      }
    },
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock'],
          exclude: ['wa-sqlite', 'electric-sql', 'bun:test']
        }
      }
    },
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'src-tauri',
      'frontend/node_modules'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules',
        'dist',
        'build',
        'coverage',
        'src-tauri',
        'tests',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      },
      all: true,
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        'frontend/apps/**/src/**/*.{js,jsx,ts,tsx}',
        'frontend/packages/**/src/**/*.{js,jsx,ts,tsx}',
        'api/src/**/*.{js,ts}'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    watchExclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'src-tauri'
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/lib': resolve(__dirname, './src/lib'),
      '@/types': resolve(__dirname, './src/types'),
      '@frontend': resolve(__dirname, './frontend')
    }
  }
})