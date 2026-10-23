// অ্যাডমিন প্যানেল ফ্লো E2ই টেস্ট — চলমান ডেভ সার্ভারের HTTP API ব্যবহার করে
// চালান: node scripts/test-admin.mjs   (MongoDB চালু থাকতে হবে)
//
// যা যাচাই করা হয়:
//   ১. অ্যাডমিন প্যানেলের প্রথম রেজিস্ট্রেশন সাথে সাথেই অ্যাডমিন হয়
//   ২. এরপরের রেজিস্ট্রেশন 'pending' থাকে ও অনুমোদন ছাড়া অ্যাডমিন প্যানেলে ঢোকা যায় না
//   ৩. ইনিশিয়াল অ্যাডমিন একমাত্র অনুমোদন দিতে পারেন
//   ৪. অর্ডার অ্যাডমিনের অনুমোদনের অপেক্ষায় 'pending' থাকে
//   ৫. অ্যাডমিন অর্ডার অনুমোদন করলে 'processing' হয় ও ট্র্যাকিং আপডেট যায়
//   ৬. গ্রাহক লাইভ ট্র্যাকিং আপডেট দেখতে পায়
//   ৭. গ্রাহক নিজের কাস্টমার অ্যাকাউন্টের নাম ও ইমেইল দিয়ে অ্যাডমিন আবেদন করতে পারে
//   ৮. ইনিশিয়াল অ্যাডমিন অনুমোদন দিলে সেই গ্রাহক অ্যাডমিন হয়ে যায়
//   ৯. পেন্ডিং অ্যাডমিন আবেদন তুলে নেওয়া যায়; অনুমোদিত অ্যাডমিন পদ ছাড়তে পারেন (প্রাথমিক ছাড়া)
//  ১০. প্রসেসিং/শিপড অর্ডার গ্রাহক আর বাতিল করতে পারে না, পেন্ডিং অর্ডার বাতিল করা যায়
//
// টেস্ট শুরুর আগে থাকা অ্যাডমিনদের ভূমিকা সাময়িকভাবে সরিয়ে দেওয়া হয় (যাতে
// "প্রথম অ্যাডমিন" নিয়মটি পরীক্ষা করা যায়) এবং শেষে আগের অবস্থা ফিরিয়ে আনা হয়।
import { readFileSync } from 'node:fs';
import { MongoClient, ObjectId } from 'mongodb';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const stamp = Date.now();
const password = 'supersecret123';

// টেস্টের অ্যাকাউন্টগুলো
const initialAdmin = { name: 'Initial Admin', email: `test-admin-initial-${stamp}@example.com` };
const secondAdmin = { name: 'Second Admin', email: `test-admin-second-${stamp}@example.com` };
const customer = { name: 'Test Customer', email: `test-admin-customer-${stamp}@example.com` };

const testEmails = [initialAdmin.email, secondAdmin.email, customer.email];

// কুকি সংরক্ষণের জন্য (প্রতি ইউজারের আলাদা কুকি)
const jar = new Map();

const grabCookie = (res, key) => {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookies) {
        if (c.includes('better-auth.session_token')) {
            jar.set(key, c.split(';')[0]);
        }
    }
};

const j = async (path, opts = {}, key = 'default') => {
    const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            Origin: BASE,
            ...(jar.has(key) ? { Cookie: jar.get(key) } : {}),
            ...(opts.headers || {}),
        },
        redirect: 'manual',
    });
    grabCookie(res, key);
    return res;
};

const ok = (label, cond, extra = '') =>
    console.log(`${cond ? '✔' : '✖'} ${label}${extra ? ' — ' + extra : ''}`);

// ===== MongoDB সরাসরি ব্যবহার (টেস্টের সেটআপ ও পরিষ্কার করার জন্য) =====
const readMongoUri = () => {
    try {
        const raw = readFileSync('.env.local', 'utf8');
        const match = raw.match(/MONGODB_URI\s*=\s*"?([^"\r\n]+)"?/);
        return match?.[1]?.trim() ?? null;
    } catch {
        return null;
    }
};

