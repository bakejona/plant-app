// src/potDashboard.js
// Live data: /plant  (humidity, light, moisture, temperature, history/…)
// Plant profiles: /plants
// Selected plant: /pot/selected_plant

import { rtdb } from './firebase.js';
import { ref, onValue, get, set } from 'firebase/database';
import { logoSVG } from './logoSVG.js';

let unsubscribeReadings = null;
let unsubscribePot = null;
let stalenessTimer = null;

// ── Status logic ──────────────────────────────────────────────────────────────
// good : comfortably within range (not within 15% of either boundary)
// warn : within range but near a boundary
// bad  : outside min–max
// Moisture post-watering: suppress high-moisture alerts, only alert below min

function getMetricStatus(metric, value, care, recentlyWatered) {
    if (value == null || !care) return { status: 'unknown', label: '—' };

    const { min, max } = care;
    const range  = max - min;
    const buffer = range * 0.15;

    if (metric === 'moisture' && recentlyWatered) {
        if (value < min)          return { status: 'bad',  label: 'Time to water' };
        if (value < min + buffer) return { status: 'warn', label: 'Water soon' };
        return                           { status: 'good', label: 'Recently watered' };
    }

    // Suppress light alerts in evening/night (19:00–05:59) — low light is expected
    if (metric === 'light') {
        const h = new Date().getHours();
        if (h >= 19 || h < 6) return { status: 'good', label: 'Evening — light normal' };
    }

    if (value < min) {
        switch (metric) {
            case 'humidity':    return { status: 'bad', label: 'Recommend misting' };
            case 'light':       return { status: 'bad', label: 'Needs more light' };
            case 'moisture':    return { status: 'bad', label: 'Time to water' };
            case 'temperature': return { status: 'bad', label: 'Too cold' };
            default:            return { status: 'bad', label: 'Too low' };
        }
    }
    if (value > max) {
        switch (metric) {
            case 'humidity':    return { status: 'bad', label: 'Improve air circulation' };
            case 'light':       return { status: 'bad', label: 'Too much direct light' };
            case 'moisture':    return { status: 'bad', label: 'Let soil dry out' };
            case 'temperature': return { status: 'bad', label: 'Move somewhere cooler' };
            default:            return { status: 'bad', label: 'Too high' };
        }
    }

    if (value < min + buffer) {
        switch (metric) {
            case 'humidity':    return { status: 'warn', label: 'Consider misting' };
            case 'light':       return { status: 'warn', label: 'Could use more light' };
            case 'moisture':    return { status: 'warn', label: 'Water soon' };
            case 'temperature': return { status: 'warn', label: 'Getting cool' };
            default:            return { status: 'warn', label: 'Getting low' };
        }
    }
    if (value > max - buffer) {
        switch (metric) {
            case 'humidity':    return { status: 'warn', label: 'Slightly humid' };
            case 'light':       return { status: 'warn', label: 'Reduce light exposure' };
            case 'moisture':    return { status: 'warn', label: 'Slightly wet' };
            case 'temperature': return { status: 'warn', label: 'Getting warm' };
            default:            return { status: 'warn', label: 'Getting high' };
        }
    }

    return { status: 'good', label: 'Good' };
}

const STATUS_COLOR = { good: '#def39b', warn: '#f9c74f', bad: '#e76f51', unknown: '#555' };
const STATUS_ICON  = { good: 'fa-circle-check', warn: 'fa-triangle-exclamation', bad: 'fa-circle-xmark', unknown: 'fa-circle-question' };

// ── Primary alert — most critical specific issue ──────────────────────────────

function getPrimaryAlert(readings, plant, tempUnit, recentlyWatered) {
    if (!readings || !plant) return null;

    const tempCare = tempUnit === 'F' ? plant.care?.temperature_f : plant.care?.temperature_c;
    const tempC    = readings.temperature;
    const tempVal  = (tempC != null && tempUnit === 'F') ? (tempC * 9 / 5) + 32 : tempC;

    const checks = [
        getMetricStatus('temperature', tempVal,           tempCare,                    false),
        getMetricStatus('humidity',    readings.humidity, plant.care?.humidity,         false),
        getMetricStatus('moisture',    readings.moisture, plant.care?.moisture,  recentlyWatered),
        getMetricStatus('light',       readings.light,    plant.care?.light,            false),
    ];

    // Return worst-case first (bad > warn)
    const bad  = checks.find(c => c.status === 'bad');
    if (bad)  return { ...bad,  severity: 'bad' };
    const warn = checks.find(c => c.status === 'warn');
    if (warn) return { ...warn, severity: 'warn' };
    return null;
}

