'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { CategoryNavItem } from '@/lib/data';

// নেভবারের ঠিক নিচের ক্যাটাগরি বার — প্রতিটি ক্যাটাগরির নিচে সাবক্যাটাগরির ড্রপডাউন
//
//  - ডেস্কটপ (lg+): হোভার বা ছোট ক্যারেট বাটনে ক্লিক করলে ড্রপডাউন খোলে
//  - মোবাইল: বারটি পাশে স্ক্রল করা যায়, ট্যাপ করলে সরাসরি ক্যাটাগরি পেজে যায়
//    (ড্রপডাউন স্ক্রল কন্টেইনারে ক্লিপ হয়ে যেত, তাই মোবাইলে দেখানো হয় না)
const CategoryBar = ({ categories }: { categories: CategoryNavItem[] }) => {
    const pathname = usePathname();
    const [openSlug, setOpenSlug] = useState<string | null>(null);
    const [lastPathname, setLastPathname] = useState(pathname);
    const navRef = useRef<HTMLElement>(null);

    // রুট বদলালে ড্রপডাউন বন্ধ (render-এই স্টেট মিলিয়ে নেওয়া — React-এর প্রান্তিক প্যাটার্ন)
    if (lastPathname !== pathname) {
        setLastPathname(pathname);
        setOpenSlug(null);
    }

    // বাইরে ক্লিক বা Escape চাপলে ড্রপডাউন বন্ধ
    useEffect(() => {
        if (!openSlug) return;

        const onPointerDown = (event: PointerEvent) => {
            if (!navRef.current?.contains(event.target as Node)) setOpenSlug(null);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpenSlug(null);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [openSlug]);

    return (
        <nav
            ref={navRef}
            aria-label="Product categories"
            className="relative border-t border-slate-200/60 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60"
        >
            <ul className="mx-auto flex h-11 max-w-6xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden lg:overflow-visible">
                {categories.map((category, index) => {
                    const href = `/categories/${category.slug}`;
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);
                    const isOpen = openSlug === category.slug;
                    const isLast = index === categories.length - 1;

                    return (
                        <li
                            key={category.slug}
                            className="relative shrink-0"
                            onMouseEnter={() => setOpenSlug(category.slug)}
                            onMouseLeave={() => setOpenSlug((prev) => (prev === category.slug ? null : prev))}
                        >
                            <div className="flex items-center">
                                <Link
                                    href={href}
                                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-300 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950 dark:to-slate-800'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span aria-hidden>{category.icon}</span>
                                    <span className={isActive ? 'gradient-text' : ''}>{category.name}</span>
                                </Link>

                                {/* ক্যারেট — ড্রপডাউন টগল (শুধু ডেস্কটপ) */}
                                <button
                                    type="button"
                                    aria-expanded={isOpen}
                                    aria-label={`Show ${category.name} subcategories`}
                                    onClick={() => setOpenSlug(isOpen ? null : category.slug)}
                                    className="hidden h-6 w-6 items-center justify-center rounded-full text-[10px] text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:flex dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                            </div>

                            {/* সাবক্যাটাগরি ড্রপডাউন (শুধু ডেস্কটপ) */}
                            {isOpen && (
                                <div
                                    className={`absolute top-full hidden pt-2 lg:block ${isLast ? 'right-0' : 'left-0'}`}
                                >
                                    <div className="w-64 rounded-2xl border border-slate-200/70 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95">
                                        <Link
                                            href={href}
                                            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800"
                                        >
                                            <span>All {category.name}</span>
                                            <span aria-hidden className="text-slate-400">→</span>
                                        </Link>

                                        <div className="mx-3 my-1 h-px bg-slate-200/70 dark:bg-slate-700/70" />

                                        <ul className="space-y-0.5">
                                            {category.subcategories.map((sub) => {
                                                const subHref = `${href}/${sub.slug}`;
                                                const isSubActive = pathname === subHref;

                                                return (
                                                    <li key={sub.slug}>
                                                        <Link
                                                            href={subHref}
                                                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                                                                isSubActive
                                                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                                            }`}
                                                        >
                                                            <span aria-hidden>{sub.icon}</span>
                                                            <span>{sub.name}</span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default CategoryBar;
