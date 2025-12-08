// src/myPlantDetailView.js

import { deletePlant, updatePlantDate, getPlantDetails } from './plantService.js';
import { renderMyPlantsPage } from './myPlantsPage.js';

export async function renderMyPlantDetailView(container, plant, userProfile, authUser) {
    container.innerHTML = '<div class="loading-screen"><p class="loading-text">Loading Plant Care...</p></div>';

    try {
        // 1. Fetch Full API Details
        let apiDetails = {};
        if (plant.api_id) {
            try {
                apiDetails = await getPlantDetails(plant.api_id);
            } catch (e) {
                console.warn("Using local fallback", e);
            }
        }

        // 2. Setup Variables
        const imageUrl = plant.profilePicURL || apiDetails.default_image?.regular_url || 'https://via.placeholder.com/400/41b883/FFFFFF?text=No+Image';
        const commonName = plant.customName || plant.common_name;
        const scientificName = plant.scientific_name || apiDetails.scientific_name?.[0] || '';
        const description = apiDetails.description || "No description available.";
        
        let tagsHTML = '';
        if (apiDetails.indoor) tagsHTML += '<span class="tag-chip"><i class="fa-solid fa-house"></i> Indoor</span>';
        if (apiDetails.poisonous_to_pets) tagsHTML += '<span class="tag-chip warning"><i class="fa-solid fa-skull-crossbones"></i> Toxic</span>';
        else if (apiDetails.poisonous_to_pets === false) tagsHTML += '<span class="tag-chip safe"><i class="fa-solid fa-paw"></i> Pet Safe</span>';

        const lastWatered = formatDate(plant.lastWatered);
        const lastFertilized = plant.lastFertilized ? formatDate(plant.lastFertilized) : 'Never';

        // 3. Render HTML
        container.innerHTML = `
            <div class="plant-detail-wrapper">
                <div class="detail-header-image" style="background-image: url('${imageUrl}')">
                    <button id="my-plant-back-btn" class="nav-back-btn">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    </div>

                <div class="detail-content">
                    <header class="detail-title-section">
                        <h1>${commonName}</h1>
                        <p class="scientific-name">${scientificName}</p>
                        <div class="tags-row">${tagsHTML}</div>
                    </header>

                    <hr class="divider">

                    <section class="care-dashboard">
                        <div class="care-card">
                            <i class="fa-solid fa-droplet" style="color:#64b5f6"></i>
                            <span>Last Watered</span>
                            <strong id="display-watered">${lastWatered}</strong>
                            <button id="btn-water-now" class="action-chip">Water Now</button>
                        </div>
                        <div class="care-card">
                            <i class="fa-solid fa-leaf" style="color:#def39b"></i>
                            <span>Last Fertilized</span>
                            <strong id="display-fertilized">${lastFertilized}</strong>
                            <button id="btn-fertilize-now" class="action-chip">Fertilize</button>
                        </div>
                    </section>

                    <hr class="divider">

                    <section class="stats-grid">
                        <div class="stat-item">
                            <i class="fa-solid fa-sun stat-icon"></i>
                            <span class="stat-label">Sunlight</span>
                            <span class="stat-value">${formatText(apiDetails.sunlight)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-droplet stat-icon"></i>
                            <span class="stat-label">Watering</span>
                            <span class="stat-value">${formatText(apiDetails.watering)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-seedling stat-icon"></i>
                            <span class="stat-label">Care Level</span>
                            <span class="stat-value">${formatText(apiDetails.maintenance)}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-ruler-vertical stat-icon"></i>
                            <span class="stat-label">Growth</span>
                            <span class="stat-value">${apiDetails.growth_rate || 'Moderate'}</span>
                        </div>
                    </section>

                    <hr class="divider">
                    
                    <section class="detail-description">
                        <h3>About</h3>
                        <p>${description}</p>
                    </section>

                    <button id="delete-plant-btn" class="danger-button">
                        <i class="fa-solid fa-trash"></i> Delete Plant
                    </button>
                </div>
            </div>
        `;

        // --- LISTENERS ---

        // Back
        document.getElementById('my-plant-back-btn').addEventListener('click', () => {
            renderMyPlantsPage(container, userProfile, authUser);
        });

        // 🏆 Delete Logic with Confirmation
        document.getElementById('delete-plant-btn').addEventListener('click', async () => {
            // Native browser confirm dialog
            const confirmed = window.confirm(`Are you sure you want to delete ${commonName}? This cannot be undone.`);
            
            if (confirmed) {
                // Change text to show processing
                const btn = document.getElementById('delete-plant-btn');
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
                btn.disabled = true;

                await deletePlant(authUser.uid, plant.id);
                renderMyPlantsPage(container, userProfile, authUser); // Go back to gallery
            }
        });

        // Update Dates
        const todayStr = new Date().toISOString();
        
        document.getElementById('btn-water-now').addEventListener('click', async () => {
            await updatePlantDate(authUser.uid, plant.id, 'lastWatered', todayStr);
            document.getElementById('display-watered').textContent = formatDate(todayStr);
        });

        document.getElementById('btn-fertilize-now').addEventListener('click', async () => {
            await updatePlantDate(authUser.uid, plant.id, 'lastFertilized', todayStr);
            document.getElementById('display-fertilized').textContent = formatDate(todayStr);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = `<h1 style="color: #f44336; padding: 20px;">Error loading plant details.</h1>`;
    }
}

// Helpers
function formatDate(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatText(val) {
    if (Array.isArray(val)) return val.map(s => s.replace(/_/g, ' ')).join(', ');
    if (!val) return 'Unknown';
    const str = val.toString().replace(/_/g, ' ');
    return str.charAt(0).toUpperCase() + str.slice(1);
}