const CACHE_NAME = 'running-coach-v5';
const SHELL_URLS = [
    '/',
    '/static/manifest.json',
    '/static/icon-192.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);
                await cache.addAll(SHELL_URLS);
            } catch {
                // Never block SW install if a precache URL fails.
            }
            await self.skipWaiting();
        })()
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) {
        return;
    }

    // Never intercept or cache API calls.
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Network-first for navigations; fall back to cached SPA shell on failure.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('/'))
        );
        return;
    }

    // Cache-first for Vite-hashed assets and static files.
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/static/')) {
        event.respondWith(
            caches.match(event.request)
                .then(cached => cached || fetch(event.request).then(response => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }))
        );
        return;
    }
});

// Web Push (P0-1): payload is JSON { category, title, body, url } — see
// app/notifications.py's PushPayload.
self.addEventListener('push', event => {
    let payload = { title: 'Running Coach', body: '' };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch {
            payload.body = event.data.text();
        }
    }
    event.waitUntil(
        self.registration.showNotification(payload.title || 'Running Coach', {
            body: payload.body || '',
            icon: '/static/icon-192.png',
            badge: '/static/icon-192.png',
            data: { url: payload.url || '/' },
            tag: payload.category,
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});
