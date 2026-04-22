// src/searchPage.js

import { rtdb } from './firebase.js';
import { ref, get } from 'firebase/database';
import { logoSVG } from './logoSVG.js';
import { PLANT_IMAGES } from './plantImages.js';

// ── Extra metadata not in RTDB ────────────────────────────────────────────────
const PLANT_EXTRAS = {
    aloe_vera:           { poisonous: true,  maintenance: 'low' },
    chinese_money_plant: { poisonous: false, maintenance: 'moderate' },
    jade_plant:          { poisonous: true,  maintenance: 'low' },
    monstera:            { poisonous: true,  maintenance: 'moderate' },
    peace_lily:          { poisonous: true,  maintenance: 'moderate' },
    pothos:              { poisonous: true,  maintenance: 'low' },
    rubber_plant:        { poisonous: true,  maintenance: 'moderate' },
    snake_plant:         { poisonous: true,  maintenance: 'low' },
    spider_plant:        { poisonous: false, maintenance: 'low' },
    string_of_pearls:    { poisonous: true,  maintenance: 'moderate' },
    zebra_plant:         { poisonous: false, maintenance: 'high' },
    zz_plant:            { poisonous: true,  maintenance: 'low' },
};

// ── RTDB plant cache ──────────────────────────────────────────────────────────
let cachedPlants = null;

async function getAllPlants() {
    if (cachedPlants) return cachedPlants;
    const snap = await get(ref(rtdb, '/plants'));
    if (!snap.exists()) return [];
    cachedPlants = Object.entries(snap.val()).map(([id, p]) => ({
        id, ...p, ...PLANT_EXTRAS[id]
    }));
    return cachedPlants;
}

// ── Client-side filtering ─────────────────────────────────────────────────────
function filterPlants(plants, query, filters) {
    let result = plants;

    if (query) {
        const q = query.toLowerCase();
        result = result.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.scientific_name?.toLowerCase().includes(q)
        );
    }

    if (filters.sunlight) {
        result = result.filter(p => {
            const lightMax = p.care?.light?.max ?? 50;
            const lightMin = p.care?.light?.min ?? 0;
            if (filters.sunlight === 'full_sun')   return lightMax >= 50;
            if (filters.sunlight === 'part_shade') return lightMax >= 25 && lightMin < 55;
            if (filters.sunlight === 'shade')      return lightMin <= 25;
            return true;
        });
    }

    if (filters.watering) {
        result = result.filter(p => {
            const max = p.care?.moisture?.max ?? 50;
            if (filters.watering === 'frequent') return max >= 60;
            if (filters.watering === 'average')  return max >= 40 && max < 60;
            if (filters.watering === 'minimum')  return max <= 40;
            return true;
        });
    }

    if (filters.maintenance) {
        result = result.filter(p => p.maintenance === filters.maintenance);
    }

    if (filters.poisonous === '0') {
        result = result.filter(p => !p.poisonous);
    }

    if (filters.humidity) {
        result = result.filter(p => {
            const ideal = p.care?.humidity?.ideal ?? 50;
            if (filters.humidity === 'high')    return ideal >= 65;
            if (filters.humidity === 'average') return ideal >= 50 && ideal < 65;
            if (filters.humidity === 'low')     return ideal < 50;
            return true;
        });
    }

    if (filters.temperature) {
        result = result.filter(p => {
            const min = p.care?.temperature_c?.min ?? 15;
            if (filters.temperature === 'cold')    return min <= 13;
            if (filters.temperature === 'average') return min > 13 && min < 18;
            if (filters.temperature === 'warm')    return min >= 18;
            return true;
        });
    }

    return result;
}

// ── Module state ──────────────────────────────────────────────────────────────
let savedFilters  = {};
let savedQuizStep = 0;
let filterPanelOpen = false;

