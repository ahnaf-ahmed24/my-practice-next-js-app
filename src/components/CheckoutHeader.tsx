'use client';

import Link from 'next/link';
import { useTranslations } from '@/components/LanguageProvider';

// চেকআউট পেজের হেডার — ব্রেডক্রাম্ব ও টাইটেল
const CheckoutHeader = () => {
    const t = useTranslations();

    return (
        <>
            {/* ব্রেডক্রাম্ব */}
            <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-slate-500 dark:text-slate-400"
            >
                <Link href="/" className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                    Home
                </Link>
                <span>/</span>
                <Link href="/cart" className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                    {t('checkout.breadcrumbCart')}
                </Link>
                <span>/</span>
                <span className="font-bold text-slate-900 dark:text-white">
                    {t('checkout.breadcrumbCheckout')}
                </span>
            </nav>

            <div className="mt-8 mb-8 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                    {t('checkout.badge')}
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                    {t('checkout.titleLead')}
                    <span className="gradient-text">{t('checkout.titleAccent')}</span>
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t('checkout.subtitle')}
                </p>
            </div>
        </>
    );
};

export default CheckoutHeader;
