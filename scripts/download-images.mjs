// public/products/ ফোল্ডারে প্রতিটি সাবক্যাটাগরির জন্য আসল ছবি ডাউনলোড করে।
// চালান: node scripts/download-images.mjs   (--force দিলে আগের ছবিগুলো নতুন করে নেয়)
//
// উৎস: Unsplash CDN (কীওর্ড-ম্যাচিং ছবির জন্য কিউরেট করা photo ID)।
// কোনো ID কাজ না করলে পরের ক্যান্ডিডেট চেষ্টা করে, সব ব্যর্থ হলে
// Lorem Picsum (সিডেড, আসল কিন্তু জেনেরিক ছবি) ফলব্যাক ব্যবহার করে।
// সব ছবি sharp দিয়ে 800×600 JPEG হিসেবে সংরক্ষিত হয়।

import { mkdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, 'public', 'products');
const force = process.argv.includes('--force');

const WIDTH = 800;
const HEIGHT = 600;

// প্রতিটি সাবক্যাটাগরি: Unsplash CDN-এর কিউরেট করা photo ID ক্যান্ডিডেট (যাচাই সহ)
const SUBS = [
    { slug: 'smartphones', ids: ['photo-1511707171634-5f897ff02aa9', 'photo-1592750475338-74b7b21085ab', 'photo-1580910051074-3eb694886505'] },
    { slug: 'laptops', ids: ['photo-1496181133206-80ce9b88a853', 'photo-1517336714731-489689fd1ca8', 'photo-1541807084-5c52b6b3adef'] },
    { slug: 'headphones', ids: ['photo-1505740420928-5e560c06d30e', 'photo-1546435770-a3e426bf472b', 'photo-1484704849700-f032a568e944'] },
    { slug: 'wearables', ids: ['photo-1546868871-7041f2a55e12', 'photo-1523275335684-37898b6baf30', 'photo-1579586337278-3befd40fd17a'] },
    { slug: 'gaming', ids: ['photo-1592840496694-26d035b52b48', 'photo-1580327344181-c1163234e5a0', 'photo-1606144042614-b2417e99c4e3'] },
    { slug: 'cameras', ids: ['photo-1516035069371-29a1b244cc32', 'photo-1502920917128-1aa500764cbd', 'photo-1526170375885-4d8ecf77b99f'] },

    { slug: 't-shirts', ids: ['photo-1521572163474-6864f9cf17ab', 'photo-1583743814966-8936f5b7be1a', 'photo-1576566588028-4147f3842f27'] },
    { slug: 'shoes', ids: ['photo-1542291026-7eec264c27ff', 'photo-1560769629-975ec94e6a86', 'photo-1595950653106-6c9ebd614d3a'] },
    { slug: 'jackets', ids: ['photo-1551028719-00167b16eac5', 'photo-1591047139829-d91aecb6caea', 'photo-1544022613-e87ca75a784a'] },
    { slug: 'bags', ids: ['photo-1553062407-98eeb64c6a62', 'photo-1622560480605-d83c853bc5c3', 'photo-1548036328-c9fa89d128fa'] },
    { slug: 'dresses', ids: ['photo-1595777457583-95e059d581b8', 'photo-1572804013309-59a88b7e92f1', 'photo-1566174053879-31528523f8ae'] },
    { slug: 'accessories', ids: ['photo-1588850561407-ed78c282e89b', 'photo-1521369909029-2afed882baee', 'photo-1620327467532-6ebeb1e7d6ae'] },

    { slug: 'furniture', ids: ['photo-1592078615290-033ee584e267', 'photo-1567538096630-e0c55bd6374c', 'photo-1555041469-a586c61ea9bc'] },
    { slug: 'kitchen', ids: ['photo-1556910103-1c02745aae4d', 'photo-1584990347449-a2d4c2c9b0ea', 'photo-1590794056226-79ef3a8147e1'] },
    { slug: 'bedding', ids: ['photo-1522771739844-6a9f6d5f14af', 'photo-1540518614846-7eded433c457', 'photo-1616594039964-ae9021a400a0'] },
    { slug: 'lighting', ids: ['photo-1507473885765-e6ed057f782c', 'photo-1513506003901-1e6a229e2d15', 'photo-1543198126-a4d4c6d0b31d'] },
    { slug: 'decor', ids: ['photo-1578500494198-246f612d3b3d', 'photo-1602028915047-37269d1a73f7', 'photo-1519710164239-da123dc03ef4'] },

    { slug: 'skincare', ids: ['photo-1556228720-195a672e8a03', 'photo-1620916566398-39f1143ab7be', 'photo-1608248543803-ba4f8c70ae0b'] },
    { slug: 'makeup', ids: ['photo-1586495777744-4413f21062fa', 'photo-1512496015851-a90fb38ba796', 'photo-1596462502278-27bfdc403348'] },
    { slug: 'haircare', ids: ['photo-1535585209827-a15fcdbc4c2b', 'photo-1526947425960-945c6e72858f', 'photo-1631730486572-226d1f595b68'] },
    { slug: 'fragrances', ids: ['photo-1541643600914-78b084683601', 'photo-1592945403244-b3fbafd7f539', 'photo-1594035910387-fea47794261f'] },
    { slug: 'grooming', ids: ['photo-1503951914875-452162b0f3f1', 'photo-1621607512214-68297480165e', 'photo-1585747860715-2ba37e788b70'] },

    { slug: 'fitness', ids: ['photo-1517836357463-d25dfeac3438', 'photo-1571019613454-1cb2f99b2d8b', 'photo-1534438327276-14e5300c3a48'] },
    { slug: 'cycling', ids: ['photo-1485965120184-e220f721d03e', 'photo-1502744688674-c619d1586c9e', 'photo-1541625602330-2277a4c46182'] },
    { slug: 'yoga', ids: ['photo-1544367567-0f2fcb009e0b', 'photo-1592432678016-e910b452f9a2', 'photo-1506126613408-eca07ce68773'] },
    { slug: 'camping', ids: ['photo-1504280390367-361c6d9f38f4', 'photo-1478131143081-80f7f84ca84d', 'photo-1445308394109-4ec2920981b1'] },
    { slug: 'hiking', ids: ['photo-1520639888713-7851133b1ed0', 'photo-1606107557195-0e29a4b5b4aa', 'photo-1551632811-561732d1e306'] },

    { slug: 'fiction', ids: ['photo-1544947950-fa07a98d237f', 'photo-1512820790803-83ca734da794', 'photo-1495446815901-a7297e633e8d'] },
    { slug: 'notebooks', ids: ['photo-1531346878377-a5be20888e57', 'photo-1517842645767-c639042777db', 'photo-1544716278-ca5e3f4abd8c'] },
    { slug: 'stationery', ids: ['photo-1455390582262-044cdead277a', 'photo-1583485088034-697b5bc54ccd', 'photo-1568205612837-017257d2310a'] },
    { slug: 'art-supplies', ids: ['photo-1513364776144-60967b0f800f', 'photo-1460661419201-fd4cecdf8a8b', 'photo-1499892477393-f675706cbe6e'] },
    { slug: 'kids-books', ids: ['photo-1503454537195-1dcabb73ffb9', 'photo-1512820790803-83ca734da794', 'photo-1481627834876-b7833e8f5570'] },
];

