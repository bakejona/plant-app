// src/homePage.js

import { getMyPlants, waterPlant, updatePlantDate, getGalleryPhotos } from './plantService.js';
import { openJournalModal } from './journalModal.js';
import { logoSVG } from './logoSVG.js';
import { PLANT_IMAGES } from './plantImages.js';

// ── WMO weather code → full FA class string ───────────────────────────────────
function weatherIconClass(code, isDay) {
    if (code === undefined || code === null) return 'fa-solid fa-cloud';
    if (code === 0)   return isDay ? 'fa-regular fa-sun'       : 'fa-regular fa-moon';
    if (code <= 2)    return isDay ? 'fa-solid fa-cloud-sun'   : 'fa-solid fa-cloud-moon';
    if (code === 3)   return 'fa-solid fa-cloud';
    if (code <= 49)   return 'fa-solid fa-smog';
    if (code <= 67)   return 'fa-solid fa-cloud-rain';
    if (code <= 77)   return 'fa-regular fa-snowflake';
    if (code <= 82)   return 'fa-solid fa-cloud-showers-heavy';
    if (code <= 99)   return 'fa-solid fa-bolt-lightning';
    return 'fa-solid fa-cloud';
}

// ── Plant care tips (sourced from RHS, AHS, University Extensions) ─────────────
const CARE_TIPS = [
    "Water only when the top inch of soil is dry — overwatering is the leading cause of houseplant death. (RHS)",
    "Wipe dusty leaves with a damp cloth monthly to maximise light absorption and photosynthesis. (RHS)",
    "Repot in spring when roots circle the drainage holes — move up just one pot size to prevent root rot. (AHS)",
    "Fertilise every 2–4 weeks in spring and summer only; skip feeding entirely during winter. (RHS)",
    "Most houseplants prefer bright indirect light — direct afternoon sun can scorch leaves within minutes.",
    "Group plants together to create a humid microclimate naturally beneficial to tropical species. (RHS)",
    "Prune just above a leaf node with clean scissors to encourage bushier, healthier new growth. (Clemson Extension)",
    "Check the undersides of leaves weekly — spider mites, aphids, and scale insects hide there. (NC State Extension)",
    "Yellowing leaves typically signal overwatering or poor drainage, not underwatering. (University of Minnesota Extension)",
    "Use room-temperature water — cold water can shock roots, especially on tropical houseplants.",
    "Rotate your plant a quarter turn each week so all sides receive equal light exposure.",
    "In winter, move plants closer to windows as natural light levels drop significantly. (RHS)",
];

// ── Greeting ──────────────────────────────────────────────────────────────────
function getGreeting(displayName) {
    const hour = new Date().getHours();
    const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const first  = displayName ? displayName.split(' ')[0] : '';
    return `Good ${period}${first ? `, ${first}` : ''}`;
}

// ── Widget builders ───────────────────────────────────────────────────────────
function weatherWidgetHTML(weatherData, tempUnit) {
    if (!weatherData) {
        return `
            <div class="hw-weather hw-weather--empty">
                <i class="fa-solid fa-location-dot hw-weather-empty-icon"></i>
                <p class="hw-weather-empty-text">Set your location to see weather</p>
                <button class="hw-set-loc-btn" id="set-location-prompt">Set location</button>
            </div>`;
    }
    const temp = Math.round(tempUnit === 'F' ? weatherData.tempF : weatherData.tempC);
    const icon = weatherIconClass(weatherData.conditionCode, weatherData.isDay);
    const city = weatherData.city || weatherData.region || '—';
    return `
        <div class="hw-weather">
            <div class="hw-weather-top">
                <i class="${icon} hw-weather-icon"></i>
                <span class="hw-weather-condition">${weatherData.conditionText || ''}</span>
            </div>
            <div class="hw-weather-temp">${temp}<span class="hw-weather-deg">°</span></div>
            <div class="hw-weather-city">${city}</div>
        </div>`;
}

function collageWidgetHTML(photos, plants) {
    // Build a pool of up to 4 images: gallery photos first, then plant profile pics
    let pool = photos.slice(0, 4).map(p => p.photoURL);
    if (pool.length < 4) {
        plants
            .filter(p => p.profilePicURL && !pool.includes(p.profilePicURL))
            .forEach(p => { if (pool.length < 4) pool.push(p.profilePicURL); });
    }
    // Fill remaining slots with a muted placeholder
    while (pool.length < 4) pool.push(null);

    const cells = pool.map(url => url
        ? `<div class="hw-collage-cell" style="background-image:url('${url}')"></div>`
        : `<div class="hw-collage-cell hw-collage-cell--empty">${logoSVG('hw-collage-logo')}</div>`
    ).join('');

    return `<div class="hw-collage">${cells}</div>`;
}

