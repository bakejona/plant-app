// src/plantService.js

import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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
 * Includes robust logic to calculate 'nextWatering' even if API data is messy.
 */
export async function addPlantToUser(uid, plantData, userInputs) {
    const { customName, customImage, lastWatered } = userInputs;

    // 1. Force Lowercase & Check inputs
    const rawWatering = (plantData.watering || '').toLowerCase(); 
    
    // 2. Set a Safe Default (7 days) so math never fails
    let intervalDays = 7; 

    if (rawWatering.includes('frequent')) intervalDays = 7;
    else if (rawWatering.includes('average')) intervalDays = 14;
    else if (rawWatering.includes('minimum')) intervalDays = 21;
    else if (rawWatering.includes('none')) intervalDays = 30;

    // 3. Calculate Date safely
    const lastWateredDate = new Date(lastWatered); 
    const nextWateredDate = new Date(lastWateredDate);
    nextWateredDate.setDate(nextWateredDate.getDate() + intervalDays);

    // 4. Validate Date (If NaN, use Today)
    const validNextDate = isNaN(nextWateredDate.getTime()) ? new Date().toISOString() : nextWateredDate.toISOString();

    const newPlantDoc = {
        api_id: plantData.id,
        common_name: plantData.common_name,
        scientific_name: plantData.scientific_name?.[0] || '',
        customName: customName || plantData.common_name,
        profilePicURL: customImage || plantData.default_image?.thumbnail || '',
        wateringFrequency: plantData.watering || 'Average',
        intervalDays: intervalDays,
        lastWatered: lastWateredDate.toISOString(),
        nextWatering: validNextDate, // <--- Using the safe date
        roomLocation: 'Living Room',
        dateAdded: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, 'users', uid, 'plants'), newPlantDoc);
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


// ----------------------------------------------------
// 2. PERENUAL API FUNCTIONS (With Mock Fallback)
// ----------------------------------------------------

const API_KEY = import.meta.env.VITE_PERENUAL_API_KEY;
const BASE_URL = "https://perenual.com/api/v2";

// Mock Data for when API limit is reached
const MOCK_PLANTS = [
    {
        id: 1, common_name: "Monstera Deliciosa", scientific_name: ["Monstera deliciosa"],
        default_image: { thumbnail: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=300&auto=format&fit=crop", regular_url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=1000" },
        watering: "Average", sunlight: ["part_shade"], maintenance: "Average", indoor: true, poisonous_to_pets: true, description: "A classic mock plant for development."
    },
    {
        id: 2, common_name: "Snake Plant", scientific_name: ["Sansevieria trifasciata"],
        default_image: { thumbnail: "https://images.unsplash.com/photo-1598547432573-455b72df43cc?q=80&w=300&auto=format&fit=crop", regular_url: "https://images.unsplash.com/photo-1598547432573-455b72df43cc?q=80&w=1000" },
        watering: "Minimum", sunlight: ["shade"], maintenance: "Low", indoor: true, poisonous_to_pets: true, description: "Hard to kill, easy to mock."
    },
    {
        id: 3, common_name: "Spider Plant", scientific_name: ["Chlorophytum comosum"],
        default_image: { thumbnail: "https://images.unsplash.com/photo-1572688484279-a27d5543c5ee?q=80&w=300&auto=format&fit=crop", regular_url: "https://images.unsplash.com/photo-1572688484279-a27d5543c5ee?q=80&w=1000" },
        watering: "Average", sunlight: ["part_shade"], maintenance: "Low", indoor: true, poisonous_to_pets: false, description: "Pet safe and great for testing."
    }
];

export async function searchPlantSpecies(queryString, filters = {}) {
    if (!API_KEY) {
        console.warn("No API Key, returning MOCK DATA");
        return MOCK_PLANTS;
    }

    let url = `${BASE_URL}/species-list?key=${API_KEY}&page=1&indoor=1&per_page=100`;
    if (queryString) url += `&q=${encodeURIComponent(queryString)}`;

    // Append Filters
    if (filters.maintenance) url += `&maintenance=${filters.maintenance}`; 
    if (filters.sunlight) url += `&sunlight=${filters.sunlight}`;
    if (filters.watering) url += `&watering=${filters.watering}`;
    if (filters.poisonous !== undefined) url += `&poisonous=${filters.poisonous}`;

    try {
        const response = await fetch(url);
        
        // 🚨 FALLBACK TRIGGER
        if (response.status === 429) {
            console.warn("⚠️ API Limit Reached! Switching to Mock Data.");
            return MOCK_PLANTS; 
        }
        
        if (!response.ok) throw new Error(response.statusText);
        
        const data = await response.json();
        let results = data.data || [];

        // Filter: Valid Images Only
        results = results.filter(plant => 
            plant.default_image && 
            plant.default_image.thumbnail && 
            !plant.default_image.thumbnail.includes("upgrade_access")
        );

        // Format Names
        return results.map(plant => ({
            ...plant,
            common_name: formatPlantName(plant.common_name)
        })).sort((a, b) => a.common_name.localeCompare(b.common_name));

    } catch (error) {
        console.warn("API Error (using mock data):", error);
        return MOCK_PLANTS; 
    }
}

export async function getPlantDetails(plantId) {
    // Check mock data first
    const mockMatch = MOCK_PLANTS.find(p => p.id == plantId);
    if (mockMatch) return mockMatch;

    if (!API_KEY) return MOCK_PLANTS[0];

    const url = `${BASE_URL}/species/details/${plantId}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        
        if (response.status === 429) {
            console.warn("⚠️ API Limit Reached! Returning Mock Detail.");
            return MOCK_PLANTS[0]; 
        }

        if (!response.ok) throw new Error("Details fetch failed");
        
        const data = await response.json();
        data.common_name = formatPlantName(data.common_name);
        return data; 

    } catch (error) {
        console.warn("Detail Fetch Error (using mock):", error);
        return MOCK_PLANTS[0];
    }
}

export async function fetchTrendingPlants() {
    return await searchPlantSpecies(''); 
}

// ----------------------------------------------------
// 3. UTILITIES
// ----------------------------------------------------

function formatPlantName(name) {
    if (!name) return "Unknown Plant";
    // Clean up hyphens, spaces, and capitalize words
    return name
        .replace(/-/g, ' ') 
        .replace(/\s+/g, ' ')
        .toLowerCase()
        .replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}