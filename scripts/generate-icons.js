// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const src = './public/icons/Plantpal-logo-color.png';

const icons = [
    { size: 192,  dest: 'public/icons/icon-192.png' },
    { size: 512,  dest: 'public/icons/icon-512.png' },
    { size: 180,  dest: 'public/icons/icon-180.png' },  // apple-touch-icon
    { size: 32,   dest: 'public/favicon-32.png' },
];

for (const { size, dest } of icons) {
    await sharp(src).resize(size, size).png().toFile(`./${dest}`);
    console.log(`✓ Generated ${dest}`);
}
