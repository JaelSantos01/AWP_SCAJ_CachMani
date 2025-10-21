const cacheName = 'cache-offline-v1';
const filesOffline = [
    "../",
    "../index.html",
    "../manifest.json",
    "../pages/error.html"
]

self.addEventListener('install', (event) =>{
    event.waitUntil(
        caches.open(cacheName)
        .then((cache) => {
            return cache.addAll(filesOffline);
        })
        .catch(err => console.log('Falló registro de caché', err))
    );
});

self.addEventListener('fetch', event =>{
    if(event.request.mode === 'navigate'){
        event.respondWith(
            fetch(event.request)
            .then(response => {
                return response;
            })
            .catch(() => {
                return caches.open(cacheName)
                .then(cache => {
                    return cache.match(event.request)
                    .then(response => {
                        if(response) return response;
                        return cache.match('/pages/error.html');
                    })
                })
            })
        )
    }
})