// প্রোফাইল ড্যাশবোর্ড E2ই টেস্ট — অর্ডার সংরক্ষণ, ঠিকানা বুক ও স্ট্যাটাস
// চালান: node scripts/test-profile.mjs   (আগে MongoDB ও সার্ভার চালু থাকতে হবে)
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const email = `profile-${Date.now()}@example.com`;
const password = 'supersecret123';

// ১. সাইন আপ
const signUp = await context.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name: 'করিম উদ্দিন', email, password },
});
ok('sign-up works', signUp.ok(), `status=${signUp.status()}`);

// ২. নেভবারে ভাষা বাটন আছে
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
ok(
    'language toggle is in the navbar',
    await page.getByRole('button', { name: /Switch to English/i }).isVisible(),
);

// ৩. পণ্য কার্টে যোগ করে চেকআউট
await page.goto(`${BASE}/products/smartphones-1`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add to Cart/i }).first().click();
await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });

await page.locator('input[name="phone"]').fill('01712345678');
await page.locator('input[name="thana"]').fill('ধানমন্ডি');
await page.locator('input[name="area"]').fill('বাসা ১২, রোড ৫');
await page.locator('input[name="walletNumber"]').fill('01712345678');

// ৪. জেলা ড্রপডাউনে শুধু বিভাগের জেলাই থাকে
await page.locator('select[name="division"]').selectOption('Chattogram');
const chattogramOnly = await page.locator('select[name="district"] option').allTextContents();
ok(
    'district dropdown only shows the chosen division',
    chattogramOnly.includes("Cox's Bazar") && !chattogramOnly.includes('Dhaka'),
    `count=${chattogramOnly.length}`,
);

// ৫. অর্ডার প্লেস (ঠিকানা সংরক্ষণ চেক করা আছে)
await page.locator('input[name="saveAddress"]').check();
await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন|Place order/i }).click();
await page.getByText(/অর্ডার সফল হয়েছে!|Order placed!/).waitFor({ timeout: 15000 });
ok('order placed', true);

// ৬. প্রোফাইল ড্যাশবোর্ডে অর্ডার ও ঠিকানা দেখা যায়
await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
const profileText = await page.locator('body').innerText();
ok('dashboard shows the order', /NM-/.test(profileText));
// নতুন অর্ডার অ্যাডমিনের অনুমোদনের অপেক্ষায় থাকে, তাই 'pending' স্ট্যাটাস দেখা যায়
ok(
    'dashboard shows an order status',
    /অনুমোদনের অপেক্ষায়|Awaiting approval|প্রসেসিং|Processing/.test(profileText),
);
ok('dashboard shows the saved address', /ধানমন্ডি/.test(profileText));
ok('dashboard shows stats', /মোট অর্ডার|Total orders/.test(profileText));

// ৭. অর্ডারের বিস্তারিত খোলা যায়
await page.getByRole('button', { name: /বিস্তারিত দেখুন|View details/i }).first().click();
ok('order details expand', await page.getByText(/ডেলিভারি ঠিকানা|Deliver to/).first().isVisible());

// ৮. প্রোফাইল থেকে নতুন ঠিকানা যোগ
await page.getByRole('button', { name: /নতুন ঠিকানা যোগ করুন|Add new address/i }).click();
await page.locator('form:has(select[name="division"]) input[name="name"]').fill('অফিস');
await page.locator('form:has(select[name="division"]) input[name="phone"]').fill('01812345678');
await page.locator('form:has(select[name="division"]) input[name="email"]').fill(email);
await page.locator('form:has(select[name="division"]) select[name="division"]').selectOption('Sylhet');
await page.locator('form:has(select[name="division"]) select[name="district"]').selectOption('Sylhet');
await page.locator('form:has(select[name="division"]) input[name="thana"]').fill('জিন্দাবাজার');
await page.locator('form:has(select[name="division"]) input[name="area"]').fill('বাসা ৭, জিন্দাবাজার');
await page.getByRole('button', { name: /ঠিকানা সংরক্ষণ করুন|Save address/i }).click();
await page.waitForTimeout(2500);
const afterAdd = await page.locator('body').innerText();
ok('new address saved', /জিন্দাবাজার/.test(afterAdd));

// ৯. ঠিকানা মুছে ফেলা যায়
const before = await page.locator('body').innerText();
await page.getByRole('button', { name: /মুছে ফেলুন|Delete/i }).first().click();
await page.waitForTimeout(2500);
const after = await page.locator('body').innerText();
ok('address deleted', before.length !== after.length);

// ১০. অর্ডার মুছে ফেলা যায় (ডেলিট অপশন)
const ordersBefore = await page.getByRole('button', { name: /অর্ডার .* মুছে ফেলুন|Delete order/i }).count();
ok('delete option exists on orders', ordersBefore > 0, `count=${ordersBefore}`);

await page.getByRole('button', { name: /অর্ডার .* মুছে ফেলুন|Delete order/i }).first().click();
await page.waitForTimeout(2500);
const ordersAfter = await page.getByRole('button', { name: /অর্ডার .* মুছে ফেলুন|Delete order/i }).count();
ok('order deleted from history', ordersAfter === ordersBefore - 1, `before=${ordersBefore} after=${ordersAfter}`);

await browser.close();
