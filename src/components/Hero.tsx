import Link from 'next/link';

const perks = [
    { icon: '🚚', title: 'Fast Delivery', desc: 'Free delivery inside Dhaka, only ৳130 outside — reaching all 64 districts.' },
    { icon: '🔄', title: 'Easy Returns', desc: '30-day hassle-free returns. Changed your mind? No questions asked.' },
    { icon: '🔒', title: 'Secure Payment', desc: 'bKash, Nagad, Rocket, cash on delivery and cards — all secured.' },
];

const stats = [
    { value: '10K+', label: 'Products' },
    { value: '25K+', label: 'Happy Shoppers' },
    { value: '24/7', label: 'Support' },
];

const Hero = () => {
    return (
        <section className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 sm:-top-40 sm:h-[30rem] sm:w-[30rem] rounded-full bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />
            <div className="pointer-events-none absolute -right-16 top-48 h-56 w-56 rounded-full bg-pink-400/20 blur-3xl sm:-right-24 sm:h-72 sm:w-72 dark:bg-pink-500/10" />
            <div className="pointer-events-none absolute -left-16 top-64 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl sm:-left-24 sm:h-72 sm:w-72 dark:bg-cyan-500/10" />

            {/* ভাসমান ইমোজি (শুধু বড় স্ক্রিনে) */}
            <span className="animate-float absolute left-[7%] top-36 hidden text-4xl lg:block">🛍️</span>
            <span className="animate-float-delayed absolute right-[9%] top-44 hidden text-4xl lg:block">🎧</span>
            <span className="animate-float absolute right-[16%] top-[26rem] hidden text-3xl lg:block">⌚</span>

            <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-20 text-center sm:px-6 sm:pt-28">
                {/* নতুন কালেকশন ব্যাজ */}
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    🎉 New Collection 2026
                </span>

                {/* মূল হেডলাইন */}
                <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
                    Shop the <span className="gradient-text">Future</span>,
                    <br />
                    Delivered <span className="gradient-text">Today</span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                    Premium tech, gadgets and everyday essentials — handpicked by experts,
                    fairly priced, and shipped to your door in days, not weeks.
                </p>

                {/* অ্যাকশন বাটন */}
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                    <Link
                        href="#categories"
                        className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                    >
                        Shop Now
                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </Link>

                    <Link
                        href="/learn-more"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/70 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-700 backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                    >
                        Learn More
                    </Link>
                </div>

                {/* ট্রাস্ট রো */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <span className="text-amber-400">★★★★★</span>
                        <span>4.9/5 from 25,000+ shoppers</span>
                    </span>
                    <span className="hidden h-4 w-px bg-slate-300 sm:block dark:bg-slate-700" />
                    <span>✓ Trusted by 100k+ customers</span>
                </div>

                {/* স্ট্যাটস */}
                <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-200/70 bg-white/60 px-6 py-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-indigo-500/10"
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
            </div>

            {/* ফিচার সেকশন */}
            <div id="features" className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
                <div className="grid gap-5 sm:grid-cols-3">
                    {perks.map((perk) => (
                        <div
                            key={perk.title}
                            className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-left shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-indigo-500/10"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                                {perk.icon}
                            </span>
                            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                {perk.title}
                            </h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {perk.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Hero;