const VARIANTS = 2; // প্রতি সাবক্যাটাগরিতে কতটি ছবি

// Unsplash CDN থেকে বাইট আনে
const fetchImage = async (url) => {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return null; // খুব ছোট = সম্ভবত ব্যর্থ
    return buf;
};

// বাইটকে ভ্যালিড ইমেজ হিসেবে যাচাই করে 800×600 JPEG-এ রূপান্তর করে
const normalize = async (buf) => {
    try {
        const jpeg = await sharp(buf)
            .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 78, mozjpeg: true })
            .toBuffer();
        return jpeg.length > 5000 ? jpeg : null;
    } catch {
        return null;
    }
};

mkdirSync(outDir, { recursive: true });

const summary = [];

for (const sub of SUBS) {
    const saved = [];
    let source = 'unsplash';

    for (let v = 1; v <= VARIANTS; v += 1) {
        const outPath = join(outDir, `${sub.slug}-${v}.jpg`);
        if (!force && existsSync(outPath) && statSync(outPath).size > 5000) {
            saved.push(`${sub.slug}-${v}`);
            continue;
        }

        let written = false;

        // প্রতিটি ক্যান্ডিডেট ID যাচাই করে
        for (const id of sub.ids) {
            const buf = await fetchImage(`https://images.unsplash.com/${id}?w=1000&h=750&fit=crop&q=75&fm=jpg`);
            if (!buf) continue;
            const jpeg = await normalize(buf);
            if (!jpeg) continue;
            await import('node:fs/promises').then((fs) => fs.writeFile(outPath, jpeg));
            saved.push(`${sub.slug}-${v}`);
            written = true;
            break;
        }

        // ফলব্যাক: Picsum (সিডেড আসল ছবি, জেনেরিক বিষয়)
        if (!written) {
            source = 'picsum-fallback';
            const url = `https://picsum.photos/seed/${sub.slug}-${v}/1000/750`;
            const buf = await fetchImage(url);
            const jpeg = buf ? await normalize(buf) : null;
            if (jpeg) {
                await import('node:fs/promises').then((fs) => fs.writeFile(outPath, jpeg));
                saved.push(`${sub.slug}-${v}`);
                written = true;
            }
        }

        if (!written) {
            console.error(`  ✖ FAILED: ${sub.slug}-${v}`);
        }
    }

    summary.push({ slug: sub.slug, images: saved.length, source });
}

// ফলাফল
const failed = summary.filter((s) => s.images < VARIANTS);
const fallbacks = summary.filter((s) => s.source === 'picsum-fallback');
console.log(`✔ ${summary.length} subcategories processed → public/products/`);
console.log(`  variants each: ${VARIANTS} | total images: ${summary.reduce((n, s) => n + s.images, 0)}`);
if (fallbacks.length) console.log(`  ⚠ picsum fallback used for: ${fallbacks.map((s) => s.slug).join(', ')}`);
if (failed.length) console.log(`  ✖ incomplete: ${failed.map((s) => s.slug).join(', ')}`);
