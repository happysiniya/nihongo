// 앱 화면과 글꼴을 휴대폰에 저장해 두어서 인터넷이 없어도 (비행기, 일본 현지) 열려요.
// 파일을 고쳐서 다시 올릴 때는 아래 버전 숫자를 하나 올려 주세요.
const VERSION = 'v3';
const SHELL = 'shell-' + VERSION;
const FONTS = 'fonts-v1';
const SHELL_FILES = ['./', 'index.html', 'data.js', 'sentences.js', 'sentences-2.js', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k.startsWith('shell-') && k !== SHELL).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 글꼴 (Google Fonts): 저장된 게 있으면 바로 쓰고, 없으면 받아서 저장
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // 앱 화면: 인터넷이 되면 새 버전, 안 되면 저장된 버전
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true })));
  }
});
