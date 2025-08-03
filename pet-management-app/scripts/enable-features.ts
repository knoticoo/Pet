#!/usr/bin/env tsx

import { enableAllFeatures } from '../src/lib/enable-all-features'

async function main() {
  console.log('🚀 Enabling all PWA features...')
  
  try {
    await enableAllFeatures()
    console.log('✅ All features enabled successfully!')
    console.log('🔄 Please restart your application to see the changes.')
  } catch (error) {
    console.error('❌ Failed to enable features:', error)
    process.exit(1)
  }
}

main()