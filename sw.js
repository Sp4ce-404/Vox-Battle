const CACHE_NAME = "voxbattle-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon.svg",
  "./css/variables.css",
  "./css/components.css",
  "./css/animations.css",
  "./css/layout.css",
  "./js/audio/AudioEngine.js",
  "./js/audio/effects/PitchShifter.js",
  "./js/audio/effects/Reverb.js",
  "./js/audio/effects/Distortion.js",
  "./js/audio/effects/Delay.js",
  "./js/audio/effects/Chorus.js",
  "./js/audio/effects/RobotVoice.js",
  "./js/audio/effects/Equalizer.js",
  "./js/audio/effects/Compressor.js",
  "./js/presets/PresetData.js",
  "./js/presets/PresetGenerator.js",
  "./js/presets/PresetManager.js",
  "./js/ui/App.js",
  "./js/ui/Navigation.js",
  "./js/ui/VoiceGrid.js",
  "./js/ui/Visualizer.js",
  "./js/ui/RecordPanel.js",
  "./js/ui/EffectControls.js"
];

// Install service worker and cache assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching all static assets");
      return cache.addAll(ASSETS).catch(err => {
        console.warn("[Service Worker] Cache pre-fill skipped some files, they will cache on demand.", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event (clean up old caches)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event (cache-first, fallback to network, cache on dynamic request)
self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Cache new request dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Do not cache Chrome extension schemes, or non-http requests
          if (e.request.url.startsWith("http")) {
            cache.put(e.request, responseToCache);
          }
        });

        return networkResponse;
      }).catch(() => {
        // Fallback for offline if request is for HTML
        if (e.request.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
