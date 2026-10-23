# NextMart — Shop the Future

A responsive e-commerce practice app built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Better Auth** and **MongoDB**.

**NextMart — Shop the Future** is built for Bangladeshi customers: ৳ (Taka) pricing, bKash / Nagad / Rocket / Cash on Delivery payments, all 8 divisions & 64 districts, BD mobile validation, delivery charges (free inside Dhaka, ৳130 outside) and a Bangla ⇄ English language switch.

## Features

| Area | Details |
| --- | --- |
| **Storefront** | Home, 6 categories → subcategories → product pages, search-friendly cards, ratings, discounts |
| **Cart** | `localStorage`-backed cart, add/remove/clear, live totals in ৳ |
| **Checkout** | BD payment methods (bKash, Nagad, Rocket, COD, Card, BEFTN), division → district address form, delivery charge by district, mobile-wallet/card/bank fields |
| **Auto-fill** | Logged-in users get their name, email and saved addresses filled in automatically |
| **Account** | Sign up / log in (Better Auth + MongoDB), profile photo upload to Atlas, dashboard with order history, order status timeline and an address book |
| **Two logins** | `/login` — customer panel (sign in / sign up) · `/admin/login` — administrator panel (sign in / register) |
| **Exclusive modes** | The panel you sign in through decides what you can use — admin panel = admin features only, customer panel = customer features only |
| **Role-aware profile** | `/profile` shows the control panel for administrators and the standard dashboard for customers (`/admin` redirects to `/profile`) |
| **Admin panel** | Order approval, order status control, live shipment tracking, administrator approvals, order deletion |
| **i18n** | Bangla / English switch (navbar), saved in `localStorage` |
| **Responsive** | Mobile-first layout, works from 320 px up; 40 px+ tap targets, no horizontal scroll |

## Admin panel

`/admin/login` is a separate panel from the customer login at `/login`.

**Roles.** The `admin` plugin of Better Auth adds a `role` field to the user model
(`user` by default, `admin` for administrators). The field is not writable by the
client, so nobody can promote themselves.

**Registration rules.**

1. The **first** account registered through `/admin/login` becomes an administrator
   immediately — it is the *initial administrator*.
2. Every **later** registration creates a normal account and an *administrator
   request* (`adminRequests` collection) with `status: 'pending'`. That account
   cannot open the admin panel.
3. Only the **initial administrator** can approve or reject a request. Once
   approved the user's role becomes `admin` and they can sign in to the panel.

**Two exclusive login modes.** The panel a session was created through is stored
on the session record (`session.scope`, set by the `session.create.before` hook
in `src/lib/auth.ts`):

| Signed in via | Session scope | Can use | Cannot use |
| --- | --- | --- | --- |
| `/admin/login` | `admin` | Control panel, order approvals, tracking, admin approvals | Cart, checkout, own orders, saved addresses |
| `/login` | `customer` | Cart, checkout, own orders, address book, account settings | `/admin/*`, every `/api/admin/*` route |

- The scope is only ever granted to a real administrator — the hook looks the
  user's role up on the server, so a customer can never obtain the `admin`
  scope by asking for it.
- A customer who tries the admin panel is signed out again and told that the
  account has no administrator access.
- An administrator who signs in through the customer panel gets the full
  customer experience (and only that) — and vice versa. The scope lives on the
  session, so switching modes means signing in again through the other panel.
- `src/proxy.ts` redirects the pages, and every API route re-checks the scope
  on the server (`requireAdmin()` / `requireCustomer()` in `src/lib/admin.ts`).

**Order approval.** New orders are stored with `status: 'pending'`. An
administrator has to press **Approve & start processing** before the order moves
on to `processing` → `shipped` → `delivered`. Orders created before this feature
keep their old behaviour (status derived from the order age).

**Live shipment tracking.** Every status change or tracking note an
administrator sends is appended to `order.tracking` as a tracking event
(`status`, `note`, `location`, `createdAt`, `createdBy`). The admin panel polls
`/api/admin/orders` every 8 s and the customer's profile dashboard polls
`/api/orders` every 10 s, so tracking updates show up without a refresh.

**Deleting orders.** Every order card has a *Delete order* button (with a
confirmation step) that works for any status — All orders, Awaiting approval,
Processing, Shipped, Delivered and Cancelled. The order disappears from the
admin list, from the filter counts and from the customer's order history
(`DELETE /api/admin/orders/[id]`, admin only).

**Profile = control panel.** `/profile` checks the session role: an
administrator gets the control panel (orders, approvals, tracking), a customer
gets the standard dashboard with their orders, stats and address book.
`/admin` is kept as an alias and redirects to `/profile`.

**Saved addresses are updated, not duplicated.** When an order is placed the
checkout saves the delivery address to the profile (`PUT /api/addresses`). If
the same address — same phone number and district — is already in the address
book, that entry is **updated in place** (label and default flag untouched)
instead of adding a new one, so ordering repeatedly never fills the address
book with duplicates. A genuinely different address still creates a new entry.

**Protection.** `src/proxy.ts` blocks `/admin/*` for guests and for signed-in
users without the `admin` role, and every `/api/admin/*` route re-checks the
session and the role on the server — the proxy is only a fast first check.


## Getting started

