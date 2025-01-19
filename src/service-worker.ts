/// <reference lib="webworker" />

import { logger } from '@/services/loggingService';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'playful-project-forge-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
];

// Cache static assets on install
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

// Clean up old caches on activate
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Network-first strategy with fallback to cache
self.addEventListener('fetch', (event: FetchEvent) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip API requests
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    (async () => {
      try {
        // Try network first
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }

        // If HTML request fails, return offline page
        if (event.request.headers.get('Accept')?.includes('text/html')) {
          const offlineResponse = await caches.match(OFFLINE_URL);
          if (offlineResponse) {
            return offlineResponse;
          }
        }

        // Log error and return network error
        logger.error('Service Worker fetch error:', {
          url: event.request.url,
          error,
        });
        throw error;
      }
    })()
  );
}); 