'use client';

import { useState } from 'react';

// নিউজলেটার সাবস্ক্রিপশন ফর্ম — preventDefault দিয়ে পেজ রিলোড ঠেকানো হয়েছে
const NewsletterForm = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // ফর্ম সাবমিটে পেজ রিলোড হবে না
        if (!email.trim()) return;
        setSubscribed(true);
        setEmail('');
    };

    if (subscribed) {
        return (
            <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/70 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                🎉 You&apos;re subscribed! Deals are on the way.
                <button
                    type="button"
                    onClick={() => setSubscribed(false)}
                    className="mt-2 block text-xs font-bold underline underline-offset-2 hover:opacity-70"
                >
                    Use another email
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="w-full min-w-0 rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
            />
            <button
                type="submit"
                className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:opacity-90 active:scale-95"
            >
                Join
            </button>
        </form>
    );
};

export default NewsletterForm;
