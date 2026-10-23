'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '@/lib/i18n';

// ভাষা localStorage-এ থাকে — রিফ্রেশ করলেও পছন্দটি থাকে
const STORAGE_KEY = 'nextmart-language';

// সার্ভার রেন্ডারে ডিফল্ট ভাষা (localStorage থাকে না)
const DEFAULT_LANGUAGE: Language = 'bn';

// স্ন্যাপশটের রেফারেন্স স্থির রাখা হয় — নইলে useSyncExternalStore লুপে পড়ে
let cachedRaw: string | null = null;
let cachedLanguage: Language = DEFAULT_LANGUAGE;

const isLanguage = (value: string): value is Language => value === 'bn' || value === 'en';

const readLanguage = (): Language => {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE;
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedLanguage = isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
    }
    return cachedLanguage;
};

const writeLanguage = (language: Language) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // প্রাইভেট মোড/ফুল স্টোরেজ — ব্যর্থ হলেও অ্যাপ চলতে থাকে
    }
    window.dispatchEvent(new Event('language-changed'));
};

const subscribe = (onChange: () => void) => {
    window.addEventListener('storage', onChange);
    window.addEventListener('language-changed', onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener('language-changed', onChange);
    };
};

const getServerSnapshot = () => DEFAULT_LANGUAGE;

type LanguageContextValue = {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ভাষা শেয়ার করে — সব জায়গায় একই ভাষা চলে
export const useLanguage = (): LanguageContextValue => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a <LanguageProvider>.');
    }
    return context;
};

// অনুবাদ ফাংশন — {key} প্লেসহোল্ডার বসায়
export const useTranslations = () => {
    const { language } = useLanguage();

    return useCallback(
        (key: TranslationKey, vars?: Record<string, string | number>) => {
            let value: string = translations[language][key] ?? translations.bn[key] ?? key;

            if (vars) {
                for (const [name, replacement] of Object.entries(vars)) {
                    value = value.replaceAll(`{${name}}`, String(replacement));
                }
            }

            return value;
        },
        [language],
    );
};

const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // localStorage-ই একমাত্র সত্য — সার্ভার/ক্লায়েন্ট দুই জায়গায় নিরাপদ
    const language = useSyncExternalStore(subscribe, readLanguage, getServerSnapshot);

    const setLanguage = useCallback((next: Language) => writeLanguage(next), []);

    const toggleLanguage = useCallback(
        () => writeLanguage(readLanguage() === 'bn' ? 'en' : 'bn'),
        [],
    );

    const value = useMemo(
        () => ({ language, setLanguage, toggleLanguage }),
        [language, setLanguage, toggleLanguage],
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageProvider;
