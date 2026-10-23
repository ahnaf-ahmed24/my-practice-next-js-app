import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ADMIN_ROLE, countAdmins, findUserByEmail, setUserRole } from '@/lib/admin';
import { createAdminRequest } from '@/lib/admin-requests';

// অ্যাডমিন প্যানেলের রেজিস্ট্রেশন
//
// নিয়ম:
//  - বর্তমানে কোনো অ্যাডমিন না থাকলে (প্রথম অ্যাডমিন) — অ্যাকাউন্টটি সাথে সাথেই অ্যাডমিন
//  - এরপরের সব অ্যাডমিন রেজিস্ট্রেশন — ইনিশিয়াল (প্রথম) অ্যাডমিনের অনুমোদনের অপেক্ষায়
export async function POST(request: Request) {
    const body = await request.json().catch(() => null);

    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');

    if (name.length < 2) {
        return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json(
            { error: 'Password must be at least 8 characters long.' },
            { status: 400 },
        );
    }

    // আগে থেকেই অ্যাকাউন্ট আছে কি না দেখি — ইমেইল ভেরিফিকেশন চালু থাকলে
    // better-auth ডুপ্লিকেট ইমেইলে সাধারণ "সফল" রেসপন্স দেয়, তাই আগে দেখা জরুরি
    const existing = await findUserByEmail(email);
    if (existing) {
        return NextResponse.json(
            { error: 'An account with this email already exists.' },
            { status: 409 },
        );
    }

    // প্রথম অ্যাডমিন কে নির্ধারণ — সেশনে কোনো অ্যাডমিন নেই মানে এটাই প্রথম
    const isInitialAdmin = (await countAdmins()) === 0;

    // অ্যাকাউন্টটি তৈরি হয় (পাসওয়ার্ড হ্যাশ, ভেরিফিকেশন ইমেইল, সেশন — সব better-auth করে)
    try {
        await auth.api.signUpEmail({ body: { name, email, password } });
    } catch (error) {
        const status = (error as { statusCode?: number })?.statusCode;
        if (status === 422) {
            return NextResponse.json(
                { error: 'An account with this email already exists.' },
                { status: 409 },
            );
        }
        return NextResponse.json(
            { error: 'Could not create the administrator account. Please try again.' },
            { status: 500 },
        );
    }

    // অ্যাকাউন্টটি সত্যিই তৈরি হয়েছে কি না যাচাই (ডুপ্লিকেট ইমেইলে ভুয়া রেসপন্স আসতে পারে)
    const created = await findUserByEmail(email);
    if (!created) {
        return NextResponse.json(
            { error: 'An account with this email already exists.' },
            { status: 409 },
        );
    }

    const userId = created._id.toHexString();

    if (isInitialAdmin) {
        // প্রথম অ্যাডমিন — সাথে সাথেই পূর্ণ অ্যাডমিন
        const updated = await setUserRole(userId, ADMIN_ROLE);
        if (!updated) {
            return NextResponse.json(
                { error: 'Could not promote the account to administrator.' },
                { status: 500 },
            );
        }

        return NextResponse.json({ status: 'active', isInitialAdmin: true });
    }

    // এরপরের অ্যাডমিন — ইনিশিয়াল অ্যাডমিনের অনুমোদনের জন্য অপেক্ষায়
    await createAdminRequest({ userId, name, email });

    return NextResponse.json({ status: 'pending', isInitialAdmin: false });
}
