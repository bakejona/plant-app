// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const src    = './public/icons/Plantpal-logo-color.png';
const svgSrc = './public/favicon.svg';
import { readFileSync } from 'fs';

// App icons — direct resize, no modifications
for (const [size, dest] of [[512,'public/icons/icon-512.png'],[192,'public/icons/icon-192.png'],[180,'public/icons/icon-180.png']]) {
    await sharp(src).resize(size, size).png().toFile(dest);
    console.log(`✓ Generated ${dest}`);
}

// Favicon uses the original circle SVG
await sharp(readFileSync(svgSrc), { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
console.log('✓ Generated public/favicon-32.png (circle)');
