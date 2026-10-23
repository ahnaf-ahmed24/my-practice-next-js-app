import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
    title: 'Contact — NextMart',
    description:
        'Questions about an order, a product or a partnership? Get in touch with the NextMart team.',
};

const channels = [
    { icon: '✉️', title: 'Email', value: 'hello@nextmart.dev', desc: 'Best for order and product questions.' },
    { icon: '📞', title: 'Phone', value: '+1 (555) 010-2026', desc: 'Mon–Fri, 9:00 AM – 6:00 PM.' },
    { icon: '💬', title: 'Live Chat', value: 'In-app, 24/7', desc: 'Fastest replies for urgent issues.' },
    { icon: '📍', title: 'Office', value: '88 Startup Ave, Dhaka', desc: 'Visits by appointment only.' },
];

const faqs = [
    { q: 'How fast will I get a reply?', a: 'Our team responds to most messages within one business day — often much sooner.' },
    { q: 'Can I change my order after placing it?', a: 'Yes, if it has not shipped yet. Send us your order number and we will sort it out.' },
    { q: 'Do you offer business or wholesale pricing?', a: 'We do! Mention “Partnership” in the subject and our B2B team will follow up.' },
];

const ContactPage = () => {
    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
                {/* হেডার */}
                <div className="text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                        📣 We&apos;re Here to Help
                    </span>
                    <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                        Get in <span className="gradient-text">Touch</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                        Questions about an order, a product, or working together?
                        Drop us a message — a real human will read it.
                    </p>
                </div>

                {/* যোগাযোগ চ্যানেল */}
                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {channels.map((channel) => (
                        <div
                            key={channel.title}
                            className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-lg shadow-indigo-500/30">
                                {channel.icon}
                            </span>
                            <h2 className="mt-4 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                {channel.title}
                            </h2>
                            <p className="mt-1 break-words text-base font-bold text-slate-900 dark:text-white">
                                {channel.value}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {channel.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ফর্ম + সাইডবার */}
                <div className="mt-14 grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Send us a <span className="gradient-text">message</span>
                        </h2>
                        <div className="mt-5">
                            <ContactForm />
                        </div>
                    </div>

                    {/* FAQ সাইডবার */}
                    <aside>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Quick <span className="gradient-text">answers</span>
                        </h2>
                        <div className="mt-5 space-y-4">
                            {faqs.map((faq) => (
                                <details
                                    key={faq.q}
                                    className="group rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur open:shadow-lg open:shadow-indigo-500/10 dark:border-slate-700/70 dark:bg-slate-900/60"
                                >
                                    <summary className="cursor-pointer list-none text-sm font-bold text-slate-900 marker:content-none dark:text-white">
                                        {faq.q}
                                        <span className="float-right text-indigo-500 transition-transform duration-300 group-open:rotate-45">＋</span>
                                    </summary>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                        {faq.a}
                                    </p>
                                </details>
                            ))}
                        </div>

                        <div className="mt-6 rounded-2xl border border-indigo-200/70 bg-indigo-50/70 p-5 dark:border-indigo-800/70 dark:bg-indigo-950/40">
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                Looking for shipping, returns or warranty details?
                            </p>
                            <Link
                                href="/learn-more"
                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition-transform duration-300 hover:translate-x-0.5 dark:text-indigo-300"
                            >
                                Visit Learn More →
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
