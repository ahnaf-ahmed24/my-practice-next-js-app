import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { ADMIN_ROLE } from '@/lib/auth-constants';
import { getSessionScope } from '@/lib/session-scope';

// শুধু কাস্টমার প্যানেলে ব্যবহার করা যায় এমন রুট
// (অ্যাডমিন প্যানেলে লগইন করা সেশনে এগুলো বন্ধ থাকে)
const CUSTOMER_PATHS = ['/categories', '/cart', '/checkout'];

// এগুলোতে লগইন লাগে (গেস্ট ক্যাটালগ দেখতে পারে না)
const LOGIN_REQUIRED_PATHS = ['/categories'];

// লগইন ছাড়া যাওয়া যাবে না — এসব রুট সুরক্ষিত
const PROTECTED_PATHS = ['/profile'];

// অ্যাডমিন প্যানেলের রুট
const ADMIN_PATH = '/admin';
const ADMIN_LOGIN_PATH = '/admin/login';

// অ্যাডমিনের প্রোফাইল = কন্ট্রোল প্যানেল
const ADMIN_PROFILE_PATH = '/profile';

const matches = (pathname: string, paths: string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

// প্রক্সি (মিডলওয়্যার) — রিকোয়েস্ট রেন্ডার হওয়ার আগে লগইন যাচাই করে
export async function proxy(request: NextRequest) {
    const { pathname, search } = request.nextUrl;

    // ===== অ্যাডমিন প্যানেল =====
    if (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`)) {
        const session = await auth.api.getSession({ headers: request.headers });

        // লগইন না করা — অ্যাডমিন লগইন পেজে পাঠাও
        if (!session) {
            if (pathname === ADMIN_LOGIN_PATH) return NextResponse.next();

            const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        // অ্যাডমিন রোল না থাকলে অথবা কাস্টমার প্যানেলে লগইন করা থাকলে অ্যাডমিন প্যানেলে ঢোকা যাবে না
        if (session.user.role !== ADMIN_ROLE || getSessionScope(session) !== 'admin') {
            if (pathname === ADMIN_LOGIN_PATH) return NextResponse.next();
            return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
        }

        // অ্যাডমিন লগইন পেজে ঢুকলে সরাসরি কন্ট্রোল প্যানেলে (/profile) পাঠাও
        if (pathname === ADMIN_LOGIN_PATH) {
            return NextResponse.redirect(new URL(ADMIN_PROFILE_PATH, request.url));
        }

        return NextResponse.next();
    }

    // ===== শুধু কাস্টমার ফিচার =====
    if (matches(pathname, CUSTOMER_PATHS)) {
        const session = await auth.api.getSession({ headers: request.headers });

        // অ্যাডমিন প্যানেলে লগইন করা আছে — কাস্টমার ফিচার পাওয়া যাবে না
        if (session && getSessionScope(session) !== 'customer') {
            return NextResponse.redirect(new URL(ADMIN_PROFILE_PATH, request.url));
        }

        // ক্যাটালগ দেখতে লগইন লাগে (গেস্ট কার্ট ও চেকআউট করতে পারে)
        if (!session && matches(pathname, LOGIN_REQUIRED_PATHS)) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    // ===== লগইন লাগে এমন রুট =====
    if (matches(pathname, PROTECTED_PATHS)) {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('next', `${pathname}${search}`);
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    // স্ট্যাটিক ফাইল ও API বাদ দিয়ে শুধু প্রোটেক্টেড পেজ
    matcher: [
        '/categories/:path*',
        '/profile/:path*',
        '/admin/:path*',
        '/cart',
        '/checkout',
    ],
};
