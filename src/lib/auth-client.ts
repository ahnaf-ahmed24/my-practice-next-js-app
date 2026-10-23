'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

// ক্লায়েন্ট-সাইড অথ ক্লায়েন্ট — লগইন, সাইনআপ, সেশন, আপডেট ইত্যাদি
// adminClient প্লাগইনটি সার্ভারের admin প্লাগইনের সাথে যুক্ত — এতে সেশনে
// ইউজারের `role` ফিল্ডের টাইপ ঠিক থাকে
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    plugins: [adminClient()],
});
