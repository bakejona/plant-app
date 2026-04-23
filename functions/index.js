// functions/index.js
// Scheduled Cloud Function — sends daily plant care push notifications.
// Deploy with: firebase deploy --only functions
//
// SETUP:
//   1. cd functions && npm install
//   2. firebase deploy --only functions
//   The function runs at 9 AM UTC daily. Adjust the schedule as needed.

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp }  = require('firebase-admin/app');
const { getFirestore }   = require('firebase-admin/firestore');
const { getMessaging }   = require('firebase-admin/messaging');

initializeApp();
const db        = getFirestore();
const messaging = getMessaging();

const FERTILIZE_DAYS = 42;

exports.sendDailyPlantReminders = onSchedule('every day 09:00', async () => {
    const usersSnap = await db.collection('users').get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sends = [];

    for (const userDoc of usersSnap.docs) {
        const { fcmToken } = userDoc.data();
        if (!fcmToken) continue;

        const plantsSnap = await db
            .collection('users').doc(userDoc.id).collection('plants').get();

        const waterDue     = [];
        const fertilizeDue = [];

        for (const plantDoc of plantsSnap.docs) {
            const plant = plantDoc.data();

            // Water check
            if (plant.nextWatering) {
                const next = new Date(plant.nextWatering);
                next.setHours(0, 0, 0, 0);
                if (next <= today) waterDue.push(plant.customName || 'A plant');
            }

            // Fertilize check — never pot-sensor notifications
            const fertRef = plant.lastFertilized
                ? new Date(plant.lastFertilized)
                : plant.dateAdded ? new Date(plant.dateAdded) : null;
            if (fertRef && (Date.now() - fertRef.getTime()) / 86400000 >= FERTILIZE_DAYS) {
                fertilizeDue.push(plant.customName || 'A plant');
            }
        }

        if (!waterDue.length && !fertilizeDue.length) continue;

        const msgs = [];
        if (waterDue.length)     msgs.push(`${waterDue.length} plant${waterDue.length > 1 ? 's' : ''} need watering`);
        if (fertilizeDue.length) msgs.push(`${fertilizeDue.length} need fertilizing`);

        sends.push(
            messaging.send({
                token: fcmToken,
                notification: {
                    title: '🌱 PlantPal Reminder',
                    body:  msgs.join(' · '),
                },
                data: { type: 'care' },   // 'pot' type is never sent here
            }).catch(err => {
                // Token may be stale — clean it up
                if (err.code === 'messaging/registration-token-not-registered') {
                    return db.collection('users').doc(userDoc.id).update({ fcmToken: null });
                }
                console.error('FCM send error:', err);
            })
        );
    }

    await Promise.all(sends);
    console.log(`Reminders sent to ${sends.length} users.`);
});
