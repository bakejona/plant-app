# PlantPal

PlantPal is a mobile-first plant care companion that helps you discover, track, and maintain your indoor plants. A guided onboarding experience, a daily care dashboard, and a personal photo journal keep your plants thriving.

**Live App:** https://fir-setup-f2b47.web.app/

> **Install as an app:** On iPhone open the link in Safari → Share → Add to Home Screen. On Android open in Chrome → browser menu → Add to Home Screen.

---

## Features

### Onboarding & Auth
- Swipe-through onboarding slides introducing app features before sign-up
- Email/password and Google sign-in
- New accounts are routed through a profile setup screen (display name, profile photo, location, temperature unit) before entering the app
- Password reset via email

### Home Dashboard
A widget grid on the home screen gives you everything at a glance:

- **Photo Carousel** — cycles through your personal plant gallery photos with fade transitions and dot indicators. Tap `+` inside the carousel to add a new plant. On mobile the carousel spans the full width at the top; weather and tips sit side by side below.
- **Weather Widget** — real-time local weather (temperature, condition, city) using Open-Meteo with browser-based reverse geolocation. Set your location from your profile.
- **Plant Care Tips** — a rotating tip from a curated list of houseplant care advice.
- **Today's Tasks** — auto-generated care reminders: watering (based on per-plant intervals), fertilizing (every 42 days), and journal update prompts (every 30 days). Tasks are grouped under light-green pill headers and dismissed with a single tap.

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

### Push Notifications
- **On-app-open reminder** — checks for overdue watering and fertilizing tasks once per day and shows a local notification
- **Background push** — Firebase Cloud Messaging delivers reminders even when the app is closed (requires notification permission)
- Pot sensor alerts are never sent as push notifications

### Profile & Settings
- Profile menu lives in the bottom navigation bar and opens upward
- Edit display name, profile photo, temperature unit (°C / °F), and location
- Sign out from the profile panel

### PWA / Installable
- Full Progressive Web App with a `manifest.webmanifest`
- Custom PlantPal home screen icon (iOS and Android)
- Standalone display — no browser chrome when installed
- iOS status bar extends into the notch/Dynamic Island with the app's dark green theme
- No horizontal scrolling; native tap feel; modal scroll lock

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6 modules), [Vite](https://vitejs.dev/)
- **Styling:** SCSS
- **Backend:** [Firebase](https://firebase.google.com/) — Auth, Firestore, Realtime Database, Hosting, Cloud Messaging
- **Cloud Functions:** Scheduled daily push notifications (`functions/index.js`)
- **APIs:**
  - [Open-Meteo](https://open-meteo.com/) (weather data)
  - Firebase Realtime Database (plant catalog)

---

## Running Locally

```bash
npm install
npm run dev
```

### Push Notifications Setup
1. Go to **Firebase Console → Project Settings → Cloud Messaging → Web Push certificates** and generate a key pair
2. Create a `.env` file in the project root (see `.env.example`):
   ```
   VITE_FCM_VAPID_KEY=your_public_vapid_key
   ```
3. To enable scheduled background push, deploy the Cloud Function:
   ```bash
   cd functions && npm install
   firebase deploy --only functions
   ```
