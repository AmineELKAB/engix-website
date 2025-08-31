// Service Worker for engix.dev
const CACHE_NAME = 'engix-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/config.js',
    '/performance.js',
    '/images/contact-placeholder.html',
    '/images/product-development-placeholder.html',
    '/images/technical-assistance-placeholder.html',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for form submissions when offline
self.addEventListener('sync', (event) => {
    if (event.tag === 'form-submission') {
        event.waitUntil(syncFormData());
    }
});

async function syncFormData() {
    // Get stored form data from IndexedDB
    const formData = await getStoredFormData();
    if (formData) {
        try {
            // Attempt to submit the form
            await submitFormData(formData);
            // Clear stored data on success
            await clearStoredFormData();
        } catch (error) {
            console.error('Failed to sync form data:', error);
        }
    }
}

// Helper functions for offline form handling
async function getStoredFormData() {
    // Implementation would use IndexedDB
    return null;
}

async function submitFormData(data) {
    // Implementation would submit to actual endpoint
    return fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

async function clearStoredFormData() {
    // Implementation would clear IndexedDB
    return null;
}
