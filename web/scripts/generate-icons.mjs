import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFilePath);
const projectRoot = path.resolve(scriptDir, '..');
const outDir = path.resolve(projectRoot, 'public/icons');


fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writePng(filePath, width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const name = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
    return Buffer.concat([len, name, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0;
    rgba.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });

  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(filePath, png);
}

function drawIcon(size, maskable = false) {
  const bg = [17, 24, 39, 255];
  const white = [249, 250, 251, 255];
  const red = [239, 68, 68, 255];
  const orange = [249, 115, 22, 255];
  const blue = [147, 197, 253, 255];

  const data = Buffer.alloc(size * size * 4);

  const setPixel = (x, y, color) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const idx = (y * size + x) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = color[3];
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) setPixel(x, y, bg);
  }

  const pad = size * (maskable ? 0.16 : 0.12);
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - pad * 2) / 2;
  const stroke = Math.max(2, Math.floor(size / 32));

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= radius - stroke && d <= radius) setPixel(x, y, white);
    }
  }

  const cigY = Math.floor(size * 0.55);
  const cigH = Math.max(2, Math.floor(size / 14));
  for (let y = cigY - Math.floor(cigH / 2); y < cigY + Math.floor(cigH / 2); y += 1) {
    for (let x = Math.floor(size * 0.28); x < Math.floor(size * 0.72); x += 1) setPixel(x, y, white);
    for (let x = Math.floor(size * 0.63); x < Math.floor(size * 0.72); x += 1) setPixel(x, y, orange);
  }

  const drawArc = (ox, oy, r, startDeg, endDeg, thickness = 2) => {
    for (let deg = startDeg; deg <= endDeg; deg += 1) {
      const rad = (deg * Math.PI) / 180;
      const x = Math.round(ox + r * Math.cos(rad));
      const y = Math.round(oy + r * Math.sin(rad));
      for (let dx = -thickness; dx <= thickness; dx += 1) {
        for (let dy = -thickness; dy <= thickness; dy += 1) setPixel(x + dx, y + dy, blue);
      }
    }
  };

  drawArc(size * 0.48, size * 0.38, size * 0.1, 210, 350, Math.max(1, Math.floor(size / 90)));
  drawArc(size * 0.6, size * 0.32, size * 0.1, 210, 350, Math.max(1, Math.floor(size / 90)));

  const x1 = size * 0.24;
  const y1 = size * 0.76;
  const x2 = size * 0.76;
  const y2 = size * 0.24;
  const thick = Math.max(2, Math.floor(size / 24));
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      if (Math.hypot(x - px, y - py) <= thick) setPixel(x, y, red);
    }
  }

  return data;
}

const icons = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon-32.png', size: 32, maskable: false },
  { name: 'favicon-16.png', size: 16, maskable: false }
];

for (const icon of icons) {
  const outputPath = path.join(outDir, icon.name);
  const pixels = drawIcon(icon.size, icon.maskable);
  writePng(outputPath, icon.size, icon.size, pixels);
}

console.log(`Generated ${icons.length} PNG icons in ${outDir}`);
