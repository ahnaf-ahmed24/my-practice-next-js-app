import type { Metadata } from 'next';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import CheckoutHeader from '@/components/CheckoutHeader';
import CheckoutView from '@/components/CheckoutView';
import { auth } from '@/lib/auth';
import { getUserAddresses } from '@/lib/shop';

export const metadata: Metadata = {
    title: 'চেকআউট — পেমেন্ট ও ডেলিভারি — NextMart',
    description:
        'bKash, Nagad, Rocket, ক্যাশ অন ডেলিভারি ও কার্ড পেমেন্ট — ঢাকার ভেতরে ফ্রি ডেলিভারি, ৬৪ জেলায় পৌঁছে দিই।',
};

// চেকআউটের মূল অংশ — সেশন পড়ে সংরক্ষিত ঠিকানা আনে (রানটাইম API, তাই সাসপেন্সের ভেতরে)
const CheckoutContent = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    // লগইন করা ইউজারের সংরক্ষিত ঠিকানা ফর্মে নিজে থেকেই বসে যায়
    const addresses = session ? await getUserAddresses(session.user.id) : [];

    return (
        <CheckoutView
            savedAddresses={addresses.map((item) => ({
                id: item._id?.toHexString() ?? '',
                label: item.label,
                isDefault: item.isDefault,
                createdAt: item.createdAt.toISOString(),
                address: item.address,
            }))}
        />
    );
};

// সাসপেন্স ফলব্যাক — ঠিকানা আসা পর্যন্ত স্কেলেটন
const CheckoutFallback = () => (
    <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
            <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
            <div className="h-72 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
        </div>
        <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 lg:col-span-2 dark:border-slate-700/70 dark:bg-slate-900/60" />
    </div>
);

// চেকআউট পেজ — কার্টের "Confirm order" বাটনে ক্লিক করলে এখানে আসে
const CheckoutPage = () => (
    <div className="relative overflow-hidden">
        {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <CheckoutHeader />

            <Suspense fallback={<CheckoutFallback />}>
                <CheckoutContent />
            </Suspense>
        </div>
    </div>
);

export default CheckoutPage;
