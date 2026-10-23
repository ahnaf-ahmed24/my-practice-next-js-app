// রেসপন্সিভ টেস্ট — প্রতিটি পেজ ও ভিউপোর্টে হরাইজনাল স্ক্রল থাকে কি না দেখে
// চালান: node scripts/test-responsive.mjs   (আগে সার্ভার চালু থাকতে হবে)
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

const viewports = [
    { name: '320px (iPhone SE)', width: 320, height: 640 },
    { name: '375px (iPhone)', width: 375, height: 812 },
    { name: '414px (iPhone Plus)', width: 414, height: 896 },
    { name: '768px (tablet)', width: 768, height: 1024 },
    { name: '1024px (laptop)', width: 1024, height: 768 },
    { name: '1440px (desktop)', width: 1440, height: 900 },
];

const pages = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
    { path: '/learn-more', name: 'learn-more' },
    { path: '/contact', name: 'contact' },
    { path: '/login', name: 'login' },
    { path: '/admin/login', name: 'admin-login' },
    { path: '/products/smartphones-1', name: 'product' },
    { path: '/categories/electronics', name: 'category' },
    { path: '/categories/electronics/smartphones', name: 'subcategory' },
    { path: '/cart', name: 'cart' },
    { path: '/checkout', name: 'checkout' },
    { path: '/profile', name: 'profile' },
];

const browser = await chromium.launch();
const context = await browser.newContext();

// লগইন করা অবস্থায় কার্ট ও প্রোফাইলও পরীক্ষা করা যায়
const email = `responsive-${Date.now()}@example.com`;
await context.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name: 'রেসপন্সিভ টেস্ট', email, password: 'supersecret123' },
});

const page = await context.newPage();
await page.goto(`${BASE}/products/smartphones-1`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add to Cart/i }).first().click();

let failures = 0;

for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    let viewportFailures = 0;

    for (const target of pages) {
        await page.goto(`${BASE}${target.path}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(250);

        const overflow = await page.evaluate(() => {
            const doc = document.documentElement;
            // কোন উপাদান উইন্ডোর বাইরে যাচ্ছে?
            const widest = [...document.querySelectorAll('body *')]
                .filter((el) => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.right > window.innerWidth + 1;
                })
                .slice(0, 3)
                .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);

            return {
                scrollWidth: doc.scrollWidth,
                innerWidth: window.innerWidth,
                widest,
            };
        });

        const hasOverflow = overflow.scrollWidth > overflow.innerWidth + 1;

        if (hasOverflow) {
            viewportFailures += 1;
            failures += 1;
            console.log(
                `✖ ${target.name} @ ${viewport.name} — scrollWidth=${overflow.scrollWidth} > ${overflow.innerWidth}` +
                    (overflow.widest.length ? `\n    উপাদান: ${overflow.widest.join(', ')}` : ''),
            );
        }
    }

    ok(
        `${viewport.name} — ${pages.length}টি পেজে হরাইজনাল স্ক্রল নেই`,
        viewportFailures === 0,
        viewportFailures ? `${viewportFailures}টি পেজে সমস্যা` : '',
    );
}

// মোবাইলে ট্যাপ টার্গেট ও মেনু
await page.setViewportSize({ width: 320, height: 640 });
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

const smallTargets = await page.evaluate(() =>
    [...document.querySelectorAll('button, a')]
        .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.height < 32;
        })
        .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent?.trim().slice(0, 24)} (${Math.round(el.getBoundingClientRect().height)}px)`),
);
ok('কোনো ছোট ট্যাপ টার্গেট নেই (৩২px+)', smallTargets.length === 0, smallTargets.join(', '));

// মোবাইল মেনুতে ভাষা বাটন আছে কি না
await page.getByRole('button', { name: /Open menu/i }).click();
await page.waitForTimeout(400);
ok(
    'মোবাইল মেনুতে ভাষা বাটন আছে',
    await page.getByRole('button', { name: /Switch to English/i }).first().isVisible(),
);
ok(
    'মোবাইল মেনুতে কার্ট ও থিম টগল আছে',
    (await page.getByRole('link', { name: /Cart/i }).count()) > 0 &&
        (await page.getByRole('button', { name: /Toggle light and dark mode/i }).count()) > 0,
);

console.log(failures === 0 ? '\n✔ সব পেজ সব ভিউপোর্টে রেসপন্সিভ' : `\n✖ ${failures}টি রেসপন্সিভ সমস্যা`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
