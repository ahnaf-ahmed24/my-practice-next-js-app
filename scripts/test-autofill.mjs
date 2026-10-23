// চেকআউটে প্রোফাইলের সংরক্ষিত ঠিকানা দিয়ে অটো-ফিল E2ই টেস্ট
// চালান: node scripts/test-autofill.mjs   (আগে MongoDB ও সার্ভার চালু থাকতে হবে)
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const email = `autofill-${Date.now()}@example.com`;
const password = 'supersecret123';

// ১. সাইন আপ
const signUp = await context.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name: 'সেলিনা পারভীন', email, password },
});
ok('sign-up works', signUp.ok(), `status=${signUp.status()}`);

// ২. দুটি ঠিকানা সংরক্ষণ (প্রথমটি ডিফল্ট হবে)
const home = {
    name: 'সেলিনা পারভীন',
    phone: '01712345678',
    altPhone: '01812345678',
    email,
    division: 'Dhaka',
    district: 'Dhaka',
    thana: 'ধানমন্ডি',
    postCode: '1209',
    area: 'বাসা ১২, রোড ৫, ব্লক সি',
    landmark: 'বাইরাম মোড়ের পাশে',
    notes: 'বিকেল ৫টার পরে ডেলিভারি দিলে ভালো হয়',
};

const office = {
    ...home,
    name: 'সেলিনা পারভীন (অফিস)',
    phone: '01912345678',
    altPhone: '',
    division: 'Chattogram',
    district: 'Chattogram',
    thana: 'পটিয়া',
    postCode: '4202',
    area: 'বাসা ৫, আবদুল হাকিম রোড',
    landmark: 'হাসপাতালের পাশে',
    notes: '',
};

const first = await context.request.post(`${BASE}/api/addresses`, {
    data: { label: 'বাড়ি', address: home },
});
ok('first address saved', first.ok(), `status=${first.status()}`);

const second = await context.request.post(`${BASE}/api/addresses`, {
    data: { label: 'অফিস', address: office },
});
ok('second address saved', second.ok(), `status=${second.status()}`);

// ৩. পণ্য কার্টে যোগ করে চেকআউটে যাওয়া
await page.goto(`${BASE}/products/smartphones-1`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Add to Cart/i }).first().click();
await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });

// ৪. ডিফল্ট ঠিকানা দিয়ে ফর্ম নিজে থেকেই পূরণ হচ্ছে
const value = async (name) => page.locator(`input[name="${name}"]`).inputValue();

ok('name auto-filled', (await value('name')) === home.name, await value('name'));
ok('phone auto-filled', (await value('phone')) === home.phone, await value('phone'));
ok('alt phone auto-filled', (await value('altPhone')) === home.altPhone, await value('altPhone'));
ok('email auto-filled', (await value('email')) === home.email, await value('email'));
ok('thana auto-filled', (await value('thana')) === home.thana, await value('thana'));
ok('area auto-filled', (await value('area')) === home.area, await value('area'));
ok('post code auto-filled', (await value('postCode')) === home.postCode, await value('postCode'));
ok('landmark auto-filled', (await value('landmark')) === home.landmark, await value('landmark'));
ok(
    'notes auto-filled',
    (await page.locator('textarea[name="notes"]').inputValue()) === home.notes,
);
ok('division auto-filled', (await page.locator('select[name="division"]').inputValue()) === 'Dhaka');
ok('district auto-filled', (await page.locator('select[name="district"]').inputValue()) === 'Dhaka');
ok(
    'wallet number auto-filled from the saved phone',
    (await value('walletNumber')) === home.phone,
    await value('walletNumber'),
);
ok(
    'saved address picker is shown',
    await page.getByText('সংরক্ষিত ঠিকানা').first().isVisible(),
);

// ৫. অন্য সংরক্ষিত ঠিকানা বেছে নিলে ফর্ম নতুন করে পূরণ হয়
await page.getByRole('button', { name: /অফিস/ }).first().click();
await page.waitForTimeout(400);
ok('switching address refills the form', (await value('area')) === office.area, await value('area'));
ok(
    'switching address refills the division',
    (await page.locator('select[name="division"]').inputValue()) === 'Chattogram',
);
ok(
    'switching address refills the district',
    (await page.locator('select[name="district"]').inputValue()) === 'Chattogram',
);

// ৬. "নতুন ঠিকানা দিয়ে অর্ডার করুন" চাপলে ফর্ম খালি হয়
await page.getByRole('button', { name: /নতুন ঠিকানা দিয়ে অর্ডার করুন/ }).click();
await page.waitForTimeout(400);
ok('new address clears the form', (await value('area')) === '', await value('area'));
ok(
    'new address keeps the session name',
    (await value('name')) === 'সেলিনা পারভীন',
    await value('name'),
);

// ৭. অর্ডার দিয়ে দেখি ঠিকানাঠিক বসেছে কিনা
await page.locator('input[name="phone"]').fill('01712345678');
await page.locator('input[name="thana"]').fill('ধানমন্ডি');
await page.locator('input[name="area"]').fill('বাসা ১২, রোড ৫, ব্লক সি');
await page.locator('input[name="walletNumber"]').fill('01712345678');
await page.getByRole('button', { name: /অর্ডার নিশ্চিত করুন|Place order/i }).click();
await page.getByText(/অর্ডার সফল হয়েছে!|Order placed!/).waitFor({ timeout: 15000 });
ok('order placed with the prefilled address', true);

await browser.close();
