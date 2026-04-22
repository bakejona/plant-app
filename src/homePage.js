// src/homePage.js

import { getMyPlants, waterPlant, updatePlantDate, getGalleryPhotos } from './plantService.js';
import { openJournalModal } from './journalModal.js';
import { logoSVG } from './logoSVG.js';
import { PLANT_IMAGES } from './plantImages.js';

// ── WMO weather code → Font Awesome icon ─────────────────────────────────────
function weatherIcon(code, isDay) {
    if (code === undefined || code === null) return 'fa-cloud';
    if (code === 0)          return isDay ? 'fa-sun' : 'fa-moon';
    if (code <= 2)           return isDay ? 'fa-cloud-sun' : 'fa-cloud-moon';
    if (code === 3)          return 'fa-cloud';
    if (code <= 49)          return 'fa-smog';
    if (code <= 67)          return 'fa-cloud-rain';
    if (code <= 77)          return 'fa-snowflake';
    if (code <= 82)          return 'fa-cloud-showers-heavy';
    if (code <= 99)          return 'fa-bolt-lightning';
    return 'fa-cloud';
}

// ── Task card HTML ────────────────────────────────────────────────────────────
function taskCardHTML(plant, type) {
    const img = plant.profilePicURL || PLANT_IMAGES[plant.rtdb_id] || '';
    const imgStyle = img
        ? `background-image:url('${img}');background-size:cover;background-position:center;`
        : 'background:#1a3d28;';

    const typeConfig = {
        water:    { icon: 'fa-droplet',   color: '#64b5f6', label: 'Needs Water',        btnIcon: 'fa-check', btnClass: 'task-done-btn',                         dataAttr: `data-type="water" data-id="${plant.id}" data-interval="${plant.intervalDays}"` },
        fertilize:{ icon: 'fa-seedling',  color: '#def39b', label: 'Fertilize Due',      btnIcon: 'fa-check', btnClass: 'task-done-btn',                         dataAttr: `data-type="fertilize" data-id="${plant.id}"` },
        journal:  { icon: 'fa-book-open', color: '#a8e063', label: 'Progress Update Due', btnIcon: 'fa-pen',  btnClass: 'task-done-btn task-journal-btn', dataAttr: `data-type="journal" data-id="${plant.id}"` },
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

// ── Hero: lockscreen-style photo cycler ───────────────────────────────────────
function formatHeroDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function initHero(heroEl, photos, weatherData, tempUnit) {
    const now     = new Date();
    const dayNum  = now.getDate();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

    // Shuffle photos, cap at 20
    const pool      = [...photos].sort(() => Math.random() - 0.5).slice(0, 20);
    const hasPhotos = pool.length > 0;
    const first     = pool[0];

    const slidesHTML = pool.map((p, i) => `
        <div class="home-hero-slide${i === 0 ? ' is-active' : ''}"
             style="background-image:url('${p.photoURL}');"
             data-name="${(p.plantName || '').replace(/"/g, '&quot;')}"
             data-ts="${p.timestamp || ''}"></div>
    `).join('');

    // Dots (z-indexed above the widget's fade zone)
    const dotsHTML = pool.length > 1
        ? `<div class="home-hero-dots">${pool.map((_, i) => `<div class="home-hero-dot${i === 0 ? ' is-active' : ''}"></div>`).join('')}</div>`
        : '';

    // Plant label — top-left, no pill
    const plantLabelHTML = hasPhotos ? `
        <div class="hero-plant-label" id="hero-plant-label">
            <p class="hero-pl-name">${first ? first.plantName : ''}</p>
            <p class="hero-pl-date">${first ? formatHeroDate(first.timestamp) : ''}</p>
        </div>` : '';

    // Bottom widget — 4 items evenly spaced
    let widgetInner = '';
    if (weatherData) {
        const tempValue = tempUnit === 'F' ? weatherData.tempF : weatherData.tempC;
        const icon      = weatherIcon(weatherData.conditionCode, weatherData.isDay);
        const city      = weatherData.city || weatherData.region || '—';
        widgetInner = `
            <div class="hhg-item">
                <i class="fa-solid fa-location-dot hhg-item-icon"></i>
                <span class="hhg-item-val">${city}</span>
            </div>
            <div class="hhg-sep"></div>
            <div class="hhg-item">
                <div class="hhg-item-row">
                    <i class="fa-solid ${icon} hhg-item-icon"></i>
                    <span class="hhg-item-val">${Math.round(tempValue)}°</span>
                </div>
                <span class="hhg-item-sub">${weatherData.conditionText}</span>
            </div>
            <div class="hhg-sep"></div>
            <div class="hhg-item">
                <span class="hhg-item-val hhg-item-val--lg">${dayNum}</span>
                <span class="hhg-item-sub">${dayName}</span>
            </div>
            <div class="hhg-sep"></div>
            <div class="hhg-item">
                <span class="hhg-item-val" id="hero-time">${formatTime(now)}</span>
            </div>`;
    } else {
        widgetInner = `
            <div class="hhg-item">
                <span class="hhg-item-val hhg-item-val--lg">${dayNum}</span>
                <span class="hhg-item-sub">${dayName}</span>
            </div>
            <div class="hhg-sep"></div>
            <div class="hhg-item">
                <span class="hhg-item-val" id="hero-time">${formatTime(now)}</span>
            </div>`;
    }

    heroEl.innerHTML = `
        ${slidesHTML}
        <div class="home-hero-overlay"></div>
        <div class="home-hero-content">
            ${plantLabelHTML}
            ${dotsHTML}
            <div class="hhg">${widgetInner}</div>
        </div>
    `;

    // Live clock
    const timeEl  = heroEl.querySelector('#hero-time');
    const clockId = setInterval(() => {
        if (timeEl && heroEl.isConnected) timeEl.textContent = formatTime(new Date());
        else clearInterval(clockId);
    }, 60000);

    if (pool.length <= 1) return null;

    // Photo cycling
    let idx = 0;
    const slides = heroEl.querySelectorAll('.home-hero-slide');
    const dots   = heroEl.querySelectorAll('.home-hero-dot');
    const label  = heroEl.querySelector('#hero-plant-label');

    const intervalId = setInterval(() => {
        slides[idx].classList.remove('is-active');
        dots[idx]?.classList.remove('is-active');
        idx = (idx + 1) % pool.length;
        slides[idx].classList.add('is-active');
        dots[idx]?.classList.add('is-active');

        if (label) {
            label.style.opacity = '0';
            setTimeout(() => {
                label.querySelector('.hero-pl-name').textContent  = pool[idx].plantName || '';
                label.querySelector('.hero-pl-date').textContent  = formatHeroDate(pool[idx].timestamp);
                label.style.opacity = '1';
            }, 500);
        }
    }, 15000);

    return intervalId;
}

export async function renderHomePage(container, profile, weatherData, authUser) {
    // Clear any previous cycling interval
    if (container._heroInterval) {
        clearInterval(container._heroInterval);
        container._heroInterval = null;
    }

    let plants = [];
    if (authUser) {
        try { plants = await getMyPlants(authUser.uid); }
        catch (e) { console.error(e); }
    }

    const tempUnit = profile.temperatureUnit || 'C';

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
        const last  = plant.lastFertilized ? new Date(plant.lastFertilized) : null;
        const added = plant.dateAdded      ? new Date(plant.dateAdded)      : null;
        const ref   = last || added;
        if (!ref) return false;
        return (Date.now() - ref.getTime()) / 86400000 >= FERTILIZE_DAYS;
    });

    const journalPlants = plants.filter(plant => {
        const last  = plant.lastJournalEntry ? new Date(plant.lastJournalEntry) : null;
        const added = plant.dateAdded        ? new Date(plant.dateAdded)        : null;
        const ref   = last || added;
        if (!ref) return false;
        return (Date.now() - ref.getTime()) / 86400000 >= JOURNAL_DAYS;
    });

    const totalTasks = waterPlants.length + fertilizePlants.length + journalPlants.length;

    // ── Build task HTML ───────────────────────────────────────────────────────
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

    // ── Render shell ──────────────────────────────────────────────────────────
    container.innerHTML = `
        <div class="home-wrapper">
            <div id="home-hero" class="home-hero"></div>

            <div class="home-tasks-wrap">
                <div class="home-section-title">
                    <h2>Today's Tasks</h2>
                    ${totalTasks > 0 ? `<span class="home-task-badge">${totalTasks}</span>` : ''}
                </div>
                ${tasksHTML}
            </div>

            <a href="#search" class="floating-add-btn">
                <i class="fa-solid fa-plus"></i>
            </a>
        </div>
    `;

    // ── Build hero photo pool ─────────────────────────────────────────────────
    let heroPhotos = [];
    if (authUser) {
        try {
            heroPhotos = await getGalleryPhotos(authUser.uid);
        } catch (e) { console.error(e); }

        // Fallback: use existing plant profilePicURLs not already in gallery
        if (heroPhotos.length === 0) {
            heroPhotos = plants
                .filter(p => p.profilePicURL)
                .map(p => ({
                    plantId:   p.id,
                    plantName: p.customName || p.common_name || 'My Plant',
                    photoURL:  p.profilePicURL,
                    timestamp: p.dateAdded || new Date().toISOString(),
                }));
        }
    }

    // ── Init hero ─────────────────────────────────────────────────────────────
    const heroEl = container.querySelector('#home-hero');
    if (heroEl) {
        const intervalId = initHero(heroEl, heroPhotos, weatherData, tempUnit);
        if (intervalId) container._heroInterval = intervalId;
    }

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
