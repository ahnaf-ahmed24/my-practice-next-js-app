// অথ ফ্লো ই2ই টেস্ট — চলমান ডেভ সার্ভারের HTTP API ব্যবহার করে
// চালান: node scripts/test-auth.mjs   (MongoDB চালু থাকতে হবে)
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const email = `test-${Date.now()}@example.com`;
const password = 'supersecret123';

// কুকি সংরক্ষণের জন্য
let cookie = '';
const grabCookie = (res) => {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookies) {
        if (c.includes('better-auth.session_token')) {
            cookie = c.split(';')[0];
        }
    }
};

const j = async (path, opts = {}) => {
    const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            Origin: BASE,
            ...(cookie ? { Cookie: cookie } : {}),
            ...(opts.headers || {}),
        },
        redirect: 'manual',
    });
    grabCookie(res);
    return res;
};

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

// ১. সাইন আপ
let res = await j('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({ name: 'Test User', email, password }),
});
let body = await res.json().catch(() => ({}));
const signedUp = res.status === 200 && !!cookie;
ok('sign-up creates session cookie', signedUp, `status=${res.status}`);

// ২. লগইন ছাড়া প্রোটেক্টেড রুট রিডাইরেক্ট (কুকি ছাড়া)
const noCookie = await fetch(`${BASE}/categories/fashion`, { redirect: 'manual' });
ok('protected route redirects when logged out', noCookie.status === 307, `status=${noCookie.status}`);

// ৩. সাইন আপের কুকি দিয়ে প্রোটেক্টেড রুট খোলে
res = await j('/categories/fashion', { method: 'GET' });
ok('protected route opens when logged in', res.status === 200, `status=${res.status}`);

// ৪. /profile খোলে
res = await j('/profile', { method: 'GET' });
ok('profile page opens when logged in', res.status === 200, `status=${res.status}`);

// ৫. সেশন পড়া যায়
res = await j('/api/auth/get-session', { method: 'GET' });
body = await res.json().catch(() => ({}));
const sessionOk = !!body?.user && body.user.email === email;
ok('get-session returns user', sessionOk, `email=${body?.user?.email}`);

// ৬. নাম আপডেট (ইমেইল নয়)
res = await j('/api/auth/update-user', {
    method: 'POST',
    body: JSON.stringify({ name: 'Updated Name' }),
});
const updated = res.status === 200;
ok('update-user changes name', updated, `status=${res.status}`);

// ৭. আপডেট প্রযোজ্য হয়েছে কিনা যাচাই
res = await j('/api/auth/get-session', { method: 'GET' });
body = await res.json().catch(() => ({}));
ok('name is now "Updated Name"', body?.user?.name === 'Updated Name', `name=${body?.user?.name}`);
ok('email unchanged after update', body?.user?.email === email, `email=${body?.user?.email}`);

// ৮. সাইন আউট
res = await j('/api/auth/sign-out', { method: 'POST', body: JSON.stringify({}) });
ok('sign-out succeeds', res.status === 200, `status=${res.status}`);

// ৯. সাইন আউটের পর আবার রিডাইরেক্ট
res = await j('/categories/fashion', { method: 'GET' });
ok('protected route redirects after sign-out', res.status === 307, `status=${res.status}`);

// ১০. ভুল পাসওয়ার্ডে লগইন ব্যর্থ
const badLogin = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email, password: 'wrong-password' }),
});
ok('wrong password is rejected', badLogin.status >= 400, `status=${badLogin.status}`);

// ১১. সঠিক পাসওয়ার্ডে লগইন সফল
const goodLogin = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email, password }),
});
let loginCookie = '';
for (const c of goodLogin.headers.getSetCookie?.() ?? []) {
    if (c.includes('better-auth.session_token')) loginCookie = c.split(';')[0];
}
ok('correct password signs in', goodLogin.status === 200 && !!loginCookie, `status=${goodLogin.status}`);

console.log(`\nTest user: ${email}`);
