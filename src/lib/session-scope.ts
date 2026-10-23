// সেশনের স্কোপ — কোন লগইন প্যানেল দিয়ে ঢোকা হয়েছে সেটা সেশনে সংরক্ষিত থাকে
// 'admin' = অ্যাডমিন প্যানেল · 'customer' = কাস্টমার প্যানেল
//
// স্কোপ শুধু প্রবেশাধিকার ঠিক করে — আসল অনুমতি সবসময় রোল দিয়ে যাচাই হয়।

import { CUSTOMER_ROLE, type SessionScope } from '@/lib/auth-constants';

type ScopeCarrier = { session?: unknown } | null | undefined;

// সেশনের স্কোপ — ফিল্ড না থাকলে 'customer' (পুরোনো সেশনের জন্য নিরাপদ ডিফল্ট)
export const getSessionScope = (session: ScopeCarrier): SessionScope => {
    const scope = (session?.session as { scope?: string } | undefined)?.scope;
    return scope === 'admin' ? 'admin' : 'customer';
};

// অ্যাডমিন স্কোপে আছে কি না
export const isAdminScope = (session: ScopeCarrier) =>
    getSessionScope(session) === 'admin';

// কাস্টমার স্কোপে আছে কি না
export const isCustomerScope = (session: ScopeCarrier) =>
    getSessionScope(session) === 'customer';

export { CUSTOMER_ROLE };
export type { SessionScope };