function careTipHTML() {
    const tip = CARE_TIPS[Math.floor(Math.random() * CARE_TIPS.length)];
    return `
        <div class="hw-tips">
            <div class="hw-tips-icon"><i class="fa-solid fa-circle-info"></i></div>
            <p class="hw-tips-text">${tip}</p>
        </div>`;
}

function addPlantBtnHTML() {
    return `
        <a href="#search" class="hw-add-btn" title="Add a plant">
            <span class="hw-add-plus">+</span>
            <i class="fa-solid fa-leaf hw-add-leaf"></i>
        </a>`;
}

// ── Task card HTML ────────────────────────────────────────────────────────────
function taskCardHTML(plant, type) {
    const img = plant.profilePicURL || PLANT_IMAGES[plant.rtdb_id] || '';
    const imgStyle = img
        ? `background-image:url('${img}');background-size:cover;background-position:center;`
        : 'background:#1a3d28;';

    const typeConfig = {
        water:    { icon: 'fa-droplet',   color: '#64b5f6', label: 'Needs Water',         btnIcon: 'fa-check', btnClass: 'task-done-btn',                          dataAttr: `data-type="water" data-id="${plant.id}" data-interval="${plant.intervalDays}"` },
        fertilize:{ icon: 'fa-seedling',  color: '#def39b', label: 'Fertilize Due',       btnIcon: 'fa-check', btnClass: 'task-done-btn',                          dataAttr: `data-type="fertilize" data-id="${plant.id}"` },
        journal:  { icon: 'fa-book-open', color: '#a8e063', label: 'Progress Update Due', btnIcon: 'fa-pen',   btnClass: 'task-done-btn task-journal-btn', dataAttr: `data-type="journal" data-id="${plant.id}"` },
    };
    const cfg = typeConfig[type];

    return `
        <div class="task-card fade-in" id="task-${type}-${plant.id}">
            <div class="task-img" style="${imgStyle}"></div>
            <div class="task-info">
                <h4>${plant.customName}</h4>
                <p><i class="fa-solid ${cfg.icon}" style="color:${cfg.color};"></i> ${cfg.label}</p>
            </div>
            <button class="${cfg.btnClass}" ${cfg.dataAttr}>
                <i class="fa-solid ${cfg.btnIcon}"></i>
            </button>
        </div>`;
}

function taskSectionHTML(title, icon, color, cards) {
    if (!cards.length) return '';
    return `
        <div class="task-section">
            <div class="task-section-header">
                <i class="fa-solid ${icon}" style="color:${color};"></i>
                <span>${title}</span>
            </div>
            ${cards.join('')}
        </div>`;
}

