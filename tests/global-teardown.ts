import { type FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up global test environment...')
  
  // Clean up any global resources, temp files, etc.
  
  console.log('✅ Global test cleanup complete')
}

export default globalTeardown