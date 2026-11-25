const CACHE_NAME = 'qingyun-v10-7-0';
const CORE_ASSETS = [
  './', './index.html', './manifest.json',
  './styles/main.css',
  './data/skills_items.js', './data/beasts.js', './data/world.js', './data/allies.js', './data/events.js',
  './engine/vendor/three.min.js', './engine/icons.js', './engine/audio_fx.js', './engine/achievements.js', './engine/appearance.js', './engine/sociology.js', './engine/world_core.js', './engine/life_sim.js', './engine/realtime_combat.js', './engine/life_modules.js', './engine/lineage.js', './engine/world_director.js', './engine/map3d.js', './engine/local_map3d.js', './engine/interior_map3d.js', './engine/genesis.js', './engine/world_sim.js', './engine/encounters.js', './engine/reincarnation.js', './engine/combat.js', './engine/minigames.js', './engine/app.js', './engine/life_ui.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/ui3a/title_bg.jpg', './assets/ui3a/logo_calligraphy.png',
  './assets/ui3a/plaque_vert.png', './assets/ui3a/avatar_ring.png',
  './assets/ui3a/choice_bar.png', './assets/ui3a/dialogue_frame.png',
  './assets/ui3a/panel_frame.png', './assets/ui3a/btn_small.png',
  './assets/ui3a/hud_pill.png', './assets/ui3a/talisman_card.png',
  './assets/ui3a/map_beacon.png', './assets/ui3a/combat_header.png',
  './assets/ui3a/ico_map.png', './assets/ui3a/ico_char.png', './assets/ui3a/ico_skill.png',
  './assets/ui3a/ico_bag.png', './assets/ui3a/ico_ally.png', './assets/ui3a/ico_save.png'
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

// Network-first for HTML/JS/CSS (instant updates when online, full offline fallback);
// Cache-first for heavy media assets/ (instant load & 100MB+ offline support).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isCode = url.pathname.endsWith('/') || /\.(html|js|css|json)$/i.test(url.pathname);
  if (isCode) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
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
