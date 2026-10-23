'use client';

import { useLanguage } from '@/components/LanguageProvider';

// ভাষা বাটন — চাপলে বাংলা <-> ইংরেজি
const LanguageToggle = ({ className = '' }: { className?: string }) => {
    const { language, toggleLanguage } = useLanguage();
    const isBangla = language === 'bn';

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            aria-label={isBangla ? 'Switch to English' : 'বাংলা থেকে ইংরেজিতে পরিবর্তন করুন'}
            className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/70 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-300 ${className}`}
        >
            <span aria-hidden>🌐</span>
            {isBangla ? 'English' : 'বাংলা'}
        </button>
    );
};

export default LanguageToggle;