// ── Metric card HTML ──────────────────────────────────────────────────────────

function metricCardHTML(metric, label, displayValue, unit, icon, care, rawValue, recentlyWatered) {
    const { status } = getMetricStatus(metric, rawValue, care, recentlyWatered);
    const color     = STATUS_COLOR[status];
    const rangeText = care ? `${care.min}–${care.max}${unit}` : null;

    return `
        <div class="metric-card">
            <div class="metric-header-row">
                <div class="metric-top">
                    <i class="fa-solid ${icon} metric-icon"></i>
                    <span class="metric-label">${label}</span>
                </div>
                <i class="fa-solid ${STATUS_ICON[status]} metric-status-icon" style="color:${color};"></i>
            </div>
            <div class="metric-value">${displayValue}</div>
            ${rangeText ? `<div class="metric-range"><span class="metric-range-label">TARGET</span><span class="metric-range-values">${rangeText}</span></div>` : ''}
        </div>
    `;
}

function temperatureCardHTML(tempVal, tempUnit, care) {
    const { status } = getMetricStatus('temperature', tempVal, care, false);
    const color      = STATUS_COLOR[status];
    const display    = tempVal != null ? `${Math.round(tempVal)}°` : '—';
    const rangeText  = care ? `${care.min}–${care.max}°${tempUnit}` : null;

    const scaleMin = tempUnit === 'F' ? 32  : 0;
    const scaleMax = tempUnit === 'F' ? 104 : 40;
    const pct = tempVal != null
        ? Math.min(100, Math.max(0, ((tempVal - scaleMin) / (scaleMax - scaleMin)) * 100))
        : 50;
    // center text within the filled portion, clamped so it never clips the edges
    const textTop = Math.min(82, Math.max(18, 100 - pct / 2)).toFixed(1);

    return `
        <div class="metric-card metric-card--temperature">
            <div class="metric-header-row">
                <span class="metric-label">Temperature</span>
                <i class="fa-solid ${STATUS_ICON[status]} metric-status-icon" style="color:${color};"></i>
            </div>
            <div class="thermo-wrap" style="--fill: ${pct.toFixed(1)}%">
                <div class="thermo-outer">
                    <div class="thermo-inner">
                        <div class="thermo-fill"></div>
                        <div class="thermo-text-layer thermo-text-layer--above"><span class="thermo-pct" style="top:${textTop}%">${display}</span></div>
                        <div class="thermo-text-layer thermo-text-layer--below" style="clip-path: inset(calc(100% - ${pct.toFixed(1)}%) 0 0 0)"><span class="thermo-pct" style="top:${textTop}%">${display}</span></div>
                    </div>
                </div>
            </div>
            ${rangeText ? `<div class="metric-range"><span class="metric-range-label">TARGET</span><span class="metric-range-values">${rangeText}</span></div>` : ''}
        </div>
    `;
}