const uri = readMongoUri();
let client = null;
let db = null;

const connectDb = async () => {
    if (!uri) return null;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    return db;
};

const disconnectDb = async () => {
    if (client) await client.close().catch(() => {});
    client = null;
    db = null;
};

// টেস্টের আগের ইউজার ও তাদের তথ্য মুছে ফেলে
const cleanupTestData = async () => {
    if (!db) return;

    const users = await db.collection('user').find({ email: { $in: testEmails } }).toArray();
    const ids = users.map((user) => user._id);
    const hexIds = users.map((user) => String(user._id));

    if (ids.length) {
        await db.collection('user').deleteMany({ _id: { $in: ids } });
        await db.collection('account').deleteMany({ userId: { $in: hexIds } });
        await db.collection('session').deleteMany({ userId: { $in: hexIds } });
        await db.collection('adminRequests').deleteMany({ userId: { $in: hexIds } });
        await db.collection('orders').deleteMany({ userId: { $in: hexIds } });
        await db.collection('addresses').deleteMany({ userId: { $in: hexIds } });
    }

    // যেসব অনুরোধের ইউজার আর নেই — সেগুলোও পরিষ্কার করা হয়
    const allUsers = await db.collection('user').find({}).project({ _id: 1 }).toArray();
    const knownIds = new Set(allUsers.map((user) => String(user._id)));
    const orphans = await db
        .collection('adminRequests')
        .find({})
        .project({ userId: 1 })
        .toArray();
    const orphanHex = orphans
        .map((row) => String(row.userId))
        .filter((userId) => !knownIds.has(userId));
    const orphanObjectIds = orphanHex
        .filter((userId) => ObjectId.isValid(userId))
        .map((userId) => new ObjectId(userId));

    if (orphanHex.length) {
        await db
            .collection('adminRequests')
            .deleteMany({ $or: [{ userId: { $in: orphanHex } }, { userId: { $in: orphanObjectIds } }] });
    }
};

// থাকা অ্যাডমিনদের ভূমিকা সংরক্ষণ করে সাময়িকভাবে সরিয়ে দেয়
const demoteAllAdmins = async () => {
    if (!db) return [];

    const admins = await db.collection('user').find({ role: 'admin' }).toArray();
    const saved = admins.map((admin) => ({ _id: admin._id, role: admin.role }));

    if (admins.length) {
        await db.collection('user').updateMany({ role: 'admin' }, { $set: { role: 'user' } });
    }

    return saved;
};

// সংরক্ষিত ভূমিকা ফিরিয়ে আনে
const restoreAdmins = async (saved) => {
    if (!db) return;

    for (const admin of saved) {
        await db.collection('user').updateOne({ _id: admin._id }, { $set: { role: admin.role } });
    }
};

await connectDb();
await cleanupTestData();

const savedAdmins = await demoteAllAdmins();

// অ্যাডমিন প্যানেলের লগইনের মতো অ্যাডমিন-স্কোপ সেশন তৈরি
const signInAsAdmin = async (email, key) => {
    const response = await j(
        '/api/auth/sign-in/email',
        {
            method: 'POST',
            headers: { 'x-nextmart-scope': 'admin' },
            body: JSON.stringify({ email, password }),
        },
        key,
    );
    return response;
};

