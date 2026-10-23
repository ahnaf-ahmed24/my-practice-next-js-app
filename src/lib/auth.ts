import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { db } from '@/lib/mongodb';
import { ADMIN_ROLE, SCOPE_HEADER, type SessionScope } from '@/lib/auth-constants';

// Better Auth সেটআপ — ইমেইল + পাসওয়ার্ড দিয়ে লগইন/সাইনআপ
export const auth = betterAuth({
    // নোট: mongodbAdapter-এ `{ client }` পাস করলে ট্রানজেকশন চালু হয়, যা শুধু
    // রেপ্লিকা সেট/Atlas-এ কাজ করে। স্ট্যান্ডঅ্যালোন মঙ্গো (লোকাল) ও Atlas — দুই
    // ক্ষেত্রেই কাজ করায় আমরা ট্রানজেকশন বন্ধ রাখছি। প্রয়োজনে `{ client }` যোগ করুন।
    database: mongodbAdapter(db),
    emailAndPassword: {
        enabled: true,
    },
    // ইমেইল ভেরিফিকেশন — সাইনআপের পর ভেরিফিকেশন লিংক পাঠানো হয়
    emailVerification: {
        sendOnSignUp: true, // সাইনআপে স্বয়ংক্রিয়ভাবে ভেরিফিকেশন ইমেইল পাঠাও
        autoSignInAfterVerification: true, // ভেরিফাই হলে সরাসরি সাইন-ইন
        expiresIn: 60 * 60 * 24, // লিংক ২৪ ঘণ্টা বৈধ
        sendVerificationEmail: async ({ user, url }) => {
            // ইমেইল সার্ভিস (SMTP/Resend) সেট না থাকলে লিংক সার্ভার কনসোলে দেখানো হয় (ডেভ)।
            // প্রোডাকশনে এখানে Resend/SMTP দিয়ে সত্যিকারের ইমেইল পাঠান — নিচের টিপটি দেখুন।
            if (process.env.NODE_ENV !== 'production') {
                console.log(
                    `\n[Email Verification] → ${user.email}\nVerify link: ${url}\n`
                );
            }
            // উদাহরণ (প্রোডাকশন):
            //   await resend.emails.send({ from, to: user.email, subject, html: `<a href="${url}">Verify</a>` });
        },
    },
    // ভেরিফাই না করে সাইন-ইন বন্ধ করতে REQUIRE_EMAIL_VERIFICATION=true সেট করুন।
    // ডিফল্ট false — ইমেইল সার্ভিস ছাড়াও অ্যাপ ব্যবহারযোগ্য থাকে।
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    // প্লাগইন — অ্যাডমিন প্লাগইন আগে (role/banned ফিল্ড যোগ করে), nextCookies সবসময় শেষে
    plugins: [
        // রোল সিস্টেম — 'user' (ডিফল্ট) ও 'admin'
        // role ফিল্ডটি input:false, তাই ক্লায়েন্ট নিজে রোল বসাতে পারে না
        admin({
            defaultRole: 'user',
            adminRoles: ['admin'],
        }),
        // নেক্স্ট জেস কুকি হ্যান্ডলার (প্রথমে যুক্ত করতে হয়)
        nextCookies(),
    ],
    // প্রোডাকশনে BETTER_AUTH_SECRET ও BETTER_AUTH_URL সেট করুন
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    // টেবিল/কালেকশনের নাম (মঙ্গোডিবি কালেকশন)
    user: {
        modelName: 'user',
    },
    session: {
        modelName: 'session',
        expiresIn: 60 * 60 * 24 * 7, // ৭ দিন
        updateAge: 60 * 60 * 24, // প্রতি দিন রিফ্রেশ
        // লগইনের প্যানেল অনুযায়ী সেশনের স্কোপ — 'admin' না 'customer'
        additionalFields: {
            scope: {
                type: 'string',
                required: false,
                defaultValue: 'customer',
                input: false,
            },
        },
    },
    // সেশন তৈরির সময় স্কোপ ঠিক করে — কোন প্যানেল দিয়ে লগইন হলো
    databaseHooks: {
        session: {
            create: {
                before: async (session, ctx) => {
                    const wanted = ctx?.request?.headers?.get(SCOPE_HEADER);
                    let scope: SessionScope = 'customer';

                    // 'admin' স্কোপ শুধু সত্যিকারের অ্যাডমিনকেই দেওয়া হয় —
                    // সাধারণ গ্রাহক কোনোভাবেই নিজেকে অ্যাডমিন বানাতে পারবে না
                    if (wanted === 'admin' && ctx) {
                        const user = await ctx.context.internalAdapter.findUserById(session.userId);
                        if ((user as { role?: string } | null)?.role === ADMIN_ROLE) {
                            scope = 'admin';
                        }
                    }

                    return { data: { ...session, scope } };
                },
            },
        },
    },
    account: {
        modelName: 'account',
    },
    verification: {
        modelName: 'verification',
    },
});

export type Session = typeof auth.$Infer.Session;