// ── Quiz definition ───────────────────────────────────────────────────────────
const quizSteps = [
    {
        question: "How's the light in your space?",
        icon: "fa-sun",
        options: [
            { label: "Bright & sunny",  sublabel: "Direct sunlight most of the day", value: "full_sun",   type: "sunlight" },
            { label: "Bright indirect", sublabel: "Near a window, no direct rays",   value: "part_shade", type: "sunlight" },
            { label: "Low light",       sublabel: "Far from windows or artificial",  value: "shade",      type: "sunlight" },
        ]
    },
    {
        question: "How hands-on do you want to be?",
        icon: "fa-seedling",
        options: [
            { label: "Low effort",  sublabel: "I often forget to water",     value: "low",      type: "maintenance" },
            { label: "Moderate",    sublabel: "Check in a few times a week", value: "moderate", type: "maintenance" },
            { label: "Attentive",   sublabel: "I love caring for plants",    value: "high",     type: "maintenance" },
        ]
    },
    {
        question: "How often will you water?",
        icon: "fa-droplet",
        options: [
            { label: "Frequently",      sublabel: "Every few days",       value: "frequent", type: "watering" },
            { label: "Every 1–2 weeks", sublabel: "A regular routine",    value: "average",  type: "watering" },
            { label: "Rarely",          sublabel: "Once a month or less", value: "minimum",  type: "watering" },
        ]
    },
];

