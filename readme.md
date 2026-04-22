# PlantPal

PlantPal is a mobile-first plant care companion that helps you discover, track, and maintain your indoor plants. From a guided plant quiz to a daily care dashboard and personal photo journal, PlantPal keeps your plants thriving.

**Live App:** https://fir-setup-f2b47.web.app/

---

## Features

**Plant Matchmaker Quiz**
Answer a few questions about your space and lifestyle — PlantPal recommends the best plants for you based on your light conditions and care availability.

**Plant Search & Discovery**
Browse and search a curated catalog of common houseplants. Each plant page includes care requirements, light needs, watering frequency, toxicity info, and detailed care notes.

**Daily Care Dashboard (Home)**
A lockscreen-style hero cycles through your personal plant photos with a live weather overlay showing your location, current conditions, date, and time. Below it, today's tasks are auto-generated — watering reminders, fertilizing due dates, and monthly progress update prompts.

**My Plants Gallery**
A visual gallery of all your plants with custom nicknames, profile photos, and individual detail pages showing care stats, last watered/fertilized dates, and care level tags.

**Plant Journal**
Log monthly progress updates with a photo, written notes, and a health rating (1–5). Photos are stored to your personal gallery and cycle through the home hero.

**Care Actions**
Water, fertilize, and journal directly from task cards or a plant's detail page — all synced to your Firebase account in real time.

**Weather Integration**
Real-time local weather displayed on the home hero using Open-Meteo with reverse geolocation.

**User Profiles**
Customize your display name, profile photo, temperature unit preference (°C / °F), and location settings.

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), [Vite](https://vitejs.dev/)
- **Styling:** SCSS
- **Backend:** [Firebase](https://firebase.google.com/) — Auth, Firestore, Realtime Database
- **APIs:**
  - [Open-Meteo](https://open-meteo.com/) (Weather)
  - Firebase Realtime Database (Plant catalog)

---

## Running Locally

```bash
npm install
npm run dev
```
