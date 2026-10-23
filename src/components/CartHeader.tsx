'use client';

import { useTranslations } from '@/components/LanguageProvider';

// কার্ট পেজের হেডার — ব্যাজ ও টাইটেল
const CartHeader = () => {
    const t = useTranslations();

    return (
        <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                {t('cart.badge')}
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {t('cart.titleLead')}
                <span className="gradient-text">{t('cart.titleAccent')}</span>
            </h2>
        </div>
    );
};

export default CartHeader;
