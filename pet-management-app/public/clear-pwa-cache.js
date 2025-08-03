// Clear PWA Cache Script
// Run this in the browser console to clear all PWA caches

async function clearPWACache() {
  console.log('🧹 Clearing PWA cache...');
  
  try {
    // Clear all caches
    const cacheNames = await caches.keys();
    console.log('Found caches:', cacheNames);
    
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('✅ Deleted cache:', cacheName);
    }
    
    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered service worker');
      }
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Cleared local and session storage');
    
    // Reload the page
    console.log('🔄 Reloading page...');
    window.location.reload();
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined') {
  clearPWACache();
}