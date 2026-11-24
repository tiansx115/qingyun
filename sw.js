const CACHE_NAME = 'qingyun-v5-4-ui';
const CORE_ASSETS = [
  './', './index.html', './manifest.json',
  './styles/main.css',
  './data/skills_items.js', './data/world.js', './data/allies.js', './data/events.js',
  './engine/icons.js', './engine/audio_fx.js', './engine/minigames.js', './engine/app.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/ui/menu_map.png', './assets/ui/menu_char.png', './assets/ui/menu_skill.png',
  './assets/ui/menu_bag.png', './assets/ui/menu_ally.png', './assets/ui/menu_save.png',
  './assets/ui/frame_avatar_dragon.png', './assets/ui/pin_jade_compass.png',
  './assets/ui/seal_vermilion.png', './assets/ui/corner_filigree.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Dynamic runtime caching: seamlessly caches 100MB+ of scenes/chars/audio on demand
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
