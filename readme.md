# PlantPal

PlantPal is a mobile-first plant care companion that helps you discover, track, and maintain your indoor plants. A guided onboarding experience, a daily care dashboard, and a personal photo journal keep your plants thriving.

**Live App:** https://fir-setup-f2b47.web.app/

---

## Features

### Onboarding & Auth
- Swipe-through onboarding slides introducing app features before sign-up
- Email/password and Google sign-in
- New accounts are routed through a profile setup screen (display name, profile photo, location, temperature unit) before entering the app
- Password reset via email

### Home Dashboard
A widget grid on the home screen gives you everything at a glance:

- **Photo Carousel** — cycles through your personal plant gallery photos with fade transitions and dot indicators. Tapping `+` adds a new plant. On mobile the carousel spans the full width at the top.
- **Weather Widget** — real-time local weather (temperature, condition, city) using Open-Meteo with browser-based reverse geolocation. Set your location from your profile.
- **Plant Care Tips** — a rotating tip from a curated list of houseplant care advice.
- **Today's Tasks** — auto-generated care reminders: watering (based on per-plant intervals), fertilizing (every 42 days), and journal update prompts (every 30 days). Tasks are shown under labeled pills and dismissed with a single tap.

### Plant Search & Discovery
Browse and search a curated catalog of houseplants sourced from Firebase Realtime Database. Each plant page includes care level, light requirements, watering frequency, toxicity info, and detailed care notes.

### Plant Matchmaker Quiz
Answer questions about your space and lifestyle — PlantPal recommends the best-matched plants based on your light conditions and care availability.

### My Plants
A visual gallery of all your saved plants with custom nicknames, profile photos, and individual detail pages showing care stats, last watered/fertilized dates, and care level tags.

### Plant Journal
Log monthly progress updates with a photo, written notes, and a health rating (1–5). Photos are stored to your personal gallery and appear in the home carousel.

### Care Actions
Water, fertilize, and journal directly from task cards on the home screen or from a plant's detail page — all synced to your Firebase account in real time.

### Profile & Settings
- Profile menu lives in the bottom navigation bar and opens upward
- Edit display name, profile photo, temperature unit (°C / °F), and location
- Sign out from the profile panel

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), [Vite](https://vitejs.dev/)
- **Styling:** SCSS
- **Backend:** [Firebase](https://firebase.google.com/) — Auth, Firestore, Realtime Database, Hosting
- **APIs:**
  - [Open-Meteo](https://open-meteo.com/) (weather data)
  - Firebase Realtime Database (plant catalog)

---

## Running Locally

```bash
npm install
npm run dev
```
