self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open('v1').then((cache) => {
      console.log('Service Worker: Caching files...');
      return cache.addAll([
        './', 
        './index.html',
        './Public/script.js',
        './Public/buttonHandlers.js',
        './Public/klockor.js',
        './Public/styles.css',
        './manifest.json',
        './bookings.json',
        './bookings.php',
        './icons/icon-192x192.png',
        './icons/icon-512x512.png'
      ]).catch((error) => {
        console.error('Service Worker: Failed to cache some files:', error);
      });
    })
  );
});