// ── Main render ───────────────────────────────────────────────────────────────
export async function renderSearchPage(container, profile, authUser) {
    container.innerHTML = generateSearchHTML();

    const searchInput           = document.getElementById('plant-search-input');
    const resultsContainer      = document.getElementById('search-results-list');
    const sectionTitle          = document.getElementById('section-title');
    const quizContainer         = document.getElementById('plant-quiz-container');
    const quizContent           = document.getElementById('quiz-content');
    const filterBtn             = document.getElementById('filter-btn');
    const filterPanel           = document.getElementById('filter-panel');
    const filterResultsContainer = document.getElementById('filter-results-container');
    const filterResultsList     = document.getElementById('filter-results-list');

    // ── Quiz start screen ─────────────────────────────────────────────────────
    const renderQuizStart = () => {
        sectionTitle.style.display = 'none';
        quizContent.innerHTML = `
            <div class="quiz-start-card fade-in">
                <div class="quiz-start-content">
                    <h2>Find Your Perfect Plant</h2>
                    <p>Answer 4 quick questions to find your best match.</p>
                </div>
                <div class="quiz-btn-container">
                    <button id="start-quiz-btn" class="start-btn">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            savedQuizStep = 0;
            renderQuizStep(0);
        });
    };

    // ── Quiz step ─────────────────────────────────────────────────────────────
    const renderQuizStep = (stepIndex) => {
        if (stepIndex >= quizSteps.length) { finishQuiz(); return; }
        sectionTitle.style.display = 'none';

        const step = quizSteps[stepIndex];
        quizContent.innerHTML = `
            <div class="quiz-step-card fade-in">
                <div class="quiz-header-row">
                    <div class="quiz-icon"><i class="fa-solid ${step.icon}"></i></div>
                    <h3>${step.question}</h3>
                </div>
                <div class="quiz-options">
                    ${step.options.map(opt => `
                        <button class="quiz-btn" data-type="${opt.type}" data-value="${opt.value}">
                            <span class="quiz-btn-label">${opt.label}</span>
                            <span class="quiz-btn-sub">${opt.sublabel}</span>
                        </button>
                    `).join('')}
                </div>
                <p class="quiz-progress-label">Step ${stepIndex + 1} of ${quizSteps.length}</p>
            </div>
        `;

        quizContent.querySelectorAll('.quiz-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const { type, value } = btn.dataset;
                if (!(type === 'poisonous' && value === 'any')) {
                    savedFilters[type] = value;
                }
                savedQuizStep++;
                renderQuizStep(savedQuizStep);
            });
        });
    };

    const finishQuiz = () => {
        quizContainer.style.display = 'none';
        updateResults(true);
    };

    const resetQuiz = () => {
        savedFilters  = {};
        savedQuizStep = 0;
        searchInput.value = '';
        resultsContainer.style.display = 'none';
        filterResultsContainer.style.display = 'none';
        quizContainer.style.display    = 'block';
        filterPanel.style.display = 'none';
        filterPanelOpen = false;
        filterBtn?.classList.remove('filter-btn--open');
        const hpSection = container.querySelector('#common-houseplants');
        if (hpSection) hpSection.style.display = '';
        renderQuizStart();
        updateFilterBadge();
    };

    // ── Filter panel toggle ───────────────────────────────────────────────────
    const filterGroups = [
        {
            key: 'maintenance', label: 'Care Level',
            options: [
                { label: 'Easy',      value: 'low' },
                { label: 'Moderate',  value: 'moderate' },
                { label: 'Demanding', value: 'high' },
            ]
        },
        {
            key: 'watering', label: 'Water Frequency',
            options: [
                { label: 'Frequent',  value: 'frequent' },
                { label: '1–2 weeks', value: 'average' },
                { label: 'Monthly+',  value: 'minimum' },
            ]
        },
        {
            key: 'humidity', label: 'Humidity',
            options: [
                { label: 'High',    value: 'high' },
                { label: 'Average', value: 'average' },
                { label: 'Low',     value: 'low' },
            ]
        },
        {
            key: 'poisonous', label: 'Toxicity',
            options: [
                { label: 'Pet-safe only', value: '0' },
                { label: 'Any',           value: 'any' },
            ]
        },
        {
            key: 'temperature', label: 'Temperature Tolerance',
            options: [
                { label: 'Cold tolerant', value: 'cold' },
                { label: 'Average',       value: 'average' },
                { label: 'Warm only',     value: 'warm' },
            ]
        },
    ];

    const renderFilterPanel = () => {
        filterPanel.innerHTML = filterGroups.map(group => `
            <div class="filter-group">
                <p class="filter-group-label">${group.label}</p>
                <div class="filter-group-pills">
                    ${group.options.map(opt => {
                        const active = savedFilters[group.key] === opt.value;
                        return `<button class="filter-pill ${active ? 'filter-pill--active' : ''}"
                            data-key="${group.key}" data-value="${opt.value}">${opt.label}</button>`;
                    }).join('')}
                </div>
            </div>
        `).join('') + `
            <div class="filter-actions-row">
                <button id="filter-show-btn" class="filter-show-btn">Show results</button>
                <button id="filter-clear-btn" class="filter-clear-btn">Clear filters</button>
            </div>
        `;

        filterPanel.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const { key, value } = pill.dataset;
                if (savedFilters[key] === value) {
                    delete savedFilters[key];
                } else {
                    savedFilters[key] = value;
                }
                renderFilterPanel();
                updateFilterBadge();
            });
        });

        document.getElementById('filter-clear-btn')?.addEventListener('click', () => {
            filterGroups.forEach(g => delete savedFilters[g.key]);
            renderFilterPanel();
            updateFilterBadge();
        });

        document.getElementById('filter-show-btn')?.addEventListener('click', () => {
            filterPanel.style.display = 'none';
            filterPanelOpen = false;
            filterBtn?.classList.remove('filter-btn--open');
            updateResults();
        });
    };

    const updateFilterBadge = () => {
        const activeCount = filterGroups.filter(g => savedFilters[g.key] !== undefined).length;
        const badge = document.getElementById('filter-badge');
        if (badge) {
            badge.textContent = activeCount;
            badge.style.display = activeCount > 0 ? 'flex' : 'none';
        }
    };

    filterBtn?.addEventListener('click', () => {
        filterPanelOpen = !filterPanelOpen;
        filterPanel.style.display = filterPanelOpen ? 'block' : 'none';
        filterBtn.classList.toggle('filter-btn--open', filterPanelOpen);
        if (filterPanelOpen) renderFilterPanel();
    });

    // ── Results update ────────────────────────────────────────────────────────
    const updateResults = async (fromQuiz = false) => {
        const query      = searchInput.value.trim();
        const hasFilters = Object.keys(savedFilters).length > 0;

        if (query.length > 0) {
            // Text search: hide quiz and filter results, show main results
            filterResultsContainer.style.display = 'none';
            sectionTitle.textContent   = `Results for "${query}"`;
            sectionTitle.style.display = 'block';
            quizContainer.style.display    = 'none';
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML     = '<p class="loading-text">Finding plants…</p>';
            try {
                const all     = await getAllPlants();
                const results = filterPlants(all, query, savedFilters);
                resultsContainer.innerHTML = results.length
                    ? renderPlantGrid(results)
                    : `<p class="no-results">No plants found for "${query}".</p>`;
            } catch (e) {
                resultsContainer.innerHTML = `<p class="error-text">Error: ${e.message}</p>`;
            }
        }
        else if (hasFilters && fromQuiz) {
            // Quiz completion: hide quiz, show results with retake button
            filterResultsContainer.style.display = 'none';
            sectionTitle.textContent   = 'Your Matches';
            sectionTitle.style.display = 'block';
            quizContainer.style.display    = 'none';
            resultsContainer.style.display = 'block';
            resultsContainer.innerHTML     = '<p class="loading-text">Finding matches…</p>';
            try {
                const all     = await getAllPlants();
                const results = filterPlants(all, '', savedFilters);
                if (results.length === 0) {
                    resultsContainer.innerHTML = `
                        <p class="no-results">No plants matched. Try different answers.</p>
                        <div style="text-align:center;margin-top:20px;">
                            <button id="retake-bottom" class="quiz-retake-btn">
                                <i class="fa-solid fa-rotate-left"></i> Retake quiz
                            </button>
                        </div>`;
                } else {
                    resultsContainer.innerHTML = renderPlantGrid(results) + `
                        <div style="text-align:center;margin-top:24px;padding-bottom:8px;">
                            <button id="retake-bottom" class="quiz-retake-btn">
                                <i class="fa-solid fa-rotate-left"></i> Retake quiz
                            </button>
                        </div>`;
                }
                document.getElementById('retake-bottom')?.addEventListener('click', resetQuiz);
            } catch (e) {
                resultsContainer.innerHTML = `<p class="error-text">Error: ${e.message}</p>`;
            }
        }
        else if (hasFilters && !fromQuiz) {
            // Filter panel results: show above quiz, quiz stays visible
            sectionTitle.style.display     = 'none';
            resultsContainer.style.display = 'none';
            filterResultsContainer.style.display = 'block';
            filterResultsList.innerHTML    = '<p class="loading-text">Finding matches…</p>';
            // Keep quiz visible below
            quizContainer.style.display = 'block';
            try {
                const all     = await getAllPlants();
                const results = filterPlants(all, '', savedFilters);
                filterResultsList.innerHTML = results.length
                    ? `<h2 class="section-title-label">Your Matches</h2>${renderPlantGrid(results)}`
                    : `<p class="no-results">No plants matched. Try adjusting your filters.</p>`;
            } catch (e) {
                filterResultsList.innerHTML = `<p class="error-text">Error: ${e.message}</p>`;
            }
        }
        else {
            // No query, no filters: show quiz
            filterResultsContainer.style.display = 'none';
            sectionTitle.style.display     = 'none';
            resultsContainer.style.display = 'none';
            quizContainer.style.display    = 'block';
            renderQuizStart();
        }
    };

    // ── Listeners ─────────────────────────────────────────────────────────────
    let debounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(updateResults, 400);
        const hpSection = container.querySelector('#common-houseplants');
        if (hpSection) hpSection.style.display = searchInput.value.trim() ? 'none' : '';
    });

    container.addEventListener('click', e => {
        const card = e.target.closest('[data-plant-id]');
        if (card) window.location.hash = `#plantdetail/${card.dataset.plantId}`;
    });

    // ── Initial render ────────────────────────────────────────────────────────
    if (Object.keys(savedFilters).length > 0) {
        updateResults();
    } else {
        renderQuizStart();
    }
    updateFilterBadge();
    loadCommonHouseplants(container);
}

