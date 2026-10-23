import Link from 'next/link';
import { categories } from '@/lib/data';
import NewsletterForm from '@/components/NewsletterForm';

const quickLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/learn-more', label: 'Learn More' },
    { href: '/contact', label: 'Contact' },
];

const socials = [
    { icon: '𝕏', label: 'X (Twitter)' },
    { icon: '📷', label: 'Instagram' },
    { icon: '📘', label: 'Facebook' },
    { icon: '▶️', label: 'YouTube' },
];

const Footer = () => {
    return (
        <footer className="relative border-t border-slate-200/60 bg-white/60 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60">
            {/* উপরের সূক্ষ্ম গ্রেডিয়েন্ট লাইন */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
                {/* মোবাইলে ২ কলাম, বড় স্ক্রিনে ৪ কলাম */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-10 lg:grid-cols-4">
                    {/* ব্র্যান্ড ও সোশ্যাল */}
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="group inline-flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-lg shadow-md shadow-indigo-500/30 transition-transform duration-300 group-hover:rotate-6">
                                🛍️
                            </span>
                            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Next<span className="gradient-text">Mart</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Premium tech, gadgets and everyday essentials — handpicked,
                            fairly priced, and shipped fast.
                        </p>
                        <ul className="mt-5 flex items-center gap-2">
                            {socials.map((social) => (
                                <li key={social.label}>
                                    <span
                                        aria-label={social.label}
                                        title={social.label}
                                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-indigo-500"
                                    >
                                        {social.icon}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* দ্রুত লিংক */}
                    <nav aria-label="Footer quick links">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            Quick Links
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="inline-block py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* ক্যাটাগরি */}
                    <nav aria-label="Product categories">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            Categories
                        </h3>
                        <ul className="mt-4 space-y-2.5">
                            {categories.map((category) => (
                                <li key={category.name}>
                                    <Link
                                        href={`/categories/${category.slug}`}
                                        className="inline-block py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                                    >
                                        <span className="mr-1.5">{category.icon}</span>
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* যোগাযোগ ও নিউজলেটার */}
                    <div className="col-span-2 lg:col-span-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-white">
                            Stay in the loop
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            Subscribe for deals, launches and restock alerts.
                        </p>
                        <div className="mt-4">
                            <NewsletterForm />
                        </div>
                        <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li>✉️ hello@nextmart.dev</li>
                            <li>📞 +1 (555) 010-2026</li>
                            <li>📍 88 Startup Ave, Dhaka</li>
                        </ul>
                    </div>
                </div>

                {/* নিচের বার */}
                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/60 pt-6 text-sm text-slate-500 sm:flex-row dark:border-slate-700/60 dark:text-slate-400">
                    <p>© 2026 NextMart. All rights reserved.</p>
                    <p className="flex items-center gap-4">
                        <Link href="/learn-more" className="inline-block py-2 transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                            Shipping &amp; Returns
                        </Link>
                        <span className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                        <Link href="/contact" className="inline-block py-2 transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                            Help Center
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
