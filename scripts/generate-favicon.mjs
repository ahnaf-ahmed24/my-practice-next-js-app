// ফ্যাভিকন তৈরি — NextMart-এর ব্যাগ লোগো থেকে favicon.ico (16/32/48/64) ও icon.svg বানায়
// চালান: node scripts/generate-favicon.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// ---------- PNG এনকোডার (নির্ভরতা ছাড়াই) ----------
const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typeAndData));

    return Buffer.concat([length, typeAndData, crc]);
};

// RGBA পিক্সেল → PNG বাফার
const encodePng = (width, height, rgba) => {
    const raw = Buffer.alloc((width * 4 + 1) * height);

    for (let y = 0; y < height; y++) {
        raw[y * (width * 4 + 1)] = 0; // filter: none
        rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // color type: RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
};

// ---------- আইকন ডিজাইন ----------
const BLUE = [59, 130, 246];
const INDIGO = [99, 102, 241];
const PURPLE = [168, 85, 247];

const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t));

// গ্রেডিয়েন্ট ব্যাকগ্রাউন্ডে ব্যাগের রঙ
const colorAt = (x, y, size) => {
    const t = y / size;
    return t < 0.5 ? mix(BLUE, INDIGO, t * 2) : mix(INDIGO, PURPLE, (t - 0.5) * 2);
};

// একটি পিক্সেল রঙ (RGBA) — সুপারস্যাম্পলিং সহ
const sample = (fx, fy, size) => {
    // রাউন্ডেড স্কয়ার ব্যাকগ্রাউন্ড
    const radius = size * 0.22;
    const inset = size * 0.02;
    const min = inset;
    const max = size - inset;

    const inRounded = (x, y) => {
        const cx = Math.min(Math.max(x, min + radius), max - radius);
        const cy = Math.min(Math.max(y, min + radius), max - radius);
        const dx = x - cx;
        const dy = y - cy;
        return dx * dx + dy * dy <= radius * radius;
    };

    if (!inRounded(fx, fy)) return [0, 0, 0, 0];

    const bg = colorAt(fx, fy, size);

    // কেন্দ্রে সাদা কেন্দাপুলি (ব্যাগ)
    const bagLeft = size * 0.26;
    const bagRight = size * 0.74;
    const bagTop = size * 0.38;
    const bagBottom = size * 0.8;
    const bagRadius = size * 0.08;

    const inBag = (x, y) => {
        if (x < bagLeft || x > bagRight || y < bagTop || y > bagBottom) return false;
        const cx = Math.min(Math.max(x, bagLeft + bagRadius), bagRight - bagRadius);
        const cy = Math.min(Math.max(y, bagTop + bagRadius), bagBottom - bagRadius);
        const dx = x - cx;
        const dy = y - cy;
        return dx * dx + dy * dy <= bagRadius * bagRadius;
    };

    // হ্যান্ডল — বৃত্তের শেষাংশ
    const handleCx = size * 0.5;
    const handleCy = size * 0.42;
    const handleR = size * 0.19;
    const dist = Math.hypot(fx - handleCx, fy - handleCy);
    const inHandle = dist <= handleR && dist >= handleR - size * 0.075 && fy < handleCy;

    if (inBag(fx, fy) || inHandle) return [255, 255, 255, 255];

    return [...bg, 255];
};

const renderIcon = (size) => {
    const rgba = Buffer.alloc(size * size * 4);
    const samples = 4; // সুপারস্যাম্পলিং

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let r = 0;
            let g = 0;
            let b = 0;
            let a = 0;

            for (let sy = 0; sy < samples; sy++) {
                for (let sx = 0; sx < samples; sx++) {
                    const px = x + (sx + 0.5) / samples;
                    const py = y + (sy + 0.5) / samples;
                    const [sr, sg, sb, sa] = sample(px, py, size);

                    r += sr * sa;
                    g += sg * sa;
                    b += sb * sa;
                    a += sa;
                }
            }

            const total = samples * samples;
            const offset = (y * size + x) * 4;

            if (a === 0) {
                rgba[offset + 3] = 0;
                continue;
            }

            rgba[offset] = Math.round(r / a);
            rgba[offset + 1] = Math.round(g / a);
            rgba[offset + 2] = Math.round(b / a);
            rgba[offset + 3] = Math.round(a / total);
        }
    }

    return rgba;
};

// ---------- ICO কনটেইনার ----------
const buildIco = (sizes) => {
    const images = sizes.map((size) => ({ size, data: encodePng(size, size, renderIcon(size)) }));

    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type: icon
    header.writeUInt16LE(images.length, 4);

    const entries = [];
    let offset = 6 + images.length * 16;

    for (const image of images) {
        const entry = Buffer.alloc(16);
        entry[0] = image.size >= 256 ? 0 : image.size;
        entry[1] = image.size >= 256 ? 0 : image.size;
        entry[2] = 0; // colors
        entry[3] = 0; // reserved
        entry.writeUInt16LE(1, 4); // color planes
        entry.writeUInt16LE(32, 6); // bits per pixel
        entry.writeUInt32LE(image.data.length, 8);
        entry.writeUInt32LE(offset, 12);

        entries.push(entry);
        offset += image.data.length;
    }

    return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
};

const ico = buildIco([16, 32, 48, 64]);
writeFileSync('src/app/favicon.ico', ico);

// ---------- SVG আইকন (আধুনিক ব্রাউজারের জন্য) ----------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect x="1.3" y="1.3" width="61.4" height="61.4" rx="14" fill="url(#g)"/>
  <path d="M16.6 24.3a15.4 15.4 0 0 0 30.8 0" fill="none" stroke="#fff" stroke-width="4.8" stroke-linecap="round"/>
  <path d="M18.6 24.8h26.8a3 3 0 0 1 3 3.2l-1.5 18.6a6 6 0 0 1-6 5.6H23.1a6 6 0 0 1-6-5.6L15.6 28a3 3 0 0 1 3-3.2Z" fill="#fff"/>
</svg>
`;
writeFileSync('src/app/icon.svg', svg);

console.log('✔ favicon.ico ও icon.svg তৈরি হয়েছে');
