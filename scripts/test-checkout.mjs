// চেকআউট ফ্লো E2ই টেস্ট — Playwright দিয়ে আসল ব্রাউজারে চালানো হয়
// চালান: node scripts/test-checkout.mjs   (আগে MongoDB ও সার্ভার চালু থাকতে হবে)
// BASE_URL ডিফল্ট: http://localhost:3000
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const email = `checkout-${Date.now()}@example.com`;
const password = 'supersecret123';

// ১. সাইন আপ (কুকি ব্রাউজার কনটেক্সটের সাথে শেয়ার করে)
const signUp = await context.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name: 'রহিম উদ্দিন', email, password },
});
ok('sign-up works', signUp.ok(), `status=${signUp.status()}`);

// ২. প্রোডাক্ট পেজে গিয়ে কার্টে পণ্য যোগ
await page.goto(`${BASE}/products/smartphones-1`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add to Cart/i }).first().click();
await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' });
await page.getByRole('link', { name: /Confirm order|অর্ডার নিশ্চিত করুন/i }).waitFor();
ok('cart shows the product', (await page.locator('li').count()) > 0);

// ৩. "Confirm order" চাপলে চেকআউট পেজে যায়
await page.getByRole('link', { name: /Confirm order|অর্ডার নিশ্চিত করুন/i }).click();
await page.waitForURL('**/checkout');
ok('confirm order navigates to /checkout', page.url().includes('/checkout'), page.url());

// ৪. লগইন করা থাকলে নাম ও ইমেইল ফর্মে বসে যায়
await page.waitForFunction(
    () => document.querySelector('input[name="email"]')?.value?.includes('@') === true,
    null,
    { timeout: 10000 },
);
const nameValue = await page.locator('input[name="name"]').inputValue();
const emailValue = await page.locator('input[name="email"]').inputValue();
ok('name auto-filled from session', nameValue === 'রহিম উদ্দিন', `name="${nameValue}"`);
ok('email auto-filled from session', emailValue === email, `email="${emailValue}"`);

// ৫. বিভাগ অনুযায়ী জেলা — সব ৬৪টি জেলা বিভাগ বদলে পৌঁছানো যায়
const division = page.locator('select[name="division"]');
const district = page.locator('select[name="district"]');
const divisionNames = await division.locator('option').allTextContents();

let totalDistricts = 0;
let onlyOwnDivision = true;

for (const name of divisionNames) {
    await division.selectOption(name);
    const options = await district.locator('option').allTextContents();
    totalDistricts += options.length;

    // নির্বাচিত বিভাগের জেলা ছাড়া অন্য কিছু দেখা যাওয়া উচিত না
    if (options.includes('Dhaka') && name !== 'Dhaka') onlyOwnDivision = false;
}

ok('every district is reachable via its division', totalDistricts === 64, `total=${totalDistricts}`);
ok('district dropdown only lists the selected division', onlyOwnDivision);
ok('there are 8 divisions', divisionNames.length === 8, `count=${divisionNames.length}`);

// ৬. বিভাগ বদলালে সেই বিভাগের প্রথম জেলা বসে যায়
await division.selectOption('Chattogram');
ok('division change picks its first district', (await district.inputValue()) === 'Bandarban');

// ৭. ভাষা টগল — বাংলা থেকে ইংরেজি
const headingBefore = await page.locator('h2').first().innerText();
await page.getByRole('button', { name: /Switch to English/i }).first().click();
await page.waitForFunction(
    () => document.body.innerText.includes('Payment &'),
    null,
    { timeout: 5000 },
);
ok('language toggle switches to English', true, `before="${headingBefore.trim()}"`);

await page.getByRole('button', { name: /বাংলা থেকে ইংরেজিতে/i }).first().click();
await page.waitForFunction(
    () => document.body.innerText.includes('পেমেন্ট ও'),
    null,
    { timeout: 5000 },
);
ok('language toggle switches back to Bangla', true);

// ৮. ঢাকার ভেতরে ডেলিভারি ফ্রি, বাইরে ৳১৩০
await division.selectOption('Dhaka');
await district.selectOption('Dhaka');
await page.waitForFunction(
    () => document.body.innerText.includes('ঢাকার ভেতরে ডেলিভারি সম্পূর্ণ ফ্রি'),
    null,
    { timeout: 5000 },
);
ok('delivery is free inside Dhaka', true);

await district.selectOption('Gazipur');
await page.waitForFunction(() => document.body.innerText.includes('৳130'), null, { timeout: 5000 });
ok('delivery charge ৳130 outside Dhaka', true);

// ৯. "practice app" নোট আর নেই
ok(
    'practice-app note removed',
    !(await page.locator('body').innerText()).includes('প্র্যাকটিস অ্যাপ'),
);

// ১০. ভুল মোবাইল নাম্বারে অর্ডার নেওয়া হয় না
await page.locator('input[name="phone"]').fill('12345');
await page.locator('input[name="thana"]').fill('ধানমন্ডি');
await page.locator('input[name="area"]').fill('বাসা ১২, রোড ৫');
await page.locator('input[name="walletNumber"]').fill('01712345678');
await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন|Place order/i }).click();
await page.waitForTimeout(800);
ok(
    'invalid BD phone blocks the order',
    await page.getByText('অর্ডার সফল হয়েছে!').isHidden(),
);
ok(
    'invalid BD phone shows an error toast',
    await page.getByText('একটি সঠিক মোবাইল নাম্বার দিন').isVisible(),
);

// ১১. সঠিক মোবাইল নাম্বারে অর্ডার সফল
await page.locator('input[name="phone"]').fill('01712345678');
await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন|Place order/i }).click();
await page.getByText('অর্ডার সফল হয়েছে!').waitFor({ timeout: 10000 });
ok('order placed successfully', true);

const cartAfter = await page.evaluate(() => window.localStorage.getItem('nextmart-cart'));
ok('cart cleared after order', cartAfter === '[]', `cart=${cartAfter}`);

// ১২. লগইন ছাড়া (গেস্ট) চেকআউটও কাজ করে
const guestContext = await browser.newContext();
const guestPage = await guestContext.newPage();
await guestPage.goto(`${BASE}/products/smartphones-1`, { waitUntil: 'networkidle' });
await guestPage.getByRole('button', { name: /Add to Cart/i }).first().click();
await guestPage.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });

ok(
    'guest sees the login hint',
    await guestPage.getByText('লগইন করলে আপনার নাম ও ইমেইল নিজে থেকেই বসে যাবে।').isVisible(),
);
ok(
    'guest fields stay empty',
    (await guestPage.locator('input[name="email"]').inputValue()) === '',
);

await guestPage.locator('input[name="name"]').fill('গেস্ট ইউজার');
await guestPage.locator('input[name="email"]').fill('guest@example.com');
await guestPage.locator('input[name="phone"]').fill('01812345678');
await guestPage.locator('input[name="thana"]').fill('উত্তরা');
await guestPage.locator('input[name="area"]').fill('বাসা ৫, রোড ২');
await guestPage.locator('input[name="walletNumber"]').fill('01812345678');
await guestPage.getByRole('button', { name: /অর্ডার নিশ্চিত করুন|Place order/i }).click();
await guestPage.getByText('অর্ডার সফল হয়েছে!').waitFor({ timeout: 10000 });
ok('guest can place an order', true);

await guestContext.close();
await browser.close();
