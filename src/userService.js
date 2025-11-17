// src/userService.js

// Import the Firestore instance from your main firebase setup
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
    temperatureUnit: data?.temperatureUnit || 'C' // Default temperature unit (matching wireframe)
  };

  try {
    // Check if the user document already exists
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // If user exists (sign-in), simply log and return the existing data.
      console.log('User profile exists in Firestore. Returning...');
      return docSnap.data();
    } else {
      // If user does NOT exist (new sign-up), create the document.
      // setDoc creates the document and if it already exists it will overwrite it.
      await setDoc(userRef, initialData, { merge: true });
      console.log('New user profile created in Firestore for:', user.email);
      return initialData;
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}