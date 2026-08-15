// HelloInsights Service Worker v2
// Cache-first for static assets, network-first for HTML/JSON with cache fallback
var CACHE_NAME = 'helloinsights-v2';
var STATIC_ASSETS = [
    'style.css',
    'config-loader.js',
    'ads-config.js',
    'logo.svg',
    'favicon.svg'
];

// Install: cache core static assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(STATIC_ASSETS);
        }).catch(function() {})
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(name) { return name !== CACHE_NAME; })
                     .map(function(name) { return caches.delete(name); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: layered caching strategy
self.addEventListener('fetch', function(event) {
    var url = event.request.url;
    var path;
    try {
        path = new URL(url).pathname;
    } catch(e) { return; }

    // Skip ad requests
    if (url.indexOf('googlesyndication') !== -1 || url.indexOf('doubleclick') !== -1 || url.indexOf('googleads') !== -1 || url.indexOf('mgid.com') !== -1) {
        return;
    }

    // Static assets (CSS/JS/images): Cache-first
    if (path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/)) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) {
                    // Background update
                    fetch(event.request).then(function(response) {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then(function(cache) {
                                cache.put(event.request, response);
                            });
                        }
                    }).catch(function() {});
                    return cached;
                }
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Unsplash images: Cache-first, long-term
    if (url.indexOf('images.unsplash.com') !== -1) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // HTML and JSON: Network-first with cache fallback
    if (path.indexOf('.html') !== -1 || path.indexOf('.json') !== -1 || path === '/') {
        event.respondWith(
            fetch(event.request, { cache: 'no-cache' }).then(function(response) {
                if (response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                return caches.match(event.request).then(function(cached) {
                    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
        );
        return;
    }
});
