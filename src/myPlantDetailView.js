// src/myPlantDetailView.js

import { deletePlant, updatePlantDate } from './plantService.js';
import { renderMyPlantsPage } from './myPlantsPage.js';
import { openJournalModal } from './journalModal.js';
import { rtdb } from './firebase.js';
import { logoSVG } from './logoSVG.js';
import { ref, get } from 'firebase/database';
import { PLANT_IMAGES } from './plantImages.js';

const PLANT_EXTRAS = {
    aloe_vera:           { poisonous: true,  maintenance: 'Low' },
    chinese_money_plant: { poisonous: false, maintenance: 'Moderate' },
    jade_plant:          { poisonous: true,  maintenance: 'Low' },
    monstera:            { poisonous: true,  maintenance: 'Moderate' },
    peace_lily:          { poisonous: true,  maintenance: 'Moderate' },
    pothos:              { poisonous: true,  maintenance: 'Low' },
    rubber_plant:        { poisonous: true,  maintenance: 'Moderate' },
    snake_plant:         { poisonous: true,  maintenance: 'Low' },
    spider_plant:        { poisonous: false, maintenance: 'Low' },
    string_of_pearls:    { poisonous: true,  maintenance: 'Moderate' },
    zebra_plant:         { poisonous: false, maintenance: 'High' },
    zz_plant:            { poisonous: true,  maintenance: 'Low' },
};

function lightLabel(care) {
    return care?.light?.type || '—';
}

function wateringLabel(care) {
    const max = care?.moisture?.max;
    if (!max) return '—';
    if (max <= 25) return 'Every 3–6 weeks';
    if (max <= 30) return 'Every 2–4 weeks';
    if (max <= 50) return 'Every 1–2 weeks';
    if (max <= 60) return 'Every 5–7 days';
    return 'Every 2–4 days';
}

function humidityLabel(care) {
    const ideal = care?.humidity?.ideal;
    if (!ideal) return '—';
    if (ideal >= 65) return 'High';
    if (ideal >= 50) return 'Average';
    return 'Low';
}

