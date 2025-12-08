// src/plantDetailPage.js

import { getPlantDetails } from './plantService.js';

export async function renderPlantDetailPage(container, plantId, userProfile, authUser) {
    container.innerHTML = '<div class="loading-screen"><p>Loading...</p></div>';

    try {
        const plant = await getPlantDetails(plantId);
        container.innerHTML = generateDetailHTML(plant);
        
        // 1. Top Left Back Button (Circle)
        document.getElementById('back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back(); // Preserves Quiz Results
        });

        // 2. Add Plant Button
        document.getElementById('detail-add-btn')?.addEventListener('click', async () => {
            alert(`${plant.common_name} added! (Functionality coming soon)`);
        });

        // 3. ⬅️ NEW: Bottom "Back to Results" Button
        document.getElementById('bottom-back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back(); // Preserves Quiz Results
        });

    } catch (error) {
        container.innerHTML = `<div class="error-screen"><h1>Error</h1><p>${error.message}</p></div>`;
    }
}

function generateDetailHTML(plant) {
    const imageUrl = plant.default_image?.regular_url || plant.default_image?.thumbnail || 'https://via.placeholder.com/400/41b883/FFFFFF?text=No+Image';
    const commonName = plant.common_name || 'Unknown Plant';
    const scientificName = plant.scientific_name?.[0] || 'Unknown Species';
    const description = plant.description || "A beautiful indoor plant.";

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
                        ${plant.indoor ? '<span class="tag-chip"><i class="fa-solid fa-house"></i> Indoor</span>' : ''}
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
                    <h3>About</h3>
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

function formatText(val) {
    if (Array.isArray(val)) return val.join(', ');
    if (!val) return 'Unknown';
    return val.toString().replace(/_/g, ' ');
}