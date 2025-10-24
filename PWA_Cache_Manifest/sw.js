// =============================
// 🧠 CONFIGURACIÓN DEL SW
// =============================
const cacheName = 'cache-offline-v1';
const filesOffline = [
  './',
  './index.html',
  './manifest.json',
  './pages/error.html',
  './scripts/app.js'
];

// JSON de fallback cuando no hay conexión a la API
const OFFLINE_COCKTAIL_JSON = {
  drinks: [{
    idDrink: "00000",
    strDrink: "🚫 ¡Sin Conexión ni Datos Frescos!",
    strTags: "FALLBACK",
    strCategory: "Desconectado",
    strInstructions: "No pudimos obtener resultados. Este es un resultado genérico. Intenta reconectarte.",
    strDrinkThumb: "https://via.placeholder.com/200x300?text=OFFLINE",
    strIngredient1: "Service Worker",
    strIngredient2: "Fallback JSON"
  }]
};

// =============================
// ⚙️ INSTALACIÓN (PRECACHE)
// =============================
self.addEventListener('install', event => {
  console.log('[SW] ⚙️ Instalando y precacheando el App Shell...');
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesOffline);
    }).then(() => self.skipWaiting())
  );
});

// =============================
// 🚀 ACTIVACIÓN
// =============================
self.addEventListener('activate', event => {
  console.log('[SW] 🚀 Activado.');
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// =============================
// 🌐 FETCH (ESTRATEGIAS)
// =============================
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1️⃣ App Shell (archivos locales)
  const isAppShellRequest = filesOffline.some(asset =>
    requestUrl.pathname.endsWith(asset.replace('./', '/'))
  );
  if (isAppShellRequest) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // 2️⃣ API TheCocktailDB (Network-first con fallback JSON)
  if (requestUrl.host === 'www.thecocktaildb.com' && requestUrl.pathname.includes('/search.php')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn('[SW] ❌ Sin conexión, usando JSON de fallback.');
        return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 3️⃣ Fallback general (HTML offline)
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('./pages/error.html');
      }
      return caches.match(event.request);
    })
  );
});