// ── Main render ───────────────────────────────────────────────────────────────
export async function renderHomePage(container, profile, weatherData, authUser) {
    let plants = [];
    if (authUser) {
        try { plants = await getMyPlants(authUser.uid); }
        catch (e) { console.error(e); }
    }

    // Load photos for collage
    let galleryPhotos = [];
    if (authUser) {
        try { galleryPhotos = await getGalleryPhotos(authUser.uid); }
        catch (e) { console.error(e); }
    }

    const tempUnit    = profile.temperatureUnit || 'C';
    const displayName = profile.displayName || profile.email?.split('@')[0] || '';

    // ── Task classification ───────────────────────────────────────────────────
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const FERTILIZE_DAYS = 42;
    const JOURNAL_DAYS   = 30;

    const waterPlants = plants.filter(plant => {
        if (!plant.nextWatering) return false;
        const d = new Date(plant.nextWatering);
        d.setHours(0, 0, 0, 0);
        return d <= todayMidnight;
    });

    const fertilizePlants = plants.filter(plant => {
        const ref = plant.lastFertilized ? new Date(plant.lastFertilized)
                  : plant.dateAdded      ? new Date(plant.dateAdded) : null;
        return ref && (Date.now() - ref.getTime()) / 86400000 >= FERTILIZE_DAYS;
    });

    const journalPlants = plants.filter(plant => {
        const ref = plant.lastJournalEntry ? new Date(plant.lastJournalEntry)
                  : plant.dateAdded        ? new Date(plant.dateAdded) : null;
        return ref && (Date.now() - ref.getTime()) / 86400000 >= JOURNAL_DAYS;
    });

    const totalTasks = waterPlants.length + fertilizePlants.length + journalPlants.length;

    // ── Task HTML ─────────────────────────────────────────────────────────────
    let tasksHTML = '';
    if (plants.length === 0) {
        tasksHTML = `
            <div class="home-empty-card">
                <div class="home-empty-deco" aria-hidden="true">
                    <div class="home-empty-circle"></div>
                    ${logoSVG('home-empty-logo')}
                </div>
                <h3 class="home-empty-title">No Plants Yet</h3>
                <p class="home-empty-sub">Add your first plant to<br>generate care tasks.</p>
                <a href="#search" class="home-empty-btn">
                    Find a Plant <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>`;
    } else if (totalTasks === 0) {
        tasksHTML = `
            <div class="home-all-good-card">
                <i class="fa-solid fa-circle-check"></i>
                <div>
                    <p class="home-all-good-title">All caught up!</p>
                    <p class="home-all-good-sub">Your plants are happy today.</p>
                </div>
            </div>`;
    } else {
        tasksHTML = `<div class="task-list">` +
            taskSectionHTML('Water',           'fa-droplet',   '#64b5f6', waterPlants.map(p     => taskCardHTML(p, 'water'))) +
            taskSectionHTML('Fertilize',       'fa-seedling',  '#def39b', fertilizePlants.map(p => taskCardHTML(p, 'fertilize'))) +
            taskSectionHTML('Progress Update', 'fa-book-open', '#a8e063', journalPlants.map(p   => taskCardHTML(p, 'journal'))) +
        `</div>`;
    }

    // ── Render ────────────────────────────────────────────────────────────────
    container.innerHTML = `
        <div class="home-wrapper">

            <div class="hw-header">
                <div class="hw-header-left">
                    ${logoSVG('hw-logo')}
                    <span class="hw-greeting">${getGreeting(displayName)}</span>
                </div>
            </div>

            <div class="hw-grid">
                ${weatherWidgetHTML(weatherData, tempUnit)}
                ${collageWidgetHTML(galleryPhotos, plants)}
                ${careTipHTML()}
                ${addPlantBtnHTML()}
            </div>

            <div class="home-tasks-wrap">
                <div class="home-section-title">
                    <h2>Today's Tasks</h2>
                    ${totalTasks > 0 ? `<span class="home-task-badge">${totalTasks}</span>` : ''}
                </div>
                ${tasksHTML}
            </div>

        </div>
    `;

    // ── Event handlers ────────────────────────────────────────────────────────
    container.querySelector('#set-location-prompt')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('pmenu-open-btn')?.click();
    });

    container.querySelectorAll('.task-done-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const type    = btn.dataset.type;
            const plantId = btn.dataset.id;
            const card    = document.getElementById(`task-${type}-${plantId}`);

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            if (!authUser) return;

            if (type === 'water') {
                try {
                    await waterPlant(authUser.uid, plantId, btn.dataset.interval);
                    dismissCard(card, container, profile, weatherData, authUser);
                } catch (err) {
                    console.error(err);
                    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                }
            } else if (type === 'fertilize') {
                try {
                    await updatePlantDate(authUser.uid, plantId, 'lastFertilized', new Date().toISOString());
                    dismissCard(card, container, profile, weatherData, authUser);
                } catch (err) {
                    console.error(err);
                    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                }
            } else if (type === 'journal') {
                btn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                const plant = plants.find(p => p.id === plantId);
                if (!plant) return;
                openJournalModal(plant, authUser, {
                    onSaved: () => dismissCard(card, container, profile, weatherData, authUser),
                });
            }
        });
    });
}

function dismissCard(card, container, profile, weatherData, authUser) {
    if (!card) return;
    card.style.opacity   = '0';
    card.style.transform = 'translateX(20px)';
    setTimeout(() => {
        card.remove();
        container.querySelectorAll('.task-section').forEach(sec => {
            if (!sec.querySelector('.task-card')) sec.remove();
        });
        if (!container.querySelector('.task-card')) {
            const list = container.querySelector('.task-list');
            if (list) list.outerHTML = `
                <div class="home-all-good-card">
                    <i class="fa-solid fa-circle-check"></i>
                    <div>
                        <p class="home-all-good-title">All caught up!</p>
                        <p class="home-all-good-sub">Your plants are happy today.</p>
                    </div>
                </div>`;
            container.querySelector('.home-task-badge')?.remove();
        } else {
            const remaining = container.querySelectorAll('.task-card').length;
            const badge = container.querySelector('.home-task-badge');
            if (badge) badge.textContent = remaining;
        }
    }, 300);
}
