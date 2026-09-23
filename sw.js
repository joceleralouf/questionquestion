// Culture Bar : fonctionnement hors ligne
const CACHE = "culturebar-v6";
const CORE = ["./", "index.html", "style.css", "classement.css", "app.js", "config.js", "classement.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "data/meta.js", "data/q-h1.js", "data/q-h2.js", "data/q-h3.js", "data/q-h4.js", "data/q-h5.js", "data/q-c1.js", "data/q-c2.js", "data/q-c3.js", "data/q-c4.js", "data/q-c5.js", "data/q-p1.js", "data/q-p2.js", "data/q-p3.js", "data/q-p4.js", "data/q-p5.js", "data/q-p6.js", "data/q-p7.js", "data/q-p8.js", "data/fiches-h.js", "data/fiches-c.js", "data/fiches-p.js", "data/exos.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Nos fichiers : réseau d'abord, en demandant au serveur s'il y a du neuf
    // (sans ça, le navigateur garde l'ancienne version jusqu'à 10 minutes)
    e.respondWith(fetch(req.mode === "navigate" ? req.url : req, { cache: "no-cache" }).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match("index.html"))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    // Polices : cache d'abord
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
    })));
  }
});