try {
    // ===== ১. প্রথম অ্যাডমিন রেজিস্ট্রেশন — সাথে সাথেই অ্যাডমিন =====
    let res = await j(
        '/api/admin/register',
        {
            method: 'POST',
            body: JSON.stringify({ ...initialAdmin, password }),
        },
        'initial',
    );
    let body = await res.json().catch(() => ({}));
    ok(
        'first admin registration becomes an administrator immediately',
        res.status === 200 && body.status === 'active' && body.isInitialAdmin === true,
        `status=${res.status} body=${JSON.stringify(body)}`,
    );

    // ===== ১ক. অ্যাডমিন প্যানেলে লগইন — অ্যাডমিন-স্কোপ সেশন =====
    res = await signInAsAdmin(initialAdmin.email, 'initial');
    ok('admin panel sign-in succeeds', res.status === 200, `status=${res.status}`);

    // ===== ২. প্রথম অ্যাডমিন হিসেবে নিজের অবস্থা =====
    res = await j('/api/admin/me', { method: 'GET' }, 'initial');
    body = await res.json().catch(() => ({}));
    ok(
        'initial admin sees isAdmin + isInitialAdmin',
        res.status === 200 && body.isAdmin === true && body.isInitialAdmin === true,
        `body=${JSON.stringify(body)}`,
    );
    ok(
        'admin panel session has the admin scope',
        body.scope === 'admin',
        `scope=${body.scope}`,
    );

    // ===== ৩. অ্যাডমিন প্যানেল খোলা যায় =====
    res = await j('/admin', { method: 'GET' }, 'initial');
    ok('admin dashboard opens for the initial admin', res.status === 200, `status=${res.status}`);

    // ===== ৪. দ্বিতীয় অ্যাডমিন রেজিস্ট্রেশন — 'pending' =====
    res = await j(
        '/api/admin/register',
        {
            method: 'POST',
            body: JSON.stringify({ ...secondAdmin, password }),
        },
        'second',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'second admin registration waits for approval',
        res.status === 200 && body.status === 'pending' && body.isInitialAdmin === false,
        `status=${res.status} body=${JSON.stringify(body)}`,
    );

    // ===== ৫. দ্বিতীয় অ্যাডমিনের অবস্থা =====
    res = await j('/api/admin/me', { method: 'GET' }, 'second');
    body = await res.json().catch(() => ({}));
    ok(
        'second admin has no access and a pending request',
        res.status === 200 && body.isAdmin === false && body.request?.status === 'pending',
        `body=${JSON.stringify(body)}`,
    );

    // ===== ৬. অনুমোদন ছাড়া অ্যাডমিন প্যানেলে ঢোকা যায় না =====
    res = await j('/admin', { method: 'GET' }, 'second');
    ok('pending admin is redirected away from the dashboard', res.status === 307, `status=${res.status}`);

    res = await j('/api/admin/orders', { method: 'GET' }, 'second');
    ok('pending admin cannot read admin APIs', res.status === 403, `status=${res.status}`);

    // ===== ৭. ইনিশিয়াল অ্যাডমিনের অনুরোধের তালিকা =====
    // (ডেভ ডাটাবেসে অন্যের থাকা পুরনো অনুরোধ থাকতে পারে, তাই নিজের অনুরোধে ফিল্টার)
    res = await j('/api/admin/requests', { method: 'GET' }, 'initial');
    body = await res.json().catch(() => ({}));
    const pendingRequests = (body.requests ?? []).filter(
        (item) => item.status === 'pending' && item.email === secondAdmin.email,
    );
    ok(
        'initial admin sees the pending request',
        res.status === 200 && pendingRequests.length === 1,
        `pending=${pendingRequests.length}`,
    );

    const ownRequest = pendingRequests[0];

    if (!ownRequest) {
        console.log('✖ pending request not found — aborting');
        process.exit(1);
    }

    // ===== ৮. অনুমোদনের আগে দ্বিতীয় অ্যাডমিনের অ্যাক্সেস নেই =====
    res = await j(
        `/api/admin/requests/${ownRequest.id}`,
        { method: 'POST', body: JSON.stringify({ decision: 'approve' }) },
        'second',
    );
    ok('a pending account cannot approve requests', res.status === 403, `status=${res.status}`);

    // ===== ৯. ইনিশিয়াল অ্যাডমিন অনুমোদন দেন =====
    res = await j(
        `/api/admin/requests/${ownRequest.id}`,
        { method: 'POST', body: JSON.stringify({ decision: 'approve', note: 'Verified' }) },
        'initial',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'initial admin approves the request',
        res.status === 200 && body.status === 'approved',
        `body=${JSON.stringify(body)}`,
    );

    // ===== ১০. অনুমোদনের পর দ্বিতীয় অ্যাডমিন =====
    res = await j('/api/admin/me', { method: 'GET' }, 'second');
    body = await res.json().catch(() => ({}));
    ok('approved account is now an administrator', res.status === 200 && body.isAdmin === true, `body=${JSON.stringify(body)}`);

    // অনুমোদনের আগে অ্যাডমিন প্যানেলে ঢোকা যায়নি — এখন অ্যাডমিন-স্কোপে লগইন
    res = await signInAsAdmin(secondAdmin.email, 'second');
    ok('approved admin can sign in to the admin panel', res.status === 200, `status=${res.status}`);

    res = await j('/api/admin/orders', { method: 'GET' }, 'second');
    ok('approved admin can read admin APIs', res.status === 200, `status=${res.status}`);

    // ===== ১০ক. অ্যাডমিন (কিন্তু ইনিশিয়াল নয়) অনুমোদন দিতে পারে না =====
    res = await j(
        `/api/admin/requests/${ownRequest.id}`,
        { method: 'POST', body: JSON.stringify({ decision: 'reject' }) },
        'second',
    );
    ok('a non-initial admin cannot approve requests', res.status === 403, `status=${res.status}`);

    // ===== ১০ক. অ্যাডমিন-স্কোপে কাস্টমার ফিচার পাওয়া যায় না =====
    res = await j('/api/orders', { method: 'GET' }, 'second');
    ok('admin scope session cannot use customer APIs', res.status === 403, `status=${res.status}`);

    res = await j('/api/addresses', { method: 'GET' }, 'second');
    ok('admin scope session cannot read addresses', res.status === 403, `status=${res.status}`);

    res = await j('/cart', { method: 'GET' }, 'second');
    ok('admin scope session is redirected away from the cart', res.status === 307, `status=${res.status}`);

    res = await j('/checkout', { method: 'GET' }, 'second');
    ok('admin scope session is redirected away from checkout', res.status === 307, `status=${res.status}`);

    // ===== ১০খ. অ্যাডমিন কাস্টমার প্যানেলে লগইন করলে অ্যাডমিন ফিচার পাওয়া যায় না =====
    res = await j(
        '/api/auth/sign-in/email',
        {
            method: 'POST',
            headers: { 'x-nextmart-scope': 'customer' },
            body: JSON.stringify({ email: initialAdmin.email, password }),
        },
        'initial-customer',
    );
    ok('admin can sign in through the customer panel', res.status === 200, `status=${res.status}`);

    res = await j('/api/admin/orders', { method: 'GET' }, 'initial-customer');
    ok('customer scope session cannot read admin APIs', res.status === 403, `status=${res.status}`);

    res = await j('/admin', { method: 'GET' }, 'initial-customer');
    ok('customer scope session is redirected away from the admin panel', res.status === 307, `status=${res.status}`);

    res = await j('/api/orders', { method: 'GET' }, 'initial-customer');
    ok('customer scope session can use customer APIs', res.status === 200, `status=${res.status}`);

    // ইনিশিয়াল অ্যাডমিন হিসেবে ফিরে যাই (অনুমোদনের কাজ বাকি আছে)
    await signInAsAdmin(initialAdmin.email, 'initial');

    // ===== ১১. গ্রাহক হিসেবে সাইনআপ ও অর্ডার =====
    res = await j(
        '/api/auth/sign-up/email',
        {
            method: 'POST',
            body: JSON.stringify({ ...customer, password }),
        },
        'customer',
    );
    ok('customer signs up', res.status === 200, `status=${res.status}`);

    // ===== ১১ক. গ্রাহক অ্যাডমিন প্যানেলে লগইন করতে পারে না =====
    res = await j(
        '/api/auth/sign-in/email',
        {
            method: 'POST',
            headers: { 'x-nextmart-scope': 'admin' },
            body: JSON.stringify({ email: customer.email, password }),
        },
        'customer',
    );
    ok('customer sign-in succeeds', res.status === 200, `status=${res.status}`);

    res = await j('/api/admin/me', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'customer never receives the admin scope',
        res.status === 200 && body.isAdmin === false && body.scope === 'customer',
        `body=${JSON.stringify(body)}`,
    );

    res = await j('/api/admin/orders', { method: 'GET' }, 'customer');
    ok('customer cannot read admin APIs', res.status === 403, `status=${res.status}`);

    res = await j('/admin', { method: 'GET' }, 'customer');
    ok('customer is redirected away from the admin panel', res.status === 307, `status=${res.status}`);

    const orderId = `NM-${stamp}`;
    res = await j(
        '/api/orders',
        {
            method: 'POST',
            body: JSON.stringify({
                orderId,
                items: [{ id: 'p1', name: 'Test Product', price: 1299, image: '/products/test.png' }],
                subtotal: 1299,
                deliveryCharge: 130,
                paymentMethod: 'Cash on Delivery',
                estimatedDelivery: '2–4 working days',
                address: {
                    name: customer.name,
                    phone: '01700000000',
                    email: customer.email,
                    division: 'Dhaka',
                    district: 'Dhaka',
                    thana: 'Dhanmondi',
                    area: 'Road 5, Block C',
                },
            }),
        },
        'customer',
    );
    ok('customer places an order', res.status === 201, `status=${res.status}`);

    // ===== ১২. নতুন অর্ডার 'pending' থাকে =====
    res = await j('/api/orders', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    const customerOrder = (body.orders ?? []).find((order) => order.id === orderId);
    ok(
        'new order waits for admin approval',
        customerOrder?.status === 'pending',
        `status=${customerOrder?.status}`,
    );

    // ===== ১৩. অ্যাডমিন অর্ডার অনুমোদন করে =====
    res = await j(
        `/api/admin/orders/${orderId}`,
        { method: 'PATCH', body: JSON.stringify({ status: 'processing', note: 'Payment verified' }) },
        'initial',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'admin approves the order for processing',
        res.status === 200 && body.status === 'processing',
        `status=${res.status} body=${JSON.stringify(body)}`,
    );

    // ===== ১৪. লাইভ শিপমেন্ট ট্র্যাকিং আপডেট =====
    res = await j(
        `/api/admin/orders/${orderId}`,
        {
            method: 'PATCH',
            body: JSON.stringify({ status: 'shipped', note: 'Left Dhaka warehouse', location: 'Dhaka' }),
        },
        'initial',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'admin can push a shipment tracking update',
        res.status === 200 && body.status === 'shipped' && body.tracking?.length === 2,
        `events=${body.tracking?.length}`,
    );

    // ===== ১৫. গ্রাহক লাইভ আপডেট দেখতে পায় =====
    res = await j('/api/orders', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    const trackedOrder = (body.orders ?? []).find((order) => order.id === orderId);
    ok(
        'customer sees the tracking updates',
        trackedOrder?.status === 'shipped' && trackedOrder?.tracking?.length === 2,
        `status=${trackedOrder?.status} events=${trackedOrder?.tracking?.length}`,
    );

    // ===== ১৬. একই ঠিকানায় আবার অর্ডার — ঠিকানা বুকে নতুন এন্ট্রি নয়, আপডেট =====
    // চেকআউটে অর্ডারের পর ঠিকানা আলাদাভাবে PUT করে সংরক্ষণ হয়
    const shippingAddress = {
        name: customer.name,
        phone: '01700000000',
        email: customer.email,
        division: 'Dhaka',
        district: 'Dhaka',
        thana: 'Dhanmondi',
        area: 'Road 5, Block C',
    };

    res = await j(
        '/api/addresses',
        { method: 'PUT', body: JSON.stringify({ label: 'Home', address: shippingAddress }) },
        'customer',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'first checkout save creates the address entry',
        res.status === 200 && body.updated === false,
        `status=${res.status} updated=${body.updated}`,
    );

    res = await j('/api/addresses', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'address book holds one entry after the first order',
        res.status === 200 && body.addresses?.length === 1,
        `addresses=${body.addresses?.length}`,
    );

    const secondOrderId = `NM-${stamp}-B`;
    res = await j(
        '/api/orders',
        {
            method: 'POST',
            body: JSON.stringify({
                orderId: secondOrderId,
                items: [{ id: 'p1', name: 'Test Product', price: 1299, image: '/products/test.png' }],
                subtotal: 1299,
                deliveryCharge: 130,
                paymentMethod: 'Cash on Delivery',
                estimatedDelivery: '2–4 working days',
                address: shippingAddress,
            }),
        },
        'customer',
    );
    ok('customer places a second order', res.status === 201, `status=${res.status}`);

    // একই ঠিকানা দিয়ে আবার অর্ডার — ঠিকানাটি আপডেট হওয়ার কথা
    res = await j(
        '/api/addresses',
        { method: 'PUT', body: JSON.stringify({ label: 'Home', address: shippingAddress }) },
        'customer',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'second checkout save updates the existing entry',
        res.status === 200 && body.updated === true,
        `status=${res.status} updated=${body.updated}`,
    );

    res = await j('/api/addresses', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'same address updates the existing entry instead of adding one',
        body.addresses?.length === 1,
        `addresses=${body.addresses?.length}`,
    );

    // ===== ১৭. অ্যাডমিন প্রোফাইলে কন্ট্রোল প্যানেল, গ্রাহকের প্রোফাইলে সাধারণ ড্যাশবোর্ড =====
    res = await j('/profile', { method: 'GET' }, 'initial');
    let profileHtml = await res.text();
    ok(
        'admin profile shows the control panel',
        res.status === 200 && profileHtml.includes('NextMart Control Center'),
        `status=${res.status}`,
    );

    res = await j('/profile', { method: 'GET' }, 'customer');
    profileHtml = await res.text();
    ok(
        'customer profile shows the standard dashboard',
        res.status === 200 && !profileHtml.includes('NextMart Control Center'),
        `status=${res.status}`,
    );

    // ===== ১৮. অ্যাডমিন অর্ডার মুছে ফেলতে পারে =====
    res = await j(`/api/admin/orders/${secondOrderId}`, { method: 'DELETE' }, 'initial');
    body = await res.json().catch(() => ({}));
    ok('admin deletes an order', res.status === 200 && body.deleted === true, `status=${res.status}`);

    res = await j('/api/admin/orders', { method: 'GET' }, 'initial');
    body = await res.json().catch(() => ({}));
    ok(
        'deleted order is gone from the admin list',
        !(body.orders ?? []).some((order) => order.id === secondOrderId),
    );

    res = await j('/api/orders', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'deleted order is gone from the customer list',
        !(body.orders ?? []).some((order) => order.id === secondOrderId),
    );

    // ===== ১৯. গ্রাহক অ্যাডমিন API ব্যবহার করতে পারে না =====
    res = await j(`/api/admin/orders/${orderId}`, { method: 'DELETE' }, 'customer');
    ok('customer cannot delete orders through the admin API', res.status === 403, `status=${res.status}`);

    // ===== ২০. গ্রাহক নিজের কাস্টমার অ্যাকাউন্ট দিয়ে অ্যাডমিন আবেদন =====
    res = await j('/api/admin/requests', { method: 'POST' }, 'guest');
    ok('a guest cannot submit an administrator request', res.status === 401, `status=${res.status}`);

    res = await j('/api/admin/requests', { method: 'POST' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'customer requests administrator access with their account',
        res.status === 200 && body.status === 'pending',
        `status=${res.status} body=${JSON.stringify(body)}`,
    );

    // অনুরোধের নাম ও ইমেইল সেশন (কাস্টমার অ্যাকাউন্ট) থেকেই যায়
    res = await j('/api/admin/requests', { method: 'GET' }, 'initial');
    body = await res.json().catch(() => ({}));
    let customerRequest = (body.requests ?? []).find((item) => item.email === customer.email);
    ok(
        'the request holds the customer account name and email',
        customerRequest?.name === customer.name && customerRequest?.status === 'pending',
        `request=${JSON.stringify(customerRequest)}`,
    );

    // একই সময়ে একাধিক অপেক্ষমাণ অনুরোধ রাখা যায় না
    res = await j('/api/admin/requests', { method: 'POST' }, 'customer');
    ok('a second pending request is refused', res.status === 409, `status=${res.status}`);

    // আবেদন করলেই অ্যাডমিন অধিকার পাওয়া যায় না — অনুমোদনের অপেক্ষায় থাকে
    res = await j('/api/admin/me', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'requesting access grants no admin rights before approval',
        res.status === 200 && body.isAdmin === false && body.request?.status === 'pending',
        `body=${JSON.stringify(body)}`,
    );

    // গ্রাহকের প্রোফাইলে আবেদনের কার্ড দেখা যায় (সার্ভার রেন্ডার — ডিফল্ট ভাষা বাংলা)
    res = await j('/profile', { method: 'GET' }, 'customer');
    profileHtml = await res.text();
    ok(
        'customer profile shows the administrator registration card',
        res.status === 200 && profileHtml.includes('অ্যাডমিন রেজিস্ট্রেশন'),
        `status=${res.status}`,
    );

    // অ্যাডমিন-স্কোপ সেশন ও ইতিমধ্যে অ্যাডমিন আবেদন করতে পারে না
    res = await j('/api/admin/requests', { method: 'POST' }, 'initial');
    ok('an admin-scope session cannot submit a customer request', res.status === 403, `status=${res.status}`);

    res = await j('/api/admin/requests', { method: 'POST' }, 'initial-customer');
    ok('an existing administrator cannot request access again', res.status === 409, `status=${res.status}`);

    // ===== ২০ক. গ্রাহক অপেক্ষমাণ আবেদন তুলে নেয়, তারপর আবার আবেদন করে =====
    if (!customerRequest) {
        console.log('✖ customer administrator request not found — aborting');
        process.exit(1);
    }

    // অন্য ইউজার আমার অনুরোধ তুলে নিতে পারে না
    res = await j(
        `/api/admin/requests/${customerRequest.id}`,
        { method: 'DELETE' },
        'initial-customer',
    );
    ok('another user cannot withdraw the request', res.status === 404, `status=${res.status}`);

    // গ্রাহক নিজের অপেক্ষমাণ অনুরোধ তুলে নেয়
    res = await j(`/api/admin/requests/${customerRequest.id}`, { method: 'DELETE' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'customer withdraws their pending administrator request',
        res.status === 200 && body.deleted === true,
        `body=${JSON.stringify(body)}`,
    );

    res = await j('/api/admin/me', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok('the withdrawn request is gone', body.request === null, `body=${JSON.stringify(body)}`);

    // তুলে নেওয়ার পর আবার আবেদন করা যায়
    res = await j('/api/admin/requests', { method: 'POST' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'customer can apply again after withdrawing',
        res.status === 200 && body.status === 'pending',
        `body=${JSON.stringify(body)}`,
    );

    // অনুমোদনের জন্য এখন নতুন অনুরোধটিই বলবৎ
    res = await j('/api/admin/requests', { method: 'GET' }, 'initial');
    body = await res.json().catch(() => ({}));
    customerRequest = (body.requests ?? []).find(
        (item) => item.email === customer.email && item.status === 'pending',
    );

    if (!customerRequest) {
        console.log('✖ re-applied administrator request not found — aborting');
        process.exit(1);
    }

    // ===== ২১. ইনিশিয়াল অ্যাডমিন গ্রাহকের আবেদন অনুমোদন করেন =====
    res = await j(
        `/api/admin/requests/${customerRequest.id}`,
        { method: 'POST', body: JSON.stringify({ decision: 'approve', note: 'Welcome aboard' }) },
        'initial',
    );
    body = await res.json().catch(() => ({}));
    ok(
        'initial admin approves the customer request',
        res.status === 200 && body.status === 'approved',
        `body=${JSON.stringify(body)}`,
    );

    // অনুমোদনের পর গ্রাহক অ্যাডমিন হয়ে যায়
    res = await j('/api/admin/me', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok('the approved customer is now an administrator', res.status === 200 && body.isAdmin === true, `body=${JSON.stringify(body)}`);

    // এখন সে অ্যাডমিন প্যানেলে লগইন করে অ্যাডমিন ফিচার ব্যবহার করতে পারে
    res = await signInAsAdmin(customer.email, 'customer-admin');
    ok('approved customer can sign in to the admin panel', res.status === 200, `status=${res.status}`);

    res = await j('/api/admin/orders', { method: 'GET' }, 'customer-admin');
    ok('approved customer can use admin APIs', res.status === 200, `status=${res.status}`);

    // ===== ২২. প্রসেসিং/শিপড অর্ডার আর বাতিল করা যায় না =====
    res = await j(`/api/orders/${orderId}`, { method: 'DELETE' }, 'customer');
    ok('a shipped order cannot be cancelled', res.status === 409, `status=${res.status}`);

    // পেন্ডিং অর্ডার বাতিল করা যায়
    const cancelOrderId = `NM-${stamp}-C`;
    res = await j(
        '/api/orders',
        {
            method: 'POST',
            body: JSON.stringify({
                orderId: cancelOrderId,
                items: [{ id: 'p1', name: 'Test Product', price: 999, image: '/products/test.png' }],
                subtotal: 999,
                deliveryCharge: 130,
                paymentMethod: 'Cash on Delivery',
                estimatedDelivery: '2–4 working days',
                address: shippingAddress,
            }),
        },
        'customer',
    );
    ok('customer places a third order', res.status === 201, `status=${res.status}`);

    res = await j(`/api/orders/${cancelOrderId}`, { method: 'DELETE' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'a pending order can still be cancelled',
        res.status === 200 && body.deleted === true,
        `body=${JSON.stringify(body)}`,
    );

    res = await j('/api/orders', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'the cancelled order disappears from the list',
        !(body.orders ?? []).some((order) => order.id === cancelOrderId),
    );

    // ===== ২৩. অ্যাডমিন পদ ছাড়া =====
    // প্রাথমিক (ইনিশিয়াল) অ্যাডমিন পদ ছাড়তে পারেন না — তিনিই একমাত্র অনুমোদনদাতা
    res = await j('/api/admin/step-down', { method: 'POST' }, 'initial');
    ok('the initial administrator cannot step down', res.status === 403, `status=${res.status}`);

    // অনুমোদিত গ্রাহক (কাস্টমার স্কোপ) পদ ছাড়তে পারেন
    res = await j('/api/admin/step-down', { method: 'POST' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'an approved administrator can step down',
        res.status === 200 && body.status === 'stepped-down',
        `body=${JSON.stringify(body)}`,
    );

    res = await j('/api/admin/me', { method: 'GET' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok('a stepped-down user is a customer again', res.status === 200 && body.isAdmin === false, `body=${JSON.stringify(body)}`);

    // অ্যাডমিন প্যানেলের (অ্যাডমিন স্কোপ) সেশনও এখন কাজ করে না
    res = await j('/api/admin/orders', { method: 'GET' }, 'customer-admin');
    ok('a stepped-down admin loses admin APIs', res.status === 403, `status=${res.status}`);

    // ইতিমধ্যে গ্রাহক — আবার পদ ছাড়তে পারে না
    res = await j('/api/admin/step-down', { method: 'POST' }, 'customer');
    ok('a non-admin cannot step down', res.status === 409, `status=${res.status}`);

    // পুরো চক্র আবার — সে আবার অ্যাডমিন আবেদন করতে পারেন
    res = await j('/api/admin/requests', { method: 'POST' }, 'customer');
    body = await res.json().catch(() => ({}));
    ok(
        'a stepped-down admin can apply again',
        res.status === 200 && body.status === 'pending',
        `body=${JSON.stringify(body)}`,
    );
} finally {
    // ===== পরিষ্কার: আগের অ্যাডমিনদের ভূমিকা ফেরত ও টেস্ট ড্যাটা মুছে ফেলা =====
    await restoreAdmins(savedAdmins);
    await cleanupTestData();
    await disconnectDb();
}

console.log('\nAll admin flow checks completed.');
