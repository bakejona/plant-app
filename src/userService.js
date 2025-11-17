// src/userService.js

// Import the Firestore instance from your main firebase setup
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// --- EXISTING PROFILE CREATION/CHECK LOGIC ---

/**
 * Creates or updates a user profile document in Firestore upon sign-up or sign-in.
 * * @param {object} user - The Firebase User object (from Auth).
 * @param {object} data - Optional data to merge into the profile (e.g., location, theme).
 */
export async function createOrUpdateUserProfile(user, data) {
  // Use the user's UID as the document ID for the 'users' collection
  const userRef = doc(db, 'users', user.uid);
  
  // Define the initial data based on your project proposal
  const initialData = {
    email: user.email,
    uid: user.uid,
    createdAt: new Date(),
    location: data?.location || 'New York, NY', // Default location
    theme: data?.theme || 'dark', // Default theme (dark mode)
    temperatureUnit: data?.temperatureUnit || 'C' // Default temperature unit
  };

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      console.log('User profile exists in Firestore. Returning...');
      return docSnap.data();
    } else {
      await setDoc(userRef, initialData, { merge: true });
      console.log('New user profile created in Firestore for:', user.email);
      return initialData;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}


// --- NEW FUNCTIONS FOR ACCOUNT PAGE ---

/**
 * Fetches the user's profile data from Firestore.
 * @param {string} uid - The authenticated user's ID.
 * @returns {Promise<object | null>}
 */
export async function getUserProfile(uid) {
    const userRef = doc(db, 'users', uid);
    try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn('User profile not found in Firestore for UID:', uid);
            return null;
        }
    } catch (error) {
        console.error('Error reading user profile:', error);
        throw error;
    }
}

/**
 * Updates specific fields in the user's Firestore profile.
 * @param {string} uid - The authenticated user's ID.
 * @param {object} updates - An object containing fields to update (e.g., {location: 'Chicago, IL'}).
 * @returns {Promise<void>}
 */
export async function updateUserProfile(uid, updates) {
    const userRef = doc(db, 'users', uid);
    try {
        // setDoc with { merge: true } updates existing fields without overwriting the entire document
        await setDoc(userRef, updates, { merge: true });
        console.log('User profile updated successfully.');
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}