// ── Plant grid ────────────────────────────────────────────────────────────────
function renderPlantGrid(plants) {
    return `<div class="plant-results-grid">${plants.map(plantResultCard).join('')}</div>`;
}

function plantResultCard(plant) {
    const name       = plant.name || 'Unknown Plant';
    const scientific = plant.scientific_name || '';
    const lightType  = plant.care?.light?.type || '';
    const moistMax   = plant.care?.moisture?.max ?? null;
    const waterLabel = moistMax !== null
        ? (moistMax >= 60 ? 'Frequent' : moistMax >= 40 ? 'Average' : 'Minimum')
        : '';

    const imgUrl = PLANT_IMAGES[plant.id] || '';
    return `
        <div class="plant-result-card" data-plant-id="${plant.id}">
            <div class="plant-result-img ${imgUrl ? '' : 'plant-result-img--empty'}" ${imgUrl ? `style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"` : ''}>
                ${imgUrl ? '' : logoSVG()}
            </div>
            <div class="plant-result-body">
                <p class="plant-result-name">${name}</p>
                <p class="plant-result-sci">${scientific}</p>
                <div class="plant-result-tags">
                    ${lightType  ? `<span class="plant-tag"><i class="fa-solid fa-sun"></i> ${lightType}</span>` : ''}
                    ${waterLabel ? `<span class="plant-tag"><i class="fa-solid fa-droplet"></i> ${waterLabel}</span>` : ''}
                    ${plant.poisonous ? `<span class="plant-tag plant-tag--warn"><i class="fa-solid fa-paw"></i> Toxic</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ── Common Houseplants ────────────────────────────────────────────────────────
async function loadCommonHouseplants(container) {
    const el = container.querySelector('#common-houseplants');
    if (!el) return;
    try {
        const plants = await getAllPlants();
        if (!plants.length) { el.style.display = 'none'; return; }
        el.innerHTML = `
            <h2 class="discover-section-label">Common Houseplants</h2>
            <div class="houseplant-scroll">
                ${plants.map(houseplantCard).join('')}
            </div>
        `;
    } catch (e) {
        el.style.display = 'none';
    }
}

function houseplantCard(plant) {
    const name       = plant.name || 'Unknown Plant';
    const scientific = plant.scientific_name || '';
    const imgUrl     = PLANT_IMAGES[plant.id] || '';
    return `
        <div class="hp-card">
            <div class="hp-card-img-wrap" data-plant-id="${plant.id}">
                <div class="hp-card-img ${imgUrl ? '' : 'hp-card-img--empty'}" ${imgUrl ? `style="background-image:url('${imgUrl}');background-size:cover;background-position:center;"` : ''}>${imgUrl ? '' : logoSVG()}</div>
            </div>
            <div class="hp-card-footer">
                <div class="hp-card-text">
                    <p class="hp-card-name">${name}</p>
                    <p class="hp-card-sci">${scientific}</p>
                </div>
                <button class="hp-card-add-btn" data-plant-id="${plant.id}" aria-label="Add to collection">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
            </div>
        </div>
    `;
}

// ── HTML shell ────────────────────────────────────────────────────────────────
function generateSearchHTML() {
    return `
        <div class="search-page-wrapper">
            <header class="search-header">
                <h1>Discover</h1>
                <div class="search-bar-row">
                    <div class="search-bar-container">
                        <i class="fa-solid fa-magnifying-glass search-icon"></i>
                        <input type="text" id="plant-search-input" placeholder="Search plants…">
                    </div>
                    <button id="filter-btn" class="filter-btn" aria-label="Filters">
                        <i class="fa-solid fa-sliders"></i>
                        <span id="filter-badge" class="filter-badge" style="display:none;">0</span>
                    </button>
                </div>
                <div id="filter-panel" class="filter-panel" style="display:none;"></div>
            </header>

            <section class="content-section">
                <div id="filter-results-container" style="display:none;">
                    <div id="filter-results-list"></div>
                </div>
                <h2 id="section-title" style="display:none;">Plant Finder</h2>
                <div id="plant-quiz-container">
                    <div id="quiz-content"></div>
                </div>
                <div id="search-results-list" style="display:none;"></div>
            </section>

            <section id="common-houseplants" class="content-section">
                <p class="loading-text" style="padding:0;">Loading houseplants…</p>
            </section>
        </div>
    `;
}
