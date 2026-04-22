// src/weatherService.js
// Uses Open-Meteo (weather) and Nominatim (forward + reverse geocoding).
// No API key required.

const NOMINATIM_SEARCH  = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const WEATHER_URL       = 'https://api.open-meteo.com/v1/forecast';

// Shared headers for Nominatim (required by their usage policy)
const NOM_HEADERS = { 'Accept-Language': 'en', 'User-Agent': 'PlantPalApp/1.0' };

// WMO weather interpretation codes → human-readable text
function wmoCondition(code) {
    if (code === 0)             return 'Clear sky';
    if (code <= 2)              return 'Partly cloudy';
    if (code === 3)             return 'Overcast';
    if (code <= 49)             return 'Foggy';
    if (code <= 67)             return 'Rainy';
    if (code <= 77)             return 'Snowy';
    if (code <= 82)             return 'Showers';
    if (code <= 99)             return 'Thunderstorm';
    return 'Unknown';
}

async function fetchWeatherByCoords(lat, lon, unit = 'C') {
    const tempUnit = unit === 'F' ? 'fahrenheit' : 'celsius';
    const url = `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&temperature_unit=${tempUnit}&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather request failed: ${res.statusText}`);
    return res.json();
}

/**
 * Fetches weather for a location string (city name, zip code, or "lat,lon").
 * Returns { city, region, country, tempC, tempF, conditionCode, conditionText, isDay }
 */
export async function fetchWeather(locationQuery, unit = 'C') {
    if (!locationQuery) throw new Error('Location not defined.');

    const coordMatch = String(locationQuery).match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    let lat, lon, city, region, country;

    if (coordMatch) {
        // Coordinates from GPS — reverse geocode with Nominatim
        lat = parseFloat(coordMatch[1]);
        lon = parseFloat(coordMatch[2]);

        try {
            const res = await fetch(
                `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lon}&format=json`,
                { headers: NOM_HEADERS }
            );
            if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                city    = addr.city || addr.town || addr.village || addr.county || 'Unknown';
                region  = addr.state || addr.region || '';
                country = addr.country || '';
            } else {
                city = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
                region = ''; country = '';
            }
        } catch {
            city = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
            region = ''; country = '';
        }
    } else {
        // Forward geocode — Nominatim handles city names, "City, Region", zip codes, etc.
        const res = await fetch(
            `${NOMINATIM_SEARCH}?q=${encodeURIComponent(locationQuery)}&format=json&limit=1&addressdetails=1`,
            { headers: NOM_HEADERS }
        );
        if (!res.ok) throw new Error('Geocoding request failed.');
        const results = await res.json();
        const place   = results[0];
        if (!place) throw new Error('Location not found. Check spelling.');
        lat     = parseFloat(place.lat);
        lon     = parseFloat(place.lon);
        const addr = place.address || {};
        city    = addr.city || addr.town || addr.village || addr.county || place.display_name.split(',')[0];
        region  = addr.state || addr.region || '';
        country = addr.country || '';
    }

    const weatherData = await fetchWeatherByCoords(lat, lon, unit);
    const cur = weatherData.current;

    // Open-Meteo uses weather_code (newer) or weathercode (older)
    const weatherCode = cur.weather_code ?? cur.weathercode ?? 0;

    // cur.temperature_2m is already in the requested unit
    const tempC = unit === 'F' ? (cur.temperature_2m - 32) * 5 / 9 : cur.temperature_2m;
    const tempF = unit === 'F' ? cur.temperature_2m : cur.temperature_2m * 9 / 5 + 32;

    return {
        city,
        region,
        country,
        tempC:         Math.round(tempC * 10) / 10,
        tempF:         Math.round(tempF * 10) / 10,
        conditionCode: weatherCode,
        conditionText: wmoCondition(weatherCode),
        isDay:         cur.is_day === 1,
    };
}

/**
 * Returns the user's current GPS coordinates via the browser Geolocation API.
 */
export function getCurrentBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocation not supported by this browser.'));
        }
        navigator.geolocation.getCurrentPosition(
            pos  => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            err  => reject(new Error(`Geolocation error: ${err.message}`)),
            { timeout: 10000, maximumAge: 60000 }
        );
    });
}
