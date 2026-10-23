'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import Avatar from '@/components/Avatar';
import CategoryBar from '@/components/CategoryBar';
import { useCart } from '@/components/CartProvider';
import { authClient } from '@/lib/auth-client';
import { getSessionScope } from '@/lib/session-scope';
import type { CategoryNavItem } from '@/lib/data';

const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/learn-more', label: 'Learn More' },
    { href: '/contact', label: 'Contact' },
];

// প্রি-রেন্ডার সময় pathname না জানা হলে (ডাইনামিক রুট, যেমন /products/[id]) নেভবারের
// জায়গায় এই স্কেলেটন দেখানো হয় — লেআউটে <Suspense> বাউন্ডারির fallback হিসেবে।
// (নির্দিষ্ট কোড — Date.now()/Math.random() চলবে না)
export const NavbarFallback = () => (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/20">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            {/* লোগোর জায়গা */}
            <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
            </div>

            {/* ডেস্কটপ লিংকের জায়গা */}
            <div className="hidden items-center gap-2 md:flex">
                <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-8 w-20 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
            </div>

            {/* ডান পাশের বাটনের জায়গা */}
            <div className="flex items-center gap-2">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
            </div>
        </nav>

        {/* ক্যাটাগরি বারের জায়গা */}
        <div className="border-t border-slate-200/60 bg-white/60 dark:border-slate-700/60 dark:bg-slate-900/60">
            <div className="mx-auto flex h-11 max-w-6xl items-center gap-3 px-4 sm:px-6">
                {[64, 78, 96, 70, 74, 90].map((width) => (
                    <div
                        key={width}
                        className="h-5 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60"
                        style={{ width }}
                    />
                ))}
            </div>
        </div>
    </header>
);

const Navbar = ({ categories }: { categories: CategoryNavItem[] }) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = authClient.useSession();
    const isLoggedIn = Boolean(session);
    const { items } = useCart();

    // অ্যাডমিন প্যানেলে লগইন করা থাকলে কার্ট/চেকআউট থাকে না
    const isAdminScope = getSessionScope(session) === 'admin';

    const cartCount = items.length;
    const cartLabel = `Cart with ${cartCount} item${cartCount === 1 ? '' : 's'}`;

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 shadow-[0_4px_20px_-10px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/20">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
                {/* লোগো */}
                <Link href="/" className="group flex shrink-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-lg shadow-md shadow-indigo-500/30 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                        🛍️
                    </span>
                    <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                        Next<span className="gradient-text">Mart</span>
                    </span>
                </Link>

                {/* ডেস্কটপ নেভ লিংক */}
                <ul className="hidden items-center gap-1 lg:flex">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950 dark:to-slate-800'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span className={isActive ? 'gradient-text' : ''}>{link.label}</span>
                                    {isActive && (
                                        <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* ডান পাশের অ্যাকশন (শুধু বড় স্ক্রিনে) */}
                <div className="hidden items-center gap-2 lg:flex">
                    {/* ভাষা বাটন — বাংলা ⇄ ইংরেজি */}
                    <LanguageToggle />

                    <ThemeToggle />

                    {/* কার্ট — অ্যাডমিন স্কোপে কার্ট থাকে না */}
                    {!isAdminScope && (
                        <Link
                            href="/cart"
                            aria-label={cartLabel}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all duration-300 hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800"
                        >
                            🛒
                            {cartCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* লগইন অবস্থা অনুযায়ী বাটন (পেন্ডিং অবস্থায় লগআউট UI দেখায়, তাই প্রথম পেইন্টেই বাটন থাকে) */}
                    {isLoggedIn ? (
                        <Link
                            href="/profile"
                            className={`group flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/15 ${
                                pathname === '/profile'
                                    ? 'border-indigo-300 bg-indigo-50/80 dark:border-indigo-600 dark:bg-indigo-950/50'
                                    : 'border-slate-200/70 bg-white/70 hover:border-indigo-300 dark:border-slate-700/70 dark:bg-slate-800/70 dark:hover:border-indigo-500'
                            }`}
                        >
                            <Avatar src={session?.user.image} name={session?.user.name ?? 'User'} />
                            <span className="max-w-[7rem] truncate text-sm font-bold text-slate-900 dark:text-white">
                                {session?.user.name}
                            </span>
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors duration-300 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/login?mode=signup"
                                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>

                {/* মোবাইল হ্যামবার্গার (তিন লাইন) */}
                <button
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 hover:bg-slate-100 active:scale-95 dark:hover:bg-slate-800 lg:hidden"
                >
                    <span className="text-xl leading-none">{isOpen ? '✕' : '☰'}</span>
                </button>
            </nav>

            {/* ক্যাটাগরি বার — নেভবারের নিচে (অ্যাডমিন প্যানেল সেশনে ক্যাটাগরি নেই) */}
            {!isAdminScope && <CategoryBar categories={categories} />}

            {/* মোবাইল মেনু — সব উপাদান এখানে */}
            <div
                className={`overflow-hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out dark:border-slate-700/60 dark:bg-slate-900/95 lg:hidden ${
                    isOpen ? 'max-h-[85vh] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'
                }`}
            >
                <ul className="space-y-1 px-4 py-3">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-300 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-indigo-950 dark:to-slate-800'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <span className={isActive ? 'gradient-text' : ''}>{link.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="space-y-3 border-t border-slate-200/60 px-4 py-4 dark:border-slate-700/60">
                    {/* ভাষা ও থিম */}
                    <div className="flex items-center gap-3">
                        <LanguageToggle className="flex-1 justify-center" />
                        <ThemeToggle />
                    </div>

                    {/* কার্ট — অ্যাডমিন স্কোপে কার্ট থাকে না */}
                    {!isAdminScope && (
                        <Link
                            href="/cart"
                            onClick={() => setIsOpen(false)}
                            aria-label={cartLabel}
                            className="relative flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                        >
                            <span>🛒 Cart</span>
                            {cartCount > 0 && (
                                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* লগইন / প্রোফাইল */}
                    {isLoggedIn ? (
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                        >
                            <Avatar src={session?.user.image} name={session?.user.name ?? 'User'} />
                            <span className="truncate">👤 {session?.user.name}</span>
                        </Link>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl border border-slate-300/70 bg-white/70 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-700 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/login?mode=signup"
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