export async function renderMyPlantDetailView(container, plant, userProfile, authUser) {
    container.innerHTML = '<div class="loading-screen"><p class="loading-text">Loading Plant Care...</p></div>';

    try {
        let rtdbPlant = null;
        const rtdbId = plant.rtdb_id;
        if (rtdbId) {
            const snap = await get(ref(rtdb, '/plants/' + rtdbId));
            if (snap.exists()) rtdbPlant = snap.val();
        }

        const tempUnit    = userProfile?.temperatureUnit || 'C';
        const extras      = PLANT_EXTRAS[rtdbId] || {};
        const commonName  = plant.customName || plant.common_name || 'My Plant';
        const scientific  = plant.scientific_name || '';
        const imageUrl    = plant.profilePicURL || PLANT_IMAGES[rtdbId] || '';
        const description = rtdbPlant?.description || 'No description available.';
        const care        = rtdbPlant?.care || {};
        const moistureNotes = care.moisture?.notes || '';
        const humidNotes    = care.humidity?.notes || '';
        const tempCare    = tempUnit === 'F' ? care.temperature_f : care.temperature_c;
        const tempLabel   = tempCare ? `${tempCare.min}–${tempCare.max}°${tempUnit}` : '—';

        const lastWatered    = formatDate(plant.lastWatered);
        const lastFertilized = plant.lastFertilized ? formatDate(plant.lastFertilized) : 'Never';

        // Monthly journal prompt: flag if no entry in last 30 days
        const lastJournal        = plant.lastJournalEntry ? new Date(plant.lastJournalEntry) : null;
        const daysSinceJournal   = lastJournal ? (Date.now() - lastJournal.getTime()) / 86400000 : Infinity;
        const showJournalPrompt  = daysSinceJournal >= 30;
        const lastJournalLabel   = lastJournal ? formatDate(plant.lastJournalEntry) : 'Never';

        const fertilize     = rtdbPlant?.fertilize || null;
        const careLevel     = rtdbPlant?.care_level || extras.maintenance || '—';

        const careLevelLabel = { easy: 'Easy', medium: 'Moderate', high: 'Demanding', low: 'Easy', moderate: 'Moderate' }[careLevel] || careLevel;
        const sunLabel       = lightLabel(care);
        const waterLabel     = wateringLabel(care);

        let tagsHTML = '';
        if (careLevelLabel && careLevelLabel !== '—') tagsHTML += `<span class="tag-chip tag-chip--care"><i class="fa-solid fa-seedling"></i> ${careLevelLabel}</span>`;
        if (sunLabel        && sunLabel !== '—')       tagsHTML += `<span class="tag-chip tag-chip--sun"><i class="fa-solid fa-sun"></i> ${sunLabel}</span>`;
        if (waterLabel      && waterLabel !== '—')     tagsHTML += `<span class="tag-chip tag-chip--water"><i class="fa-solid fa-droplet"></i> ${waterLabel}</span>`;
        if (extras.poisonous === true)  tagsHTML += '<span class="tag-chip warning"><i class="fa-solid fa-paw"></i> Toxic</span>';
        if (extras.poisonous === false) tagsHTML += '<span class="tag-chip safe"><i class="fa-solid fa-paw"></i> Pet Safe</span>';
        const fertilizeFreq = fertilize?.frequency || '—';
        const fertilizeSzn  = fertilize?.season    || '';
        const fertilizeNote = fertilize?.notes      || '';

        container.innerHTML = `
            <div class="plant-detail-wrapper">
                <div class="detail-header-image ${imageUrl ? '' : 'detail-header-image--empty'}" ${imageUrl ? `style="background-image:url('${imageUrl}')"` : ''}>
                    <button id="my-plant-back-btn" class="nav-back-btn">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    ${!imageUrl ? `<div class="detail-header-icon">${logoSVG()}</div>` : ''}
                </div>

                <div class="detail-content">
                    <header class="detail-title-section">
                        <h1>${commonName}</h1>
                        <p class="scientific-name">${scientific}</p>
                        <div class="tags-row">${tagsHTML}</div>
                    </header>

                    <hr class="divider">

                    ${showJournalPrompt ? `
                    <div class="journal-prompt-banner">
                        <i class="fa-solid fa-book-open"></i>
                        Time for a monthly progress update!
                    </div>` : ''}

                    <section class="care-dashboard">
                        <div class="care-card">
                            <i class="fa-solid fa-droplet" style="color:#64b5f6"></i>
                            <span>Last Watered</span>
                            <strong id="display-watered">${lastWatered}</strong>
                            <button id="btn-water-now" class="action-chip">Water Now</button>
                        </div>
                        <div class="care-card">
                            <i class="fa-solid fa-seedling" style="color:#def39b"></i>
                            <span>Last Fertilized</span>
                            <strong id="display-fertilized">${lastFertilized}</strong>
                            <button id="btn-fertilize-now" class="action-chip">Fertilize</button>
                        </div>
                        <div class="care-card care-card--journal ${showJournalPrompt ? 'care-card--prompt' : ''}">
                            ${showJournalPrompt ? '<span class="journal-prompt-dot"></span>' : ''}
                            <i class="fa-solid fa-book-open" style="color:#a8e063"></i>
                            <span>Last Journal</span>
                            <strong>${lastJournalLabel}</strong>
                            <button id="btn-journal" class="action-chip">Add Entry</button>
                        </div>
                    </section>

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
                        <div class="stat-item">
                            <i class="fa-solid fa-seedling stat-icon"></i>
                            <span class="stat-label">Fertilizing</span>
                            <span class="stat-value">${fertilizeFreq}</span>
                            ${fertilizeSzn ? `<span class="stat-sub">${fertilizeSzn}</span>` : ''}
                        </div>
                        <div class="stat-item">
                            <i class="fa-solid fa-gauge stat-icon"></i>
                            <span class="stat-label">Care Level</span>
                            <span class="stat-value" style="text-transform:capitalize;">${careLevel}</span>
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
                        ${fertilizeNote ? `
                        <div class="care-note">
                            <span class="care-note-icon"><i class="fa-solid fa-seedling"></i></span>
                            <span>${fertilizeNote}</span>
                        </div>` : ''}
                    </div>

                    <button id="delete-plant-btn" class="danger-button">
                        <i class="fa-solid fa-trash"></i> Delete Plant
                    </button>
                </div>
            </div>
        `;

        document.getElementById('my-plant-back-btn').addEventListener('click', () => {
            renderMyPlantsPage(container, userProfile, authUser);
        });

        document.getElementById('delete-plant-btn').addEventListener('click', async () => {
            const confirmed = window.confirm(`Are you sure you want to delete ${commonName}? This cannot be undone.`);
            if (confirmed) {
                const btn = document.getElementById('delete-plant-btn');
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';
                btn.disabled = true;
                await deletePlant(authUser.uid, plant.id);
                renderMyPlantsPage(container, userProfile, authUser);
            }
        });

        const todayStr = new Date().toISOString();

        document.getElementById('btn-water-now').addEventListener('click', async () => {
            await updatePlantDate(authUser.uid, plant.id, 'lastWatered', todayStr);
            document.getElementById('display-watered').textContent = formatDate(todayStr);
        });

        document.getElementById('btn-fertilize-now').addEventListener('click', async () => {
            await updatePlantDate(authUser.uid, plant.id, 'lastFertilized', todayStr);
            document.getElementById('display-fertilized').textContent = formatDate(todayStr);
        });

        document.getElementById('btn-journal').addEventListener('click', () => {
            openJournalModal(plant, authUser, {
                onSaved: ({ photoURL }) => {
                    // If user replaced the profile photo, update the hero image live
                    if (photoURL) {
                        const hero = container.querySelector('.detail-header-image');
                        if (hero) {
                            hero.style.backgroundImage = `url('${photoURL}')`;
                            hero.classList.remove('detail-header-image--empty');
                        }
                    }
                    // Refresh the journal card label
                    const journalStrong = container.querySelector('.care-card--journal strong');
                    if (journalStrong) journalStrong.textContent = formatDate(new Date().toISOString());
                    const dot = container.querySelector('.journal-prompt-dot');
                    dot?.remove();
                    container.querySelector('.journal-prompt-banner')?.remove();
                    container.querySelector('.care-card--journal')?.classList.remove('care-card--prompt');
                },
            });
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = `<h1 style="color:#f44336;padding:20px;">Error loading plant details.</h1>`;
    }
}

function formatDate(isoString) {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
