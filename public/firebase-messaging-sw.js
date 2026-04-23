// public/firebase-messaging-sw.js
// Handles background push notifications from Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            "AIzaSyBf_phvC_Iu-C1p5MWsGI5jJJqBOCmoiKU",
  authDomain:        "fir-setup-f2b47.firebaseapp.com",
  projectId:         "fir-setup-f2b47",
  storageBucket:     "fir-setup-f2b47.firebasestorage.app",
  messagingSenderId: "148801068267",
  appId:             "1:148801068267:web:bb6bfe18f1ce56c04bb2ae",
});

const messaging = firebase.messaging();

// Background message handler — fires when app is not in focus
messaging.onBackgroundMessage((payload) => {
  // Never show pot-sensor notifications on behalf of the background worker
  if (payload.data && payload.data.type === 'pot') return;

  const title = payload.notification?.title ?? '🌱 PlantPal';
  const body  = payload.notification?.body  ?? 'You have plant care tasks due.';

  self.registration.showNotification(title, {
    body,
    icon:  '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag:   'plantpal-care',   // collapses duplicate notifications
    data:  { url: '/' },
  });
});

// Open / focus the app when the notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.startsWith(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
