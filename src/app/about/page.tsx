import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About — NextMart',
    description:
        'The story, mission and values behind NextMart — the online store built for fast, fair and joyful shopping.',
};

const stats = [
    { value: '2020', label: 'Founded' },
    { value: '100K+', label: 'Happy Customers' },
    { value: '40+', label: 'Team Members' },
    { value: '12', label: 'Countries Served' },
];

const values = [
    { icon: '💜', title: 'Customer First', desc: 'Every decision starts with one question: does this make shopping better for you?' },
    { icon: '✨', title: 'Quality Always', desc: 'We vet every supplier and hand-inspect every product before it reaches our shelves.' },
    { icon: '⚖️', title: 'Fair Pricing', desc: 'No fake markups, no fake sales. Honest prices, all year round.' },
    { icon: '⚡', title: 'Fast Delivery', desc: 'Our network of local hubs gets most orders to your door within 48 hours.' },
];

const milestones = [
    { year: '2020', title: 'The garage era', desc: 'Three friends, one laptop and a shared belief that online shopping could feel human again.' },
    { year: '2022', title: '100K customers', desc: 'Word of mouth carried us across borders — we shipped our first international orders.' },
    { year: '2024', title: 'Own logistics network', desc: 'We launched regional hubs, cutting average delivery time from 6 days to 2.' },
    { year: '2026', title: 'Where we are today', desc: '10 curated categories, 40+ teammates, and one very big roadmap ahead.' },
];

const AboutPage = () => {
    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                {/* হেডার */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                        🧡 Our Story
                    </span>
                    <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                        Shopping that feels <span className="gradient-text">human</span> again
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                        NextMart started with a simple frustration: great products buried
                        under confusing prices and slow delivery. We built the store we
                        wished existed.
                    </p>
                </div>

                {/* মিশন কার্ড */}
                <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-7 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30">🎯</span>
                        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Our Mission</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            To make premium products accessible to everyone — with honest
                            prices, real reviews, and delivery that never keeps you waiting.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-7 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 text-xl shadow-lg shadow-rose-500/30">🔭</span>
                        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Our Vision</h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            A marketplace where quality, sustainability and great service are
                            the norm — not a premium upgrade.
                        </p>
                    </div>
                </div>

                {/* স্ট্যাটস */}
                <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-4 text-center backdrop-blur sm:px-6 sm:py-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                        >
                            <dt className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {stat.label}
                            </dt>
                            <dd className="gradient-text mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* ভ্যালু */}
                <div className="mt-20">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        What we <span className="gradient-text">stand for</span>
                    </h2>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {values.map((value) => (
                            <div
                                key={value.title}
                                className="group rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                                    {value.icon}
                                </span>
                                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                    {value.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {value.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* টাইমলাইন */}
                <div className="mt-20">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        The journey <span className="gradient-text">so far</span>
                    </h2>
                    <ol className="mx-auto mt-10 max-w-3xl space-y-5">
                        {milestones.map((milestone) => (
                            <li
                                key={milestone.year}
                                className="flex gap-5 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <span className="gradient-text shrink-0 text-2xl font-extrabold tracking-tight">
                                    {milestone.year}
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {milestone.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {milestone.desc}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* CTA */}
                <div className="mt-20 rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Ready to start <span className="gradient-text">shopping</span>?
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        Browse our categories, or reach out — we&apos;d love to hear from you.
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                        >
                            Browse Products →
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/70 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-700 backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