function humidityCardHTML(humidity, care) {
    const { status } = getMetricStatus('humidity', humidity, care, false);
    const color     = STATUS_COLOR[status];
    const pct       = humidity != null ? Math.min(100, Math.max(0, humidity)) : 0;
    const display   = humidity != null ? `${Math.round(humidity)}%` : '—';
    const rangeText = care ? `${care.min}–${care.max}%` : null;

    const cx = 70, cy = 70;
    const Rc = 46;         // inner solid circle radius
    const Ro = 60, swo = 12; // outer progress ring

    // Layers: track (dim full ring) → inner circle (covers centre + creates gap) → fill arc (on top)
    const track       = `<circle cx="${cx}" cy="${cy}" r="${Ro}" fill="none" stroke="rgba(168,224,99,0.18)" stroke-width="${swo}"/>`;
    const innerCircle = `<circle cx="${cx}" cy="${cy}" r="${Rc}" fill="#a8e063"/>`;

    // CCW fill using stroke-dashoffset on a full circle.
    // CSS rotates -90° (start at 12 o'clock) + scaleX(-1) (flip CW→CCW).
    // stroke-dasharray = full circumference; dashoffset drives how much is visible.
    const C       = 2 * Math.PI * Ro;
    const dashOff = (C * (1 - pct / 100)).toFixed(2);
    const fillArc = `<circle class="hum-fill-arc" cx="${cx}" cy="${cy}" r="${Ro}" fill="none" stroke="#a8e063" stroke-width="${swo}" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" style="stroke-dashoffset:${dashOff}"/>`;

    return `
        <div class="metric-card metric-card--humidity">
            <div class="metric-header-row">
                <span class="metric-label">Humidity</span>
                <i class="fa-solid ${STATUS_ICON[status]} metric-status-icon" style="color:${color};"></i>
            </div>
            <div class="hum-gauge-wrap">
                <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" class="hum-svg">${track}${innerCircle}${fillArc}</svg>
                <div class="hum-pct-overlay"><span class="hum-pct-text">${display}</span></div>
            </div>
            ${rangeText ? `<div class="metric-range" style="text-align:center;"><span class="metric-range-label">TARGET</span><span class="metric-range-values">${rangeText}</span></div>` : ''}
        </div>
    `;
}

function lightCardHTML(light, care) {
    const { status } = getMetricStatus('light', light, care, false);
    const color      = STATUS_COLOR[status];
    const pct        = light != null ? Math.min(100, Math.max(0, light)) : 0;
    const display    = light != null ? `${Math.round(light)}%` : '—';
    const rangeText  = care ? `${care.min}–${care.max}%` : null;

    const hour    = new Date().getHours();
    const isNight = hour < 6 || hour >= 19;

    const cx = 70, cy = 70;
    const R_bg   = 48;
    const R_ring = 62;
    const sw_ring = 4;

    const circ = 2 * Math.PI * R_ring;
    const N    = 24;
    const dot  = 4;
    const gap  = (circ - N * dot) / N;

    const bgCircle = `<circle cx="${cx}" cy="${cy}" r="${R_bg}" fill="#0a1a10"/>`;
    const dotsRing = `<circle cx="${cx}" cy="${cy}" r="${R_ring}" fill="none" stroke="#a8e063" stroke-width="${sw_ring}" stroke-dasharray="${dot.toFixed(1)} ${gap.toFixed(1)}" stroke-linecap="round"/>`;

    let svgContent, overlay;

    if (isNight) {
        svgContent = `${bgCircle}${dotsRing}`;
        overlay    = `<div class="light-pct-overlay"><i class="fa-solid fa-moon light-moon-icon"></i></div>`;
    } else {
        const minInnerR  = 25;
        const innerR     = Math.max(minInnerR, (pct / 100) * R_bg);
        // Always render fill circle so the patcher always finds it
        const fillCircle = `<circle class="light-fill-circle" cx="${cx}" cy="${cy}" r="${innerR.toFixed(1)}" fill="rgba(168,224,99,0.85)"/>`;
        svgContent = `${bgCircle}${fillCircle}${dotsRing}`;
        // Two text layers: green (visible on dark bg) + dark (clipped to fill circle)
        overlay = `
            <div class="light-pct-overlay">
                <span class="light-pct-text light-pct-text--above">${display}</span>
                <span class="light-pct-text light-pct-text--below" style="clip-path:circle(${innerR.toFixed(1)}px at 50% 50%)">${display}</span>
            </div>`;
    }

    return `
        <div class="metric-card metric-card--light">
            <div class="metric-header-row">
                <span class="metric-label">Light</span>
                <i class="fa-solid ${STATUS_ICON[status]} metric-status-icon" style="color:${color};"></i>
            </div>
            <div class="light-sun-wrap">
                <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" class="light-sun-svg">${svgContent}</svg>
                ${overlay}
            </div>
            ${rangeText ? `<div class="metric-range" style="text-align:center;"><span class="metric-range-label">TARGET</span><span class="metric-range-values">${rangeText}</span></div>` : ''}
        </div>
    `;
}

