// src/plantDetailPage.js

import { getPlantDetails } from './plantService.js';
import { openAddPlantModal } from './addPlantModal.js'; 

/**
 * Renders the detailed view of a specific plant.
 * @param {HTMLElement} container - The main app container.
 * @param {string} plantId - The ID of the plant to fetch.
 * @param {object} userProfile - User profile data.
 * @param {object} authUser - Firebase Auth user object.
 */
export async function renderPlantDetailPage(container, plantId, userProfile, authUser) {
    container.innerHTML = '<div class="loading-screen"><p class="loading-text">Loading Plant Details...</p></div>';

    try {
        // 1. Fetch Data
        const plant = await getPlantDetails(plantId);
        
        // 2. Render HTML
        container.innerHTML = generateDetailHTML(plant);
        
        // 3. Attach Event Listeners

        // Top-Left Back Button (Circle)
        document.getElementById('back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back(); // Preserves previous scroll/quiz state
        });

        // Bottom "Back to Results" Button
        document.getElementById('bottom-back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });

        // "Add to My Plants" Button -> Opens Modal
        document.getElementById('detail-add-btn')?.addEventListener('click', () => {
            if (!authUser) {
                alert("Please sign in to add plants to your collection.");
                return;
            }
            // Trigger the modal logic
            openAddPlantModal(plant, authUser);
        });

    } catch (error) {
        console.error("Detail Render Error:", error);
        container.innerHTML = `
            <div class="error-screen">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 3em; color: #f44336; margin-bottom: 20px;"></i>
                <h1>Could not load plant</h1>
                <p class="error-text">${error.message}</p>
                <button class="primary-button" onclick="window.history.back()">Go Back</button>
            </div>
        `;
    }
}

/**
 * Generates the HTML structure for the plant detail page.
 */
function generateDetailHTML(plant) {
    // Fallbacks for missing data
    const imageUrl = plant.default_image?.regular_url || plant.default_image?.thumbnail || 'https://via.placeholder.com/400/41b883/FFFFFF?text=No+Image';
    const commonName = plant.common_name || 'Unknown Plant';
    const scientificName = plant.scientific_name?.[0] || 'Unknown Species';
    const description = plant.description || "No description available for this plant, but it is a great addition to your indoor garden.";

    // Logic for Tags
    let tagsHTML = '';
    if (plant.indoor) tagsHTML += '<span class="tag-chip"><i class="fa-solid fa-house"></i> Indoor</span>';
    if (plant.poisonous_to_pets) {
        tagsHTML += '<span class="tag-chip warning"><i class="fa-solid fa-skull-crossbones"></i> Toxic to Pets</span>';
    } else {
        tagsHTML += '<span class="tag-chip safe"><i class="fa-solid fa-paw"></i> Pet Safe</span>';
    }

    return `
        <div class="plant-detail-wrapper">
            <div class="detail-header-image" style="background-image: url('${imageUrl}')">
                <button id="back-btn" class="nav-back-btn">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
            </div>

            <div class="detail-content">
                <header class="detail-title-section">
                    <h1>${commonName}</h1>
                    <p class="scientific-name">${scientificName}</p>
                    <div class="tags-row">
                        ${tagsHTML}
                    </div>
                </header>

                <hr class="divider">

                <section class="stats-grid">
                    <div class="stat-item">
                        <i class="fa-solid fa-sun stat-icon"></i>
                        <span class="stat-label">Sunlight</span>
                        <span class="stat-value">${formatText(plant.sunlight)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-droplet stat-icon"></i>
                        <span class="stat-label">Watering</span>
                        <span class="stat-value">${formatText(plant.watering)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-seedling stat-icon"></i>
                        <span class="stat-label">Care Level</span>
                        <span class="stat-value">${formatText(plant.maintenance || plant.care_level)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-ruler-vertical stat-icon"></i>
                        <span class="stat-label">Growth</span>
                        <span class="stat-value">${plant.growth_rate || 'Moderate'}</span>
                    </div>
                </section>

                <hr class="divider">
                
                <section class="detail-description">
                    <h3>About this Plant</h3>
                    <p>${description}</p>
                </section>
                
                <button id="detail-add-btn" class="primary-button" style="width: 100%; margin-top: 30px; display: flex; justify-content: center; gap: 10px; padding: 15px;">
                    <i class="fa-solid fa-plus"></i> Add to My Plants
                </button>

                <button id="bottom-back-btn" class="secondary-text-btn">
                    <i class="fa-solid fa-arrow-left"></i> Back to Results
                </button>
            </div>
        </div>
    `;
}

/**
 * Helper to format API text (arrays to string, remove underscores).
 */
function formatText(val) {
    if (Array.isArray(val)) {
        return val.map(item => item.replace(/_/g, ' ')).join(', ');
    }
    if (!val) return 'Unknown';
    // Capitalize first letter and replace underscores
    const str = val.toString().replace(/_/g, ' ');
    return str.charAt(0).toUpperCase() + str.slice(1);
}