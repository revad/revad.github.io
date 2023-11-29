// service worker to cache files for offline use
// Code from https://itnext.io/how-to-make-your-website-work-offline-b5be47b92adc

// give your cache a name
const cacheName = 'offline_calculator';

// put the static assets and routes you want to cache here
const filesToCache = [
  'default.html',
  'script.js',  
  'jquery-1.6.2.min.js',  
  'style.css',  
  'offline_Calculator.ico'  
];

// the event handler for the activate event
self.addEventListener('activate', e => self.clients.claim());

// the event handler for the install event 
// typically used to cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName)
    .then(cache => cache.addAll(filesToCache))
  );
});

// the fetch event handler, to intercept requests and serve all 
// static assets from the cache
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
    .then(response => response ? response : fetch(e.request))
  )
});