```bash
npm install
cp .env.example .env.local   # তারপর ভ্যারিয়েবলগুলো পূরণ করুন
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas বা লোকাল MongoDB কানেকশন স্ট্রিং |
| `BETTER_AUTH_SECRET` | Better Auth সিক্রেট — `npx @better-auth/cli secret` দিয়ে বানান |
| `BETTER_AUTH_URL` | সাইটের URL (প্রোডাকশনে Vercel URL) |
| `NEXT_PUBLIC_APP_URL` | ক্লায়েন্ট সাইড বেজ URL — বিল্ড টাইমে বেক হয় |
| `REQUIRE_EMAIL_VERIFICATION` | `true` করলে ভেরিফাই ছাড়া লগইন বন্ধ (ডিফল্ট `false`) |

## Scripts

```bash
npm run dev        # ডেভ সার্ভার
npm run build      # প্রোডাকশন বিল্ড
npm run start      # প্রোডাকশন সার্ভার
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

### Asset scripts

```bash
node scripts/generate-favicon.mjs  # favicon.ico (16/32/48/64) + icon.svg তৈরি
node scripts/generate-data.mjs      # public/data.json পুনরায় তৈরি
```

### End-to-end tests

Playwright-ভিত্তিক ইটিই টেস্ট (ডেভ সার্ভার চালু ও MongoDB কানেক্টেড থাকতে হবে):

```bash
node scripts/test-auth.mjs       # অথ ফ্লো
node scripts/test-checkout.mjs   # চেকআউট ফ্লো
node scripts/test-profile.mjs    # প্রোফাইল ড্যাশবোর্ড (অর্ডার ও ঠিকানা মুছে ফেলা সহ)
node scripts/test-autofill.mjs   # সংরক্ষিত ঠিকানা অটো-ফিল
node scripts/test-admin.mjs      # অ্যাডমিন প্যানেল (রোল, অনুমোদন, লাইভ ট্র্যাকিং)
node scripts/test-responsive.mjs # ৬টি ভিউপোর্টে রেসপন্সিভ চেক
```

`test-responsive.mjs` প্রতিটি পেজে ৩২০px থেকে ১৪৪০px পর্যন্ত হরাইজনাল স্ক্রল থাকে কি না দেখে এবং ট্যাপ টার্গেটের আকার যাচাই করে।

`test-admin.mjs` টেস্ট শুরুর আগে থাকা অ্যাডমিনদের ভূমিকা সাময়িকভাবে সরিয়ে "প্রথম অ্যাডমিন" নিয়মটি পরীক্ষা করে এবং শেষে আগের অবস্থা ফিরিয়ে আনে।
```

---

## Deploy on Vercel

The app is Vercel-ready — no custom server or `vercel.json` is needed (Vercel detects Next.js automatically). Node **20.9+** is required (`engines` is set in `package.json`).

### 1. Push to Git

```bash
git add .
git commit -m "NextMart — responsive + Vercel ready"
git push
```

Make sure these are **committed** (they are needed by the build):

- `public/data.json` — the product dataset imported by `src/lib/data.ts`
- `public/products/` — product images
- `package-lock.json`

### 2. Import the project

Vercel dashboard → **Add New → Project** → import the repo. The framework preset, build command (`npm run build`) and output directory are detected automatically.

### 3. Set the environment variables

Project → **Settings → Environment Variables** → add all four values for **Production** (and **Preview** if you want previews to work):

```
MONGODB_URI            = mongodb+srv://...   (Atlas)
BETTER_AUTH_SECRET     = (random long string)
BETTER_AUTH_URL        = https://your-app.vercel.app
NEXT_PUBLIC_APP_URL    = https://your-app.vercel.app
```

> `NEXT_PUBLIC_*` variables are inlined at **build time** — after changing them, redeploy the project (Deployments → ⋯ → Redeploy).

### 4. MongoDB Atlas network access

Vercel runs on dynamic IPs, so in Atlas → **Network Access** allow either your Atlas region IPs or `0.0.0.0/0` (simplest for a practice app). The driver is already marked `serverExternalPackages: ["mongodb"]` in `next.config.ts`, so the driver never ships to the browser.

### 5. Deploy

Press **Deploy**. When it finishes:

- Set `BETTER_AUTH_URL` + `NEXT_PUBLIC_APP_URL` to the real domain if they differ, then redeploy
- Test sign-up, the checkout and the profile dashboard on the live URL

### Notes & limits

- **Email verification** currently only logs the link to the server console (no SMTP configured). Wire up Resend/SMTP in `src/lib/auth.ts` for real emails.
- **Payments are simulated** — no gateway is called; orders are stored in MongoDB (`orders` + `addresses` collections).
- **Order status** is controlled by the admin panel (`pending` → `processing` → `shipped` → `delivered`). Orders that were created before this feature keep the old behaviour — their status is derived from the order age.
- The `proxy.ts` middleware protects `/profile`, `/categories/*` and `/admin/*`, and keeps the admin panel and the customer pages apart — logged-out visitors are redirected to `/login?next=…` (or `/admin/login?next=…`).
- Guests can still browse the cart and check out without an account — only `/categories` and `/profile` require a login.
- The **first** administrator has to register through `/admin/login` — there is no seeded account. If that account is deleted, the next administrator becomes the initial one.
- Administrator registrations are open to anyone, but only the initial administrator can approve them, so a registration alone never grants access.
- Live updates use polling (8 s in the admin panel, 10 s on the customer dashboard) — no websocket or change-stream setup is needed.
- Order numbers are stored with a 24 character limit (`src/app/api/orders/route.ts`), so keep generated ids short.

