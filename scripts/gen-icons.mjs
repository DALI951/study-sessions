/* Zero-dependency PNG launcher icon generator. Warm paper field + teal book pages. */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])), 0);
  return Buffer.concat([len, tag, data, crc]);
}
function png(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(pixels, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
function rounded(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false;
  const cx = px < x0 + r ? x0 + r : (px > x1 - r ? x1 - r : px);
  const cy = py < y0 + r ? y0 + r : (py > y1 - r ? y1 - r : py);
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}
function rect(px, py, x0, y0, x1, y1) {
  return px >= x0 && px <= x1 && py >= y0 && py <= y1;
}
function render(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1), 0);
  const paper = [246, 242, 234], teal = [15, 118, 110], white = [255, 255, 255];
  const sub = 4;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < sub; sy++) {
        for (let sx = 0; sx < sub; sx++) {
          const px = (x + (sx + 0.5) / sub) / size;
          const py = (y + (sy + 0.5) / sub) / size;
          let c = paper;
          if (rounded(px, py, 0.08, 0.08, 0.92, 0.92, 0.2)) {
            c = teal;
            if (rect(px, py, 0.29, 0.31, 0.46, 0.70) || rect(px, py, 0.54, 0.31, 0.71, 0.70)) c = white;
          }
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = sub * sub, at = row + 1 + x * 4;
      raw[at] = Math.round(r / n);
      raw[at + 1] = Math.round(g / n);
      raw[at + 2] = Math.round(b / n);
      raw[at + 3] = 255;
    }
  }
  return png(size, raw);
}

const res = join(process.cwd(), 'src/main/res');
const sizes = { 'mipmap-mdpi': 48, 'mipmap-hdpi': 72, 'mipmap-xhdpi': 96, 'mipmap-xxhdpi': 144, 'mipmap-xxxhdpi': 192 };
for (const [dir, size] of Object.entries(sizes)) {
  const folder = join(res, dir);
  mkdirSync(folder, { recursive: true });
  const bytes = render(size);
  writeFileSync(join(folder, 'ic_launcher.png'), bytes);
  writeFileSync(join(folder, 'ic_launcher_round.png'), bytes);
  console.log(`${dir}: ${size}x${size}, ${bytes.length} bytes`);
}
