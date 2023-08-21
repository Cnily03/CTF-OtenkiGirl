import { APP_NAME } from '../info.mjs';

if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    if ('serviceWorker' in navigator) {
        const isRoot = location.href.indexOf(`/${APP_NAME}/`) < 0;
        let sw = isRoot ? '/sw.js' : `/${APP_NAME}/sw.js`;
        let scope = isRoot ? '/' : `/${APP_NAME}/`;
        navigator.serviceWorker.register(sw, { scope }).then(() => {
            console.log('ServiceWorker Init');
        }).catch(() => {
            console.log('ServiceWorker Failed')
        })
    }