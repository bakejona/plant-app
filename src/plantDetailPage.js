// src/plantDetailPage.js

import { rtdb } from './firebase.js';
import { ref, get } from 'firebase/database';
import { openAddPlantModal } from './addPlantModal.js';
import { logoSVG } from './logoSVG.js';
import { PLANT_IMAGES } from './plantImages.js';

export async function renderPlantDetailPage(container, plantId, userProfile, authUser) {
    container.innerHTML = '<div class="loading-screen"><p class="loading-text">Loading Plant Details...</p></div>';

    try {
        const snap = await get(ref(rtdb, '/plants/' + plantId));
        if (!snap.exists()) throw new Error('Plant not found.');

        const plant = { id: plantId, ...snap.val() };

        // Fetch all plants for "Similar to" section
        const allSnap = await get(ref(rtdb, '/plants'));
        const similarPlants = allSnap.exists()
            ? getSimilarPlants(plant, allSnap.val())
            : [];

        container.innerHTML = generateDetailHTML(plant, userProfile?.temperatureUnit || 'C', similarPlants);

        document.getElementById('back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });

        document.getElementById('detail-add-btn')?.addEventListener('click', () => {
            if (!authUser) {
                alert('Please sign in to add plants to your collection.');
                return;
            }
            openAddPlantModal(plant, authUser);
        });

        // Similar plant navigation
        container.querySelectorAll('[data-similar-id]').forEach(el => {
            el.addEventListener('click', () => {
                window.location.hash = `#plantdetail/${el.dataset.similarId}`;
            });
        });

    } catch (error) {
        console.error('Detail Render Error:', error);
        container.innerHTML = `
            <div class="error-screen">
                <i class="fa-solid fa-circle-exclamation" style="font-size:3em;color:#f44336;margin-bottom:20px;"></i>
                <h1>Could not load plant</h1>
                <p class="error-text">${error.message}</p>
                <button class="primary-button" onclick="window.history.back()">Go Back</button>
            </div>
        `;
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lightLabel(care) {
    return care?.light?.type || 'Unknown';
}

function wateringLabel(care) {
    const max = care?.moisture?.max;
    if (!max) return 'Unknown';
    if (max <= 25) return 'Every 3–6 weeks';
    if (max <= 30) return 'Every 2–4 weeks';
    if (max <= 50) return 'Every 1–2 weeks';
    if (max <= 60) return 'Every 5–7 days';
    return 'Every 2–4 days';
}

function humidityLabel(care) {
    const ideal = care?.humidity?.ideal;
    if (!ideal) return 'Unknown';
    if (ideal >= 65) return 'High';
    if (ideal >= 50) return 'Average';
    return 'Low';
}

function getSimilarPlants(plant, allPlantsObj) {
    const myLightType  = plant.care?.light?.type || '';
    const myMoistMax   = plant.care?.moisture?.max ?? 50;

    return Object.entries(allPlantsObj)
        .filter(([id]) => id !== plant.id)
        .filter(([, p]) => {
            const sameLightType   = p.care?.light?.type === myLightType;
            const similarMoisture = Math.abs((p.care?.moisture?.max ?? 50) - myMoistMax) <= 20;
            return sameLightType || similarMoisture;
        })
        .slice(0, 3)
        .map(([id, p]) => ({ id, ...p }));
}

// ── HTML generation ───────────────────────────────────────────────────────────

function generateDetailHTML(plant, tempUnit, similarPlants) {
    const name          = plant.name || 'Unknown Plant';
    const scientific    = plant.scientific_name || '';
    const description   = plant.description || 'No description available.';
    const care          = plant.care || {};
    const moistureNotes = care.moisture?.notes || '';
    const humidNotes    = care.humidity?.notes || '';
    const tempCare      = tempUnit === 'F' ? care.temperature_f : care.temperature_c;
    const tempLabel     = tempCare ? `${tempCare.min}–${tempCare.max}°${tempUnit}` : '—';
    const heroImg       = PLANT_IMAGES[plant.id] || '';

    const similarHTML = similarPlants.length ? `
        <section class="similar-plants-section">
            <h3 class="similar-plants-title">Similar to</h3>
            <div class="similar-plants-row">
                ${similarPlants.map(p => {
                    const simImg = PLANT_IMAGES[p.id] || '';
                    return `
                    <div class="similar-plant-card" data-similar-id="${p.id}">
                        <div class="similar-plant-icon ${simImg ? 'similar-plant-icon--photo' : ''}" ${simImg ? `style="background-image:url('${simImg}');background-size:cover;background-position:center;"` : ''}>${simImg ? '' : logoSVG()}</div>
                        <p class="similar-plant-name">${p.name || p.id}</p>
                        <p class="similar-plant-sci">${p.scientific_name || ''}</p>
                    </div>`;
                }).join('')}
            </div>
        </section>
    ` : '';

    return `
        <div class="plant-detail-wrapper">
            <div class="detail-header-image ${heroImg ? '' : 'detail-header-image--empty'}" ${heroImg ? `style="background-image:url('${heroImg}')"` : ''}>
                <button id="back-btn" class="nav-back-btn">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                ${heroImg ? '' : `<div class="detail-header-icon">${logoSVG()}</div>`}
                <button id="detail-add-btn" class="detail-add-fab">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>

            <div class="detail-content">
                <header class="detail-title-section">
                    <h1>${name}</h1>
                    <p class="scientific-name">${scientific}</p>
                </header>

                <hr class="divider">

                <section class="stats-grid">
                    <div class="stat-item">
                        <i class="fa-solid fa-sun stat-icon"></i>
                        <span class="stat-label">Light</span>
                        <span class="stat-value">${lightLabel(care)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-droplet stat-icon"></i>
                        <span class="stat-label">Watering</span>
                        <span class="stat-value">${wateringLabel(care)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-wind stat-icon"></i>
                        <span class="stat-label">Humidity</span>
                        <span class="stat-value">${humidityLabel(care)}</span>
                    </div>
                    <div class="stat-item">
                        <i class="fa-solid fa-temperature-half stat-icon"></i>
                        <span class="stat-label">Temperature</span>
                        <span class="stat-value">${tempLabel}</span>
                    </div>
                </section>

                <hr class="divider">

                <div class="pot-info-card detail-info-card">
                    <h3 class="detail-info-heading">About this Plant</h3>
                    <div class="care-note">
                        <span class="care-note-icon"><i class="fa-solid fa-circle-info"></i></span>
                        <span>${description}</span>
                    </div>
                    ${moistureNotes ? `
                    <div class="care-note">
                        <span class="care-note-icon"><i class="fa-solid fa-droplet"></i></span>
                        <span>${moistureNotes}</span>
                    </div>` : ''}
                    ${humidNotes ? `
                    <div class="care-note">
                        <span class="care-note-icon"><i class="fa-solid fa-wind"></i></span>
                        <span>${humidNotes}</span>
                    </div>` : ''}
                </div>

                ${similarHTML}

                <button id="bottom-back-btn" class="secondary-text-btn" onclick="window.history.back()">
                    <i class="fa-solid fa-arrow-left"></i> Back to Results
                </button>
            </div>
        </div>
    `;
}
