const CACHE_NAME = 'driving-exam-v2';

// توليد مسارات الصور تلقائياً
const ruleImages = ['images/rules_100.png', 'images/rules_101.png', 'images/rules_102.png'];

const signImages = Array.from({ length: 131 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return `images/sign_${num}.png`;
});

const mechImages = Array.from({ length: 26 }, (_, i) => {
    return `images/mech_${i + 23}.png`;
});

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './questions.js',
    './manifest.json',
    ...ruleImages,
    ...signImages,
    ...mechImages
];

// تثبيت الكاش وتخزين الملفات
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// تفعيل الكاش الجديد وحذف القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// جلب الملفات من الكاش عند انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});