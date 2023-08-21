import { APP_NAME, IS_DEV } from "./info.mjs";

export const SW_VER = 'v18';
export const CACHE_FILES = [
    '',
    // 'index.html',
    'favicon.ico',
    // 'v/index.js',
    // 'v/index.css',
    'img/avatar.jpg',
    'img/header.jpg',
    'img/left.jpg',
    'img/top.jpg',
];

self.addEventListener('install', (event) => {
    let baseDir = location.href.indexOf(`/${APP_NAME}/`) < 0 ? '/' : `/${APP_NAME}/`;
    const FILES = CACHE_FILES.map(u => `${baseDir}${u}`)
    event.waitUntil(caches.open(SW_VER).then((cache) => { cache.addAll(FILES) }));
});
self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then((names) => Promise.all(names.map((name) => {
        if (name !== SW_VER) return caches.delete(name);
    }))));
});
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(location.origin) || IS_DEV) {
        return;
    }
    event.respondWith(caches.match(event.request).then((response) => {
        if (response !== undefined) {
            return response;
        }
        return fetch(event.request).then((response) => {
            const responseClone = response.clone();
            caches.open(SW_VER).then((cache) => {
                cache.put(event.request, responseClone);
            });
            return response;
        }).catch(() => new Response('[]'));
    }));
});
