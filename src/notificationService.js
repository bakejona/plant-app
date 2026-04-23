// src/notificationService.js
// Handles push notification permission, FCM token registration, and local care reminders.
// NOTE: Background push (when app is closed) requires the Cloud Function in functions/index.js.
//       Add your FCM VAPID public key to a .env file:  VITE_FCM_VAPID_KEY=<your key>
//       Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';
import app from './firebase.js';

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

// How often to remind per day at most (stored in localStorage)
const NOTIF_KEY = 'plantpal_last_notified';

// ── Permission + FCM token ────────────────────────────────────────────────────
export async function initNotifications(userId) {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Register the background message handler service worker
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });

        if (!VAPID_KEY) {
            // PWA notifications still work on-app-open without a VAPID key
            console.info('PlantPal: FCM VAPID key not set — background push disabled. See notificationService.js for setup.');
            return;
        }

        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });

        if (token) {
            await updateDoc(doc(db, 'users', userId), { fcmToken: token });
        }

        // Handle foreground messages — pot notifications are never shown here
        onMessage(messaging, (payload) => {
            if (payload.data?.type === 'pot') return;
            new Notification(payload.notification?.title ?? '🌱 PlantPal', {
                body: payload.notification?.body ?? '',
                icon: '/icons/icon-192.png',
                tag:  'plantpal-care',
            });
        });

    } catch (err) {
        // Graceful degradation — notifications are optional
        console.warn('PlantPal: push notifications unavailable:', err.message);
    }
}

// ── On-app-open local reminder ────────────────────────────────────────────────
// Called from homePage.js after plants are loaded. Fires at most once per day.
export function checkAndNotifyDuePlants(plants) {
    if (!plants?.length) return;
    if (Notification.permission !== 'granted') return;

    const today = new Date().toDateString();
    if (localStorage.getItem(NOTIF_KEY) === today) return;

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const FERTILIZE_DAYS = 42;

    const waterDue = plants.filter(p => {
        if (!p.nextWatering) return false;
        const d = new Date(p.nextWatering);
        d.setHours(0, 0, 0, 0);
        return d <= todayMidnight;
    });

    const fertilizeDue = plants.filter(p => {
        const ref = p.lastFertilized ? new Date(p.lastFertilized)
                  : p.dateAdded     ? new Date(p.dateAdded) : null;
        return ref && (Date.now() - ref.getTime()) / 86400000 >= FERTILIZE_DAYS;
    });

    if (!waterDue.length && !fertilizeDue.length) return;

    const msgs = [];
    if (waterDue.length)      msgs.push(`${waterDue.length} plant${waterDue.length > 1 ? 's' : ''} need watering`);
    if (fertilizeDue.length)  msgs.push(`${fertilizeDue.length} need fertilizing`);

    new Notification('🌱 PlantPal Reminder', {
        body:  msgs.join(' · '),
        icon:  '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag:   'plantpal-care',
    });

    localStorage.setItem(NOTIF_KEY, today);
}