function moistureCardHTML(moisture, care, recentlyWatered) {
    const { status } = getMetricStatus('moisture', moisture, care, recentlyWatered);
    const color      = STATUS_COLOR[status];
    const pct        = moisture != null ? Math.min(100, Math.max(0, moisture)) : 50;
    const rangeText  = care ? `${care.min}–${care.max}%` : null;
    const display    = moisture != null ? `${moisture}%` : '—';
    // center text within the filled portion, clamped so it never clips the edges
    const textTop    = Math.min(82, Math.max(18, 100 - pct / 2)).toFixed(1);

    return `
        <div class="metric-card metric-card--moisture">
            <div class="metric-header-row">
                <span class="metric-label">Moisture</span>
                <div class="mc-header-right">
                    ${recentlyWatered ? '<span class="mc-watered-tag">Recently Watered</span>' : ''}
                    <i class="fa-solid ${STATUS_ICON[status]} metric-status-icon" style="color:${color};"></i>
                </div>
            </div>
            <div class="mc-wrap">
                <div class="mc-outer-ring"></div>
                <div class="mc-inner" style="--fill: ${pct}%">
                    <div class="mc-water"></div>
                    <div class="mc-text-layer mc-text-layer--above"><span class="mc-pct" style="top:${textTop}%">${display}</span></div>
                    <div class="mc-text-layer mc-text-layer--below" style="clip-path: inset(calc(100% - ${pct}%) 0 0 0)"><span class="mc-pct" style="top:${textTop}%">${display}</span></div>
                </div>
            </div>
            ${rangeText ? `<div class="metric-range" style="text-align:center;"><span class="metric-range-label">TARGET</span><span class="metric-range-values">${rangeText}</span></div>` : ''}
        </div>
    `;
}

// ── Recently watered helpers ──────────────────────────────────────────────────

const WATERED_KEY        = 'pot_watered_at';
const WATERED_GRACE_DAYS = 14;
const WATER_DETECT_DELTA = 20; // moisture must increase by this many points to count as watering

function getWateredAt() {
    const raw = localStorage.getItem(WATERED_KEY);
    return raw ? Number(raw) : null;
}

function setWateredNow() {
    localStorage.setItem(WATERED_KEY, String(Date.now()));
}

function isRecentlyWatered() {
    const ts = getWateredAt();
    if (!ts) return false;
    return (Date.now() - ts) / (1000 * 60 * 60 * 24) < WATERED_GRACE_DAYS;
}

function wateredTag() {
    const ts = getWateredAt();
    if (!ts) return '';
    const date      = new Date(ts);
    const daysSince = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    const dateStr   = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const when      = daysSince === 0 ? 'today' : daysSince === 1 ? 'yesterday' : `${dateStr}`;
    return `<span class="recently-watered-tag"><i class="fa-solid fa-droplet"></i> Watered ${when}</span>`;
}

// ── Moisture trend from history ───────────────────────────────────────────────

function getMoistureTrend(historyData) {
    if (!historyData) return null;
    const vals = Object.entries(historyData)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-5)
        .map(([, r]) => r.moisture)
        .filter(v => v != null);
    if (vals.length < 3) return null;
    let declining = 0;
    for (let i = 1; i < vals.length; i++) {
        if (vals[i] < vals[i - 1]) declining++;
    }
    return declining >= vals.length - 2 ? 'declining' : null;
}

// ── Render ────────────────────────────────────────────────────────────────────

