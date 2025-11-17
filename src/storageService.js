// src/storageService.js

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a profile image and returns its public URL.
 * @param {string} uid - The user's ID.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The public download URL of the uploaded image.
 */
export async function uploadProfilePicture(uid, file) {
    // Create a reference path: 'users/{uid}/profile.jpg'
    const imageRef = ref(storage, `users/${uid}/profile.jpg`);

    try {
        // Upload the file
        const snapshot = await uploadBytes(imageRef, file);
        
        // Get the public URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // We will update the user's profile document with this URL later
        return downloadURL;

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        throw error;
    }
}