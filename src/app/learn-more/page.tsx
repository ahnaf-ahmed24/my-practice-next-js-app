import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Learn More — NextMart',
    description:
        'How NextMart works: ordering, shipping, returns, warranty and everything else you should know before you shop.',
};

const steps = [
    { icon: '🔍', title: 'Browse', desc: 'Explore six curated categories with honest specs and real reviews.' },
    { icon: '⚖️', title: 'Compare', desc: 'Side-by-side comparisons help you pick the right product, not the priciest.' },
    { icon: '🛒', title: 'Order', desc: 'One-page checkout with bKash, Nagad, Rocket, cash on delivery and cards — no hidden fees.' },
    { icon: '📦', title: 'Enjoy', desc: 'Track your parcel live and get most orders within 48 hours.' },
];

const features = [
    { icon: '🚚', title: 'Fast Delivery', desc: 'Free delivery inside Dhaka, only ৳130 outside — reaching all 64 districts of Bangladesh.' },
    { icon: '🔄', title: 'Easy Returns', desc: '30-day hassle-free returns. Changed your mind? No questions asked.' },
    { icon: '🔒', title: 'Secure Payment', desc: 'bKash, Nagad, Rocket, cash on delivery, bank transfer and cards — all secured.' },
    { icon: '🎧', title: '24/7 Support', desc: 'Real humans, round the clock — chat, email or phone, your call.' },
];

const policies = [
    { icon: '📦', title: 'Shipping', desc: 'Orders placed before 4 PM ship the same day. Inside Dhaka delivery takes 1–2 working days, outside Dhaka 2–4 working days. Delivery is free inside Dhaka and ৳130 outside.' },
    { icon: '↩️', title: 'Returns & Refunds', desc: 'Return anything within 30 days in original condition for a full refund. Refunds land in your account within 3–5 business days of us receiving the item.' },
    { icon: '🛡️', title: 'Warranty', desc: 'Every electronics purchase includes a 12-month minimum warranty. Extended coverage can be added at checkout.' },
    { icon: '🔐', title: 'Privacy', desc: 'We only collect what we need to deliver your order, never sell your data, and you can request deletion of your account at any time.' },
];

const faqs = [
    { q: 'Do I need an account to order?', a: 'No — guest checkout is available. But an account lets you track orders, save your address and reorder in one tap.' },
    { q: 'Which payment methods do you accept?', a: 'bKash, Nagad, Rocket, cash on delivery, debit/credit cards and bank transfer (BEFTN). Mobile wallet payments are confirmed within minutes.' },
    { q: 'How do I track my order?', a: 'Every order gets a live tracking link by email and SMS. You can also find it under your account at any time.' },
    { q: 'Can I cancel an order after placing it?', a: 'Yes, as long as it has not shipped. Open the order and hit Cancel, or contact support and we will handle it for you.' },
    { q: 'Do you deliver outside Dhaka?', a: 'Yes — we deliver to all 64 districts. Delivery is free inside Dhaka and ৳130 outside, with an estimate shown at checkout.' },
];

const LearnMorePage = () => {
    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                {/* হেডার */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                        🚀 How It Works
                    </span>
                    <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                        Everything you need to <span className="gradient-text">know</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                        From browsing to unboxing — here&apos;s exactly how shopping with
                        NextMart works, and what we promise at every step.
                    </p>
                </div>

                {/* স্টেপস */}
                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.title}
                            className="group relative rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60"
                        >
                            <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-200 dark:text-slate-800">
                                {index + 1}
                            </span>
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                                {step.icon}
                            </span>
                            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                {step.title}
                            </h2>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ফিচার */}
                <div className="mt-20">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        Why shop with <span className="gradient-text">us</span>
                    </h2>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30">
                                    {feature.icon}
                                </span>
                                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* পলিসি */}
                <div className="mt-20">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        The <span className="gradient-text">fine print</span>, made simple
                    </h2>
                    <div className="mt-10 grid gap-5 sm:grid-cols-2">
                        {policies.map((policy) => (
                            <div
                                key={policy.title}
                                className="flex gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-lg shadow-lg shadow-indigo-500/30">
                                    {policy.icon}
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        {policy.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {policy.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mx-auto mt-20 max-w-3xl">
                    <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        Frequently asked <span className="gradient-text">questions</span>
                    </h2>
                    <div className="mt-10 space-y-4">
                        {faqs.map((faq) => (
                            <details
                                key={faq.q}
                                className="group rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur open:shadow-lg open:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <summary className="cursor-pointer list-none text-base font-bold text-slate-900 marker:content-none dark:text-white">
                                    {faq.q}
                                    <span className="float-right text-indigo-500 transition-transform duration-300 group-open:rotate-45">＋</span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-20 rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Still have <span className="gradient-text">questions</span>?
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        Our support team is standing by — we usually reply within one business day.
                    </p>
                    <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                        >
                            Contact Support →
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/70 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-700 backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearnMorePage;
