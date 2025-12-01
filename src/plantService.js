// src/plantService.js

import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// ----------------------------------------------------
// FIREBASE FIRESTORE FUNCTIONS (EXISTING)
// ----------------------------------------------------

/**
 * Fetches all plants belonging to the authenticated user.
 * @param {string} uid - The authenticated user's ID.
 * @returns {Promise<Array<object>>} Array of plant documents.
 */
export async function getMyPlants(uid) {
    // Reference the 'plants' subcollection under the specific user's document
    const plantsCollectionRef = collection(db, 'users', uid, 'plants');
    // ... (rest of the function remains the same)
    
    // Assuming the full logic is here.
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
        console.log(`Found ${plants.length} plants for user ${uid}.`);
        return plants;
    } catch (error) {
        console.error('Error fetching plants:', error);
        throw error;
    }
}


// ----------------------------------------------------
// PERENUAL API FUNCTIONS (NEW)
// ----------------------------------------------------

const API_KEY = import.meta.env.VITE_PERENUAL_API_KEY;
const BASE_URL = "https://perenual.com/api/v2";

/**
 * Searches the Perenual API for plant species based on a query.
 * @param {string} queryString - The name or keyword to search for.
 * @returns {Promise<Array<object>>} Array of matching species results.
 */
export async function searchPlantSpecies(queryString) {
    if (!API_KEY || !queryString) {
        return [];
    }

    const url = `${BASE_URL}/species-list?key=${API_KEY}&q=${queryString}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Perenual API failed: ${response.statusText}`);
        }
        const data = await response.json();
        
        // Return the actual data array from the API response
        return data.data || []; 
    } catch (error) {
        console.error('Error searching plant species:', error);
        throw error;
    }
}