// seed-rtdb.js
// Populates the RTDB emulator with test plant + sensor data
// Run with: node seed-rtdb.js

const BASE = 'http://127.0.0.1:9000';
const NS   = 'fir-setup-f2b47-default-rtdb';

async function put(path, data) {
  const url = `${BASE}${path}.json?ns=${NS}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status} ${await res.text()}`);
  console.log(`✅ PUT ${path}`);
}

const plants = {
  aloe_vera: {
    name: 'Aloe Vera',
    scientific_name: 'Aloe barbadensis miller',
    description: 'A succulent known for its soothing gel and striking rosette form. Thrives on neglect — bright light and infrequent watering keep it happy.',
    care_level: 'easy',
    image: '/plants/aloe.jpeg',
    fertilize: {
      frequency: 'Every 6–8 weeks',
      season: 'Spring – Summer',
      notes: 'Use a diluted cactus or succulent fertilizer. Never fertilise in winter.',
    },
    care: {
      temperature_c: { min: 13, max: 35, ideal: 22 },
      temperature_f: { min: 55, max: 95, ideal: 72 },
      humidity:      { min: 15, max: 50, ideal: 30, notes: 'Tolerates dry air well. Avoid humid bathrooms.' },
      moisture:      { min: 10, max: 30, ideal: 18, notes: 'Allow soil to dry out completely between waterings.' },
      light:         { min: 35, max: 90, ideal: 65, type: 'Bright indirect – Full sun' },
    },
  },
  chinese_money_plant: {
    name: 'Chinese Money Plant',
    scientific_name: 'Pilea peperomioides',
    description: 'Beloved for its distinctive round, pancake-shaped leaves on long stems. Easy to propagate and share — hence the nickname "pass-it-along plant".',
    care_level: 'easy',
    image: '/plants/chinesemoney.jpeg',
    fertilize: {
      frequency: 'Monthly',
      season: 'Spring – Summer',
      notes: 'Balanced liquid fertilizer at half strength. Stop feeding in autumn and winter.',
    },
    care: {
      temperature_c: { min: 13, max: 28, ideal: 20 },
      temperature_f: { min: 55, max: 82, ideal: 68 },
      humidity:      { min: 40, max: 70, ideal: 55, notes: 'Mist occasionally or use a humidifier in dry climates.' },
      moisture:      { min: 30, max: 55, ideal: 42, notes: 'Water when the top inch of soil is dry. Never let it sit in water.' },
      light:         { min: 20, max: 60, ideal: 40, type: 'Bright indirect' },
    },
  },
  jade_plant: {
    name: 'Jade Plant',
    scientific_name: 'Crassula ovata',
    description: 'A long-lived succulent with thick, oval leaves and a tree-like form. Often passed down through generations — a symbol of good luck and prosperity.',
    care_level: 'easy',
    image: '/plants/jade.jpeg',
    fertilize: {
      frequency: 'Every 6 weeks',
      season: 'Spring – Summer',
      notes: 'Use a diluted cactus fertilizer. Avoid fertilising newly repotted or stressed plants.',
    },
    care: {
      temperature_c: { min: 10, max: 28, ideal: 18 },
      temperature_f: { min: 50, max: 82, ideal: 65 },
      humidity:      { min: 15, max: 50, ideal: 30, notes: 'Low humidity is fine — this plant dislikes excess moisture in the air.' },
      moisture:      { min: 10, max: 35, ideal: 20, notes: 'Allow soil to dry between waterings. Reduce in winter.' },
      light:         { min: 35, max: 90, ideal: 60, type: 'Bright indirect – Full sun' },
    },
  },
  monstera: {
    name: 'Monstera',
    scientific_name: 'Monstera deliciosa',
    description: 'A striking tropical plant with iconic split leaves. Thrives in indirect light and appreciates consistent moisture without waterlogging.',
    care_level: 'medium',
    image: '/plants/monstera.jpeg',
    fertilize: {
      frequency: 'Monthly',
      season: 'Spring – Summer',
      notes: 'Use a balanced liquid fertilizer (20-20-20) diluted to half strength. Skip feeding in autumn and winter.',
    },
    care: {
      temperature_c: { min: 18, max: 30, ideal: 24 },
      temperature_f: { min: 64, max: 86, ideal: 75 },
      humidity:      { min: 40, max: 80, ideal: 60, notes: 'Mist leaves weekly or use a pebble tray.' },
      moisture:      { min: 30, max: 70, ideal: 50, notes: 'Water when top 2 inches of soil are dry.' },
      light:         { min: 20, max: 70, ideal: 45, type: 'Indirect' },
    },
  },
  peace_lily: {
    name: 'Peace Lily',
    scientific_name: 'Spathiphyllum wallisii',
    description: 'One of the best low-light houseplants, with elegant white blooms and glossy dark leaves. It will visibly droop when it needs water — a helpful signal.',
    care_level: 'medium',
    image: '/plants/peacelily.jpeg',
    fertilize: {
      frequency: 'Every 6 weeks',
      season: 'Spring – Summer',
      notes: 'Use a balanced liquid fertilizer at half strength. Too much fertilizer can prevent flowering.',
    },
    care: {
      temperature_c: { min: 18, max: 30, ideal: 22 },
      temperature_f: { min: 64, max: 86, ideal: 72 },
      humidity:      { min: 50, max: 80, ideal: 65, notes: 'Mist frequently or place on a humidity tray. Brown tips indicate dry air.' },
      moisture:      { min: 40, max: 70, ideal: 55, notes: 'Keep soil consistently moist but not soggy. Water when the surface starts to dry.' },
      light:         { min: 10, max: 50, ideal: 30, type: 'Low – Indirect' },
    },
  },
  pothos: {
    name: 'Pothos',
    scientific_name: 'Epipremnum aureum',
    description: 'Virtually indestructible, the pothos thrives in almost any condition. Its trailing vines look great on shelves and are excellent air purifiers.',
    care_level: 'easy',
    image: '/plants/pothos.jpeg',
    fertilize: {
      frequency: 'Every 6–8 weeks',
      season: 'Spring – Summer',
      notes: 'A balanced liquid fertilizer at half strength is plenty. Avoid over-fertilising — it can burn roots.',
    },
    care: {
      temperature_c: { min: 15, max: 30, ideal: 22 },
      temperature_f: { min: 59, max: 86, ideal: 72 },
      humidity:      { min: 40, max: 70, ideal: 55, notes: 'Adaptable to most indoor humidity levels.' },
      moisture:      { min: 30, max: 60, ideal: 45, notes: 'Allow the top 2 inches to dry out between waterings.' },
      light:         { min: 10, max: 60, ideal: 35, type: 'Low – Bright indirect' },
    },
  },
  rubber_plant: {
    name: 'Rubber Plant',
    scientific_name: 'Ficus elastica',
    description: 'A bold statement plant with large, glossy burgundy or deep-green leaves. Fast-growing when well cared for and becomes a stunning indoor tree over time.',
    care_level: 'medium',
    image: '/plants/rubber.jpeg',
    fertilize: {
      frequency: 'Monthly',
      season: 'Spring – Summer',
      notes: 'Use a high-nitrogen fertilizer to support leafy growth. Wipe leaves with a damp cloth to keep them dust-free.',
    },
    care: {
      temperature_c: { min: 15, max: 30, ideal: 22 },
      temperature_f: { min: 59, max: 86, ideal: 72 },
      humidity:      { min: 40, max: 70, ideal: 55, notes: 'Mist occasionally. Avoid cold draughts.' },
      moisture:      { min: 30, max: 60, ideal: 45, notes: 'Water when top inch of soil is dry. Reduce in winter.' },
      light:         { min: 20, max: 70, ideal: 45, type: 'Bright indirect' },
    },
  },
  snake_plant: {
    name: 'Snake Plant',
    scientific_name: 'Sansevieria trifasciata',
    description: 'Extremely hardy and tolerant of neglect. Survives low light and infrequent watering — a perfect beginner plant.',
    care_level: 'easy',
    image: '/plants/snake.jpeg',
    fertilize: {
      frequency: 'Every 6 weeks',
      season: 'Spring – Summer',
      notes: 'Feed with a cactus or all-purpose fertilizer at half strength. Do not fertilize in winter.',
    },
    care: {
      temperature_c: { min: 15, max: 35, ideal: 22 },
      temperature_f: { min: 59, max: 95, ideal: 72 },
      humidity:      { min: 25, max: 50, ideal: 35, notes: 'Tolerates dry air well.' },
      moisture:      { min: 10, max: 40, ideal: 20, notes: 'Allow soil to dry out completely between waterings.' },
      light:         { min: 10, max: 80, ideal: 40, type: 'Low – Bright indirect' },
    },
  },
  spider_plant: {
    name: 'Spider Plant',
    scientific_name: 'Chlorophytum comosum',
    description: 'Cheerful and fast-growing with arching green-and-white striped leaves. Produces cascading "spiderettes" that can be propagated easily.',
    care_level: 'easy',
    image: '/plants/spider.jpeg',
    fertilize: {
      frequency: 'Monthly',
      season: 'Spring – Summer',
      notes: 'A balanced liquid fertilizer at half strength. Over-fertilising causes brown leaf tips.',
    },
    care: {
      temperature_c: { min: 10, max: 30, ideal: 20 },
      temperature_f: { min: 50, max: 86, ideal: 68 },
      humidity:      { min: 40, max: 70, ideal: 55, notes: 'Tolerates most humidity levels. Dry air may cause brown tips.' },
      moisture:      { min: 30, max: 60, ideal: 45, notes: 'Keep evenly moist in summer. Allow to dry slightly in winter.' },
      light:         { min: 20, max: 65, ideal: 40, type: 'Indirect' },
    },
  },
  string_of_pearls: {
    name: 'String of Pearls',
    scientific_name: 'Senecio rowleyanus',
    description: 'A delicate trailing succulent with bead-like spherical leaves. Stunning in hanging baskets. Needs minimal water and excellent drainage.',
    care_level: 'moderate',
    image: '/plants/stringofpearls.jpeg',
    fertilize: {
      frequency: 'Monthly',
      season: 'Spring – Summer',
      notes: 'Diluted succulent fertilizer at quarter strength. Too much fertilizer causes leggy growth.',
    },
    care: {
      temperature_c: { min: 10, max: 28, ideal: 20 },
      temperature_f: { min: 50, max: 82, ideal: 68 },
      humidity:      { min: 15, max: 50, ideal: 30, notes: 'Low humidity preferred. High humidity can cause rot.' },
      moisture:      { min: 10, max: 35, ideal: 18, notes: 'Allow soil to dry completely. Water sparingly in winter.' },
      light:         { min: 40, max: 85, ideal: 65, type: 'Bright indirect – Full sun' },
    },
  },
  zebra_plant: {
    name: 'Zebra Plant',
    scientific_name: 'Aphelandra squarrosa',
    description: 'Show-stopping foliage with bold white veins on deep green leaves, and vivid yellow flower spikes. Demands high humidity and consistent care.',
    care_level: 'high',
    image: '/plants/zebra.jpeg',
    fertilize: {
      frequency: 'Every 2 weeks',
      season: 'Spring – Summer',
      notes: 'Use a high-phosphorus fertilizer to encourage blooming. Reduce to monthly in autumn.',
    },
    care: {
      temperature_c: { min: 18, max: 30, ideal: 23 },
      temperature_f: { min: 64, max: 86, ideal: 73 },
      humidity:      { min: 55, max: 85, ideal: 70, notes: 'Requires high humidity — mist daily or use a humidifier. A must for this plant.' },
      moisture:      { min: 40, max: 70, ideal: 55, notes: 'Keep soil consistently moist. Never allow to dry out completely.' },
      light:         { min: 20, max: 65, ideal: 45, type: 'Bright indirect' },
    },
  },
  zz_plant: {
    name: 'ZZ Plant',
    scientific_name: 'Zamioculcas zamiifolia',
    description: 'Ultra-tolerant with waxy, dark green leaves that naturally shine. Stores water in its rhizomes, making it drought-proof and ideal for busy households.',
    care_level: 'easy',
    image: '/plants/zz.jpeg',
    fertilize: {
      frequency: 'Every 6–8 weeks',
      season: 'Spring – Summer',
      notes: 'A diluted balanced fertilizer once every couple of months is sufficient. Less is more with ZZ plants.',
    },
    care: {
      temperature_c: { min: 15, max: 30, ideal: 22 },
      temperature_f: { min: 59, max: 86, ideal: 72 },
      humidity:      { min: 25, max: 60, ideal: 40, notes: 'Adaptable to normal indoor humidity. No misting required.' },
      moisture:      { min: 10, max: 40, ideal: 22, notes: 'Allow soil to dry out between waterings. Very tolerant of drought.' },
      light:         { min: 10, max: 70, ideal: 35, type: 'Low – Bright indirect' },
    },
  },
};

// Simulated live sensor readings
const readings = {
  temperature_c: 22.4,
  temperature_f: 72.3,
  humidity:      58.0,
  moisture:      45,
  light:         38,
  timestamp:     Date.now(),
};

(async () => {
  try {
    await put('/plants', plants);
    await put('/readings', readings);
    await put('/pot/selected_plant', 'monstera');
    console.log('\n🌱 RTDB emulator seeded successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  }
})();
