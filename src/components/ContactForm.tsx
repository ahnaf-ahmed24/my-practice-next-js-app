'use client';

import { useState } from 'react';

const subjects = ['Order issue', 'Product question', 'Returns & refunds', 'Partnership', 'Other'];

// যোগাযোগ ফর্ম — সাবমিট করলে পেজ রিলোড না করে সফল মেসেজ দেখায়
const ContactForm = () => {
    const [sent, setSent] = useState(false);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // পেজ রিলোড বন্ধ
        setSent(true);
    };

    if (sent) {
        return (
            <div className="flex flex-col items-center rounded-3xl border border-emerald-300/60 bg-white/70 p-10 text-center backdrop-blur dark:border-emerald-800/60 dark:bg-slate-900/60">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl shadow-lg shadow-emerald-500/30">
                    ✅
                </span>
                <h3 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">
                    Message sent!
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Thanks for reaching out. Our support team usually replies within
                    one business day.
                </p>
                <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:opacity-90 active:scale-95"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60"
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Name</span>
                    <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Email</span>
                    <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                    />
                </label>
            </div>

            <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Subject</span>
                <select
                    defaultValue={subjects[0]}
                    className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
                >
                    {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                            {subject}
                        </option>
                    ))}
                </select>
            </label>

            <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Message</span>
                <textarea
                    required
                    rows={5}
                    placeholder="Tell us how we can help…"
                    className="mt-2 w-full resize-y rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                />
            </label>

            <button
                type="submit"
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95 sm:w-auto"
            >
                Send Message →
            </button>
        </form>
    );
};

export default ContactForm;
