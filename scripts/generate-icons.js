// scripts/generate-icons.js
// Run with: node scripts/generate-icons.js
import sharp from 'sharp';
import { readFileSync } from 'fs';

const src    = './public/icons/Plantpal-logo-color.png';
const svgSrc = './public/favicon.svg';
const bg     = { r: 20, g: 41, b: 30, alpha: 1 }; // background color of source PNG

// 1. Trim built-in padding from source, square up
const trimBuf = await sharp(src).trim({ background: bg, threshold: 15 }).png().toBuffer();
const meta    = await sharp(trimBuf).metadata();

const side = Math.max(meta.width, meta.height);
const padH = Math.floor((side - meta.width)  / 2);
const padV = Math.floor((side - meta.height) / 2);

const squaredBuf = await sharp(trimBuf)
    .extend({ top: padV, bottom: padV + ((side - meta.height) % 2),
              left: padH, right: padH + ((side - meta.width)  % 2),
              background: bg })
    .png().toBuffer();

// 2. Resize to app icon sizes
for (const [size, dest] of [[512,'public/icons/icon-512.png'],[192,'public/icons/icon-192.png'],[180,'public/icons/icon-180.png']]) {
    await sharp(squaredBuf).resize(size, size).png().toFile(dest);
    console.log(`✓ Generated ${dest}`);
}

// 3. Favicon uses the original circle SVG
import { readFileSync } from 'fs';
await sharp(readFileSync(svgSrc), { density: 300 }).resize(32, 32).png().toFile('public/favicon-32.png');
console.log('✓ Generated public/favicon-32.png (circle)');
