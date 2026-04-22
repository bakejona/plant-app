// src/plantService.js

import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc, orderBy, limit, getDoc } from 'firebase/firestore';

// ----------------------------------------------------
// 1. FIREBASE FIRESTORE FUNCTIONS (User Data)
// ----------------------------------------------------

/**
 * Fetches all plants for a specific user.
 */
export async function getMyPlants(uid) {
    const plantsCollectionRef = collection(db, 'users', uid, 'plants');
    const q = query(plantsCollectionRef);

    try {
        const querySnapshot = await getDocs(q);
        const plants = [];
        querySnapshot.forEach((doc) => {
            plants.push({ 
                id: doc.id, 
                ...doc.data() 
            });
        });
        return plants;
    } catch (error) {
        console.error('Error fetching plants:', error);
        throw error;
    }
}

/**
 * Adds a new plant to the user's collection.
 * Derives watering interval from the plant's moisture care range in RTDB.
 */
export async function addPlantToUser(uid, plantData, userInputs) {
    const { customName, customImage, lastWatered } = userInputs;

    // Derive interval from care.moisture.max (RTDB plants)
    const moistureMax = plantData.care?.moisture?.max ?? 50;
    let intervalDays = 14;
    if (moistureMax <= 30) intervalDays = 21;
    else if (moistureMax >= 60) intervalDays = 7;

    const lastWateredDate = new Date(lastWatered);
    const nextWateredDate = new Date(lastWateredDate);
    nextWateredDate.setDate(nextWateredDate.getDate() + intervalDays);

    const validNextDate = isNaN(nextWateredDate.getTime()) ? new Date().toISOString() : nextWateredDate.toISOString();

    const newPlantDoc = {
        rtdb_id: plantData.id || '',
        common_name: plantData.name,
        scientific_name: plantData.scientific_name || '',
        customName: customName || plantData.name,
        profilePicURL: customImage || '',
        intervalDays: intervalDays,
        lastWatered: lastWateredDate.toISOString(),
        nextWatering: validNextDate,
        roomLocation: 'Living Room',
        dateAdded: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, 'users', uid, 'plants'), newPlantDoc);
        if (customImage) {
            await addToPhotoGallery(uid, { plantId: '', plantName: newPlantDoc.customName, photoURL: customImage });
        }
        return true;
    } catch (error) {
        console.error("Error adding plant:", error);
        throw error;
    }
}

/**
 * Deletes a plant from Firestore.
 */
export async function deletePlant(uid, plantId) {
    try {
        await deleteDoc(doc(db, 'users', uid, 'plants', plantId));
        return true;
    } catch (error) {
        console.error("Error deleting plant:", error);
        throw error;
    }
}

/**
 * Updates a specific date field (used for manual Water/Fertilize buttons).
 */
export async function updatePlantDate(uid, plantId, field, dateStr) {
    try {
        const plantRef = doc(db, 'users', uid, 'plants', plantId);
        await updateDoc(plantRef, {
            [field]: dateStr
        });
    } catch (error) {
        console.error("Error updating plant:", error);
        throw error;
    }
}

/**
 * Adds a journal entry for a plant and updates lastJournalEntry timestamp.
 */
export async function addJournalEntry(uid, plantId, { comment, rating, photoURL, replacedPhoto }) {
    const now = new Date().toISOString();
    const plantRef = doc(db, 'users', uid, 'plants', plantId);
    const journalRef = collection(db, 'users', uid, 'plants', plantId, 'journal');

    await addDoc(journalRef, { comment, rating, photoURL: photoURL || '', replacedPhoto: !!replacedPhoto, timestamp: now });
    await updateDoc(plantRef, { lastJournalEntry: now });

    if (replacedPhoto && photoURL) {
        await updateDoc(plantRef, { profilePicURL: photoURL });
    }

    if (photoURL) {
        const plantSnap = await getDoc(plantRef);
        const plantName = plantSnap.exists() ? (plantSnap.data().customName || 'My Plant') : 'My Plant';
        await addToPhotoGallery(uid, { plantId, plantName, photoURL });
    }
}

/**
 * Stores a photo in the user's photo gallery (for the home hero).
 */
export async function addToPhotoGallery(uid, { plantId, plantName, photoURL }) {
    try {
        const timestamp = new Date().toISOString();
        await addDoc(collection(db, 'users', uid, 'photos'), {
            plantId, plantName, photoURL, timestamp,
        });
    } catch (e) {
        console.error('addToPhotoGallery error:', e);
    }
}

/**
 * Fetches the user's photo gallery (most recent 30), used by the home hero.
 */
export async function getGalleryPhotos(uid) {
    try {
        const q = query(
            collection(db, 'users', uid, 'photos'),
            orderBy('timestamp', 'desc'),
            limit(30)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('getGalleryPhotos error:', e);
        return [];
    }
}

/**
 * Marks a task as complete.
 * Resets 'lastWatered' to NOW and calculates the NEW 'nextWatering' date.
 */
export async function waterPlant(uid, plantId, intervalDays) {
    try {
        const plantRef = doc(db, 'users', uid, 'plants', plantId);
        
        const now = new Date();
        const nextDate = new Date();
        
        // Ensure interval is a number
        const days = parseInt(intervalDays) || 7;
        nextDate.setDate(now.getDate() + days);

        await updateDoc(plantRef, {
            lastWatered: now.toISOString(),
            nextWatering: nextDate.toISOString()
        });
        return true;
    } catch (error) {
        console.error("Error watering plant:", error);
        throw error;
    }
}
