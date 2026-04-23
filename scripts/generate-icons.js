// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/favicon.svg');

const icons = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 180, name: 'icon-180.png' },  // apple-touch-icon
];

for (const { size, name } of icons) {
    await sharp(svg, { density: 300 })
        .resize(size, size)
        .png()
        .toFile(`./public/icons/${name}`);
    console.log(`✓ Generated public/icons/${name}`);
}
