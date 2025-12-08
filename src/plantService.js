// src/plantService.js

import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// ----------------------------------------------------
// FIREBASE FIRESTORE FUNCTIONS
// ----------------------------------------------------

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


// ----------------------------------------------------
// PERENUAL API FUNCTIONS
// ----------------------------------------------------

const API_KEY = import.meta.env.VITE_PERENUAL_API_KEY;
const BASE_URL = "https://perenual.com/api/v2";

/**
 * Searches the Perenual API.
 */
export async function searchPlantSpecies(queryString, filters = {}) {
    if (!API_KEY) return [];

    // Enforce Indoor & Maximize Results (up to 100 per page)
    let url = `${BASE_URL}/species-list?key=${API_KEY}&page=1&indoor=1&per_page=100`;

    if (queryString) url += `&q=${encodeURIComponent(queryString)}`;

    // Filters
    if (filters.maintenance) url += `&maintenance=${filters.maintenance}`; 
    if (filters.sunlight) url += `&sunlight=${filters.sunlight}`;
    if (filters.watering) url += `&watering=${filters.watering}`;
    if (filters.poisonous !== undefined) url += `&poisonous=${filters.poisonous}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Perenual API failed: ${response.statusText}`);
        }
        const data = await response.json();
        let results = data.data || [];

        // 1. CLEANUP: Filter valid plants with images
        results = results.filter(plant => 
            plant.default_image && 
            plant.default_image.thumbnail && 
            !plant.default_image.thumbnail.includes("upgrade_access")
        );

        // 2. FORMAT NAMES: Capitalize & Remove Hyphens
        results = results.map(plant => ({
            ...plant,
            common_name: formatPlantName(plant.common_name)
        }));

        // 3. SORT: Alphabetical
        return results.sort((a, b) => a.common_name.localeCompare(b.common_name));

    } catch (error) {
        console.error('Error searching plant species:', error);
        throw error;
    }
}

/**
 * Fetches detailed information for a specific plant by ID.
 */
export async function getPlantDetails(plantId) {
    if (!API_KEY || !plantId) throw new Error("Invalid API Key or Plant ID");

    const url = `${BASE_URL}/species/details/${plantId}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 429) throw new Error("API Limit Reached.");
            throw new Error(`Details fetch failed: ${response.statusText}`);
        }
        
        const data = await response.json();

        // Format the name in the details view too!
        data.common_name = formatPlantName(data.common_name);

        return data; 

    } catch (error) {
        console.error('Error fetching plant details:', error);
        throw error;
    }
}

/**
 * Fetches "Trending" plants (Default List)
 */
export async function fetchTrendingPlants() {
    return await searchPlantSpecies(''); 
}

// ----------------------------------------------------
// HELPER: NAME FORMATTER
// ----------------------------------------------------
function formatPlantName(name) {
    if (!name) return "Unknown Plant";
    
    return name
        // 1. Replace hyphens with spaces
        .replace(/-/g, ' ') 
        // 2. Replace multiple spaces with single space
        .replace(/\s+/g, ' ')
        // 3. Capitalize the First Letter of Each Word
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}