export function renderPotDashboard(container, profile) {
    cleanupPotDashboard();

    const tempUnit = profile?.temperatureUnit || 'C';

    container.innerHTML = `
        <div class="pot-dashboard-wrapper">
            <header class="pot-header">
                <h1 style="margin:0;">My Pot</h1>
                <div id="pot-connection-status" class="pot-connection-status"></div>
            </header>

            <div id="pot-plant-selector" style="margin-bottom: 20px;"></div>
            <div id="pot-metrics"        class="pot-metrics-grid"></div>
            <div id="pot-plant-info"     style="margin-top: 20px;"></div>
            <div id="pot-actions"        style="margin-top: 20px;"></div>
        </div>
    `;

    const selectorEl   = document.getElementById('pot-plant-selector');
    const metricsEl    = document.getElementById('pot-metrics');
    const infoEl       = document.getElementById('pot-plant-info');
    const actionsEl    = document.getElementById('pot-actions');
    const connectionEl = document.getElementById('pot-connection-status');

    let readings      = null;
    let historyData   = null;
    let allPlants     = {};
    let selectedId    = null;
    let currentPlant  = null;
    let showSelector  = false;
    let alertDismissed = false;
    let lastAlertKey   = null;   // resets dismiss when alert type changes
    let prevMoisture   = null;   // for auto-detecting watering

    // ── Connection status ─────────────────────────────────────────────────────
    function renderConnectionStatus(isLive) {
        connectionEl.innerHTML = isLive
            ? `<span class="conn-dot conn-live"></span><span class="conn-label">Live</span>`
            : `<span class="conn-dot conn-offline"></span><span class="conn-label">Sensor offline</span>`;
    }

    function resetStalenessTimer() {
        renderConnectionStatus(true);
        clearTimeout(stalenessTimer);
        stalenessTimer = setTimeout(() => renderConnectionStatus(false), 2 * 60 * 1000);
    }

    // ── Temperature helpers ───────────────────────────────────────────────────
    function toDisplayTemp(tempC) {
        if (tempC == null) return null;
        return tempUnit === 'F' ? (tempC * 9 / 5) + 32 : tempC;
    }

    // ── Combined plant card (selector + health alert) ─────────────────────────
    function renderSelector() {
        if (!Object.keys(allPlants).length) { selectorEl.innerHTML = ''; return; }

        if (selectedId && !showSelector) {
            const alert      = getPrimaryAlert(readings, currentPlant, tempUnit, isRecentlyWatered());
            const alertKey   = alert ? `${alert.severity}-${alert.label}` : null;

            // Reset dismiss when alert type changes
            if (alertKey !== lastAlertKey) {
                alertDismissed = false;
                lastAlertKey   = alertKey;
            }

            const showAlert  = alert && !alertDismissed;
            const borderColor = showAlert ? STATUS_COLOR[alert.severity] : 'transparent';

            // Moisture-declining nudge from history
            const trend = getMoistureTrend(historyData);
            const showTrendNudge = !isRecentlyWatered()
                && trend === 'declining'
                && currentPlant?.care?.moisture
                && readings?.moisture != null
                && readings.moisture < currentPlant.care.moisture.min * 1.5;

            const potAvatarImg = localStorage.getItem('pot_avatar_img') || '';
            const avatarInner  = potAvatarImg
                ? ''
                : logoSVG('pot-avatar-logo');

            selectorEl.innerHTML = `
                <div class="pot-selector-card pot-selector-card--plant" style="border-color: ${borderColor};">
                    <div class="pot-avatar-wrap" id="pot-avatar-wrap" title="Tap to change image">
                        <input type="file" id="pot-avatar-input" accept="image/*" style="display:none">
                        <div class="pot-avatar-circle" ${potAvatarImg ? `style="background-image:url('${potAvatarImg}')"` : ''}>
                            ${avatarInner}
                        </div>
                        <div class="pot-avatar-edit"><i class="fa-solid fa-pen"></i></div>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <p class="selector-label">Plant in pot</p>
                        <p class="pot-plant-name">${currentPlant?.name || selectedId}</p>
                        ${wateredTag()}
                        ${showTrendNudge ? `
                            <p class="pot-trend-nudge">
                                <i class="fa-solid fa-arrow-trend-down"></i> Moisture declining — water soon
                            </p>` : ''}
                        ${showAlert ? `
                            <div class="pot-alert-row">
                                <i class="fa-solid ${STATUS_ICON[alert.severity]}" style="color:${STATUS_COLOR[alert.severity]};"></i>
                                <span style="color:${STATUS_COLOR[alert.severity]}; flex:1;">${alert.label}</span>
                                <button id="btn-dismiss-alert" class="alert-dismiss-btn">Dismiss</button>
                            </div>` : ''}
                    </div>
                </div>
            `;

            document.getElementById('pot-avatar-wrap').addEventListener('click', () => {
                document.getElementById('pot-avatar-input').click();
            });
            document.getElementById('pot-avatar-input').addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    localStorage.setItem('pot_avatar_img', ev.target.result);
                    renderSelector();
                };
                reader.readAsDataURL(file);
            });

            if (showAlert) {
                document.getElementById('btn-dismiss-alert').addEventListener('click', () => {
                    alertDismissed = true;
                    renderSelector();
                });
            }

        } else {
            // No plant set or user is changing plant — show custom dropdown
            const CARE_COLOR = { easy: '#def39b', medium: '#f9c74f', hard: '#e76f51' };
            const items = Object.entries(allPlants).map(([id, p]) => {
                const level     = p.care_level || '';
                const badgeHTML = level
                    ? `<span class="ppd-care-badge" style="background:${CARE_COLOR[level] || '#555'}">${level}</span>`
                    : '';
                const imgStyle  = p.profilePicURL
                    ? `background-image:url('${p.profilePicURL}'); background-size:cover; background-position:center;`
                    : '';
                const initials  = p.name ? p.name[0].toUpperCase() : '?';
                return `
                    <div class="ppd-item ${id === selectedId ? 'ppd-item--selected' : ''}" data-id="${id}">
                        <div class="ppd-circle" style="${imgStyle}">${!p.profilePicURL ? initials : ''}</div>
                        <div class="ppd-text">
                            <span class="ppd-name">${p.name}</span>
                            <span class="ppd-sci">${p.scientific_name || ''}</span>
                        </div>
                        ${badgeHTML}
                    </div>`;
            }).join('');

            selectorEl.innerHTML = `
                <div class="pot-selector-card pot-selector-card--select">
                    <p class="selector-label" style="margin-bottom:10px;">Select plant</p>
                    <div class="pot-plant-dropdown" id="pot-plant-dropdown">${items}</div>
                </div>
            `;

            selectorEl.querySelectorAll('.ppd-item').forEach(item => {
                item.addEventListener('click', async () => {
                    selectedId   = item.dataset.id;
                    currentPlant = allPlants[selectedId] || null;
                    showSelector = false;
                    metricsEl.innerHTML = ''; // force full rebuild for new plant's care ranges
                    await set(ref(rtdb, '/pot/selected_plant'), selectedId);
                    renderSelector();
                    renderActions();
                    renderMetrics();
                    renderPlantInfo();
                });
            });
        }
    }

    // ── In-place patch functions (keep DOM alive for CSS transitions) ─────────

    function patchMoistureCard(moisture, care, recently) {
        const pct     = moisture != null ? Math.min(100, Math.max(0, moisture)) : 50;
        const display = moisture != null ? `${moisture}%` : '—';
        const textTop = Math.min(82, Math.max(18, 100 - pct / 2)).toFixed(1);
        const { status } = getMetricStatus('moisture', moisture, care, recently);

        const inner = metricsEl.querySelector('.mc-inner');
        if (!inner) return;
        inner.style.setProperty('--fill', `${pct}%`);
        inner.querySelectorAll('.mc-pct').forEach(s => { s.textContent = display; s.style.top = `${textTop}%`; });
        const below = inner.querySelector('.mc-text-layer--below');
        if (below) below.style.clipPath = `inset(calc(100% - ${pct}%) 0 0 0)`;
        const icon = metricsEl.querySelector('.metric-card--moisture .metric-status-icon');
        if (icon) { icon.className = `fa-solid ${STATUS_ICON[status]} metric-status-icon`; icon.style.color = STATUS_COLOR[status]; }
    }

    function patchTemperatureCard(tempVal, care) {
        const scaleMin = tempUnit === 'F' ? 32 : 0;
        const scaleMax = tempUnit === 'F' ? 104 : 40;
        const pct     = tempVal != null
            ? Math.min(100, Math.max(0, ((tempVal - scaleMin) / (scaleMax - scaleMin)) * 100))
            : 50;
        const display = tempVal != null ? `${Math.round(tempVal)}°` : '—';
        const textTop = Math.min(82, Math.max(18, 100 - pct / 2)).toFixed(1);
        const { status } = getMetricStatus('temperature', tempVal, care, false);

        const wrap = metricsEl.querySelector('.thermo-wrap');
        if (!wrap) return;
        wrap.style.setProperty('--fill', `${pct.toFixed(1)}%`);
        wrap.querySelectorAll('.thermo-pct').forEach(s => { s.textContent = display; s.style.top = `${textTop}%`; });
        const below = wrap.querySelector('.thermo-text-layer--below');
        if (below) below.style.clipPath = `inset(calc(100% - ${pct.toFixed(1)}%) 0 0 0)`;
        const icon = metricsEl.querySelector('.metric-card--temperature .metric-status-icon');
        if (icon) { icon.className = `fa-solid ${STATUS_ICON[status]} metric-status-icon`; icon.style.color = STATUS_COLOR[status]; }
    }

    function patchHumidityCard(humidity, care) {
        const pct     = humidity != null ? Math.min(100, Math.max(0, humidity)) : 0;
        const display = humidity != null ? `${Math.round(humidity)}%` : '—';
        const { status } = getMetricStatus('humidity', humidity, care, false);
        const Ro = 60;
        const C  = 2 * Math.PI * Ro;

        const arc = metricsEl.querySelector('.hum-fill-arc');
        if (arc) arc.style.strokeDashoffset = `${(C * (1 - pct / 100)).toFixed(2)}`;
        const text = metricsEl.querySelector('.hum-pct-text');
        if (text) text.textContent = display;
        const icon = metricsEl.querySelector('.metric-card--humidity .metric-status-icon');
        if (icon) { icon.className = `fa-solid ${STATUS_ICON[status]} metric-status-icon`; icon.style.color = STATUS_COLOR[status]; }
    }

    function patchLightCard(light, care) {
        const pct     = light != null ? Math.min(100, Math.max(0, light)) : 0;
        const display = light != null ? `${Math.round(light)}%` : '—';
        const { status } = getMetricStatus('light', light, care, false);
        const innerR  = Math.max(25, (pct / 100) * 48).toFixed(1);

        const circle = metricsEl.querySelector('.light-fill-circle');
        if (circle) circle.setAttribute('r', innerR);
        const above = metricsEl.querySelector('.light-pct-text--above');
        const below = metricsEl.querySelector('.light-pct-text--below');
        if (above) above.textContent = display;
        if (below) { below.textContent = display; below.style.clipPath = `circle(${innerR}px at 50% 50%)`; }
        const icon = metricsEl.querySelector('.metric-card--light .metric-status-icon');
        if (icon) { icon.className = `fa-solid ${STATUS_ICON[status]} metric-status-icon`; icon.style.color = STATUS_COLOR[status]; }
    }

    // ── Metrics ───────────────────────────────────────────────────────────────
    function renderMetrics() {
        if (!readings) {
            metricsEl.innerHTML = `<p class="loading-text">Waiting for sensor data…</p>`;
            return;
        }

        const recently = isRecentlyWatered();
        const tempVal  = toDisplayTemp(readings.temperature);
        const tempCare = currentPlant && (tempUnit === 'F' ? currentPlant.care?.temperature_f : currentPlant.care?.temperature_c);

        // Patch in place when cards already exist — preserves DOM so CSS transitions run
        if (metricsEl.querySelector('.metric-card--moisture')) {
            patchMoistureCard(readings.moisture, currentPlant?.care?.moisture, recently);
            patchTemperatureCard(tempVal, tempCare);
            patchHumidityCard(readings.humidity, currentPlant?.care?.humidity);
            patchLightCard(readings.light, currentPlant?.care?.light);
            return;
        }

        // First render or after plant change — build full HTML
        metricsEl.innerHTML = [
            moistureCardHTML(readings.moisture, currentPlant?.care?.moisture, recently),
            temperatureCardHTML(tempVal, tempUnit, tempCare),
            humidityCardHTML(readings.humidity, currentPlant?.care?.humidity),
            lightCardHTML(readings.light, currentPlant?.care?.light),
        ].join('');
    }

    // ── Plant info card ───────────────────────────────────────────────────────
    function renderPlantInfo() {
        if (!currentPlant) { infoEl.innerHTML = ''; return; }
        const moistureNote = currentPlant.care?.moisture?.notes || '';
        const humidNote    = currentPlant.care?.humidity?.notes || '';
        infoEl.innerHTML = `
            <div class="pot-info-card">
                <h3 style="margin:0 0 2px 0;">${currentPlant.name}</h3>
                <p style="margin:0 0 12px 0; font-size:0.8em; opacity:0.45; font-style:italic;">${currentPlant.scientific_name}</p>
                <div class="care-note">
                    <span class="care-note-icon"><i class="fa-solid fa-circle-info"></i></span>
                    <span>${currentPlant.description}</span>
                </div>
                ${moistureNote ? `
                <div class="care-note">
                    <span class="care-note-icon"><i class="fa-solid fa-droplet"></i></span>
                    <span>${moistureNote}</span>
                </div>` : ''}
                ${humidNote ? `
                <div class="care-note">
                    <span class="care-note-icon"><i class="fa-solid fa-wind"></i></span>
                    <span>${humidNote}</span>
                </div>` : ''}
            </div>
        `;
    }

    // ── Bottom action buttons ─────────────────────────────────────────────────
    function renderActions() {
        if (!selectedId) { actionsEl.innerHTML = ''; return; }
        actionsEl.innerHTML = `
            <div class="pot-actions-row">
                <button id="btn-change-plant" class="pot-action-btn">
                    <i class="fa-solid fa-arrow-right-arrow-left"></i> Change plant
                </button>
                <button id="btn-remove-plant" class="pot-action-btn pot-action-btn--danger">
                    <i class="fa-solid fa-trash"></i> Remove plant
                </button>
            </div>
        `;
        document.getElementById('btn-change-plant').addEventListener('click', () => {
            showSelector = true;
            renderSelector();
            selectorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        document.getElementById('btn-remove-plant').addEventListener('click', async () => {
            selectedId   = null;
            currentPlant = null;
            showSelector = false;
            await set(ref(rtdb, '/pot/selected_plant'), null);
            renderSelector();
            renderActions();
            renderMetrics();
            renderPlantInfo();
        });
    }

    // ── Fetch plant profiles, then subscribe ──────────────────────────────────
    get(ref(rtdb, '/plants')).then(snap => {
        if (snap.exists()) allPlants = snap.val();

        unsubscribePot = onValue(ref(rtdb, '/pot/selected_plant'), snap => {
            const val   = snap.val();
            const newId = val || null;
            if (newId !== selectedId) metricsEl.innerHTML = ''; // force full rebuild on plant change
            selectedId   = newId;
            currentPlant = selectedId ? (allPlants[selectedId] || null) : null;
            showSelector = !selectedId;
            renderSelector();
            renderActions();
            renderMetrics();
            renderPlantInfo();
        });
    });

    // ── Subscribe to live readings ────────────────────────────────────────────
    unsubscribeReadings = onValue(ref(rtdb, '/plant'), snap => {
        if (!snap.exists()) { readings = null; historyData = null; renderSelector(); renderMetrics(); return; }
        const val     = snap.val();
        const newMoisture = val.moisture ?? null;

        // Auto-detect watering: moisture spiked up by WATER_DETECT_DELTA or more
        if (prevMoisture !== null && newMoisture !== null && (newMoisture - prevMoisture) >= WATER_DETECT_DELTA) {
            setWateredNow();
        }
        prevMoisture = newMoisture;

        readings    = { temperature: val.temperature, humidity: val.humidity, moisture: val.moisture, light: val.light };
        historyData = val.history || null;

        resetStalenessTimer();
        renderSelector();
        renderMetrics();
    });
}

export function cleanupPotDashboard() {
    if (unsubscribeReadings) { unsubscribeReadings(); unsubscribeReadings = null; }
    if (unsubscribePot)      { unsubscribePot();      unsubscribePot = null;      }
    if (stalenessTimer)      { clearTimeout(stalenessTimer); stalenessTimer = null; }
}
