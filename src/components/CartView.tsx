'use client';

import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import { useTranslations } from '@/components/LanguageProvider';
import { formatPrice } from '@/lib/currency';

// কার্ট পেজে দুইটি সেকশন —
//   সেকশন ১: আইটেম তালিকা (প্রতিটি আইটেমে "X" বাটন, চাপলে সেটি বাদ যায়)
//   সেকশন ২: মোট দাম + অর্ডার কনফার্ম (X চাপলে সেই পণ্যের Add to Cart বাটন আবার চালু হয়)
const CartView = () => {
    const { items, removeItem, clearCart } = useCart();
    const t = useTranslations();

    const subtotal = items.reduce((total, item) => total + item.price, 0);

    const handleRemove = (id: string, name: string) => {
        removeItem(id);
        toast.info(t('cart.removedToast', { name }));
    };

    // খালি কার্ট
    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/60">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-3xl shadow-lg shadow-indigo-500/30">
                    🛒
                </span>
                <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t('cart.emptyTitle')}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('cart.emptyDesc')}</p>
                <Link
                    href="/#categories"
                    className="mt-6 inline-block rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                >
                    {t('cart.startShopping')}
                </Link>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* ===== সেকশন ১ — কার্টের আইটেম তালিকা ===== */}
            <section
                aria-label={t('cart.items')}
                className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur lg:col-span-3 dark:border-slate-700/70 dark:bg-slate-900/60"
            >
                <header className="flex items-center justify-between gap-3 border-b border-slate-200/60 p-5 sm:p-6 dark:border-slate-700/60">
                    <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                        {t('cart.items')}
                        <span className="ml-2 align-middle rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                            {items.length}
                        </span>
                    </h2>
                    <button
                        type="button"
                        onClick={() => {
                            clearCart();
                            toast.info(t('cart.clearedToast'));
                        }}
                        className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors duration-300 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                    >
                        {t('cart.clear')}
                    </button>
                </header>

                <ul className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 p-4 sm:p-5">
                            {/* ছবি */}
                            <Link
                                href={`/products/${item.id}`}
                                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/60 dark:to-slate-900/60"
                            >
                                <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                            </Link>

                            {/* তথ্য */}
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={`/products/${item.id}`}
                                    className="block truncate text-sm font-bold text-slate-900 transition-colors duration-300 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                                >
                                    {item.icon ? `${item.icon} ` : ''}
                                    {item.name}
                                </Link>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t('cart.sku', { id: item.id })}
                                </p>
                                <p className="mt-1 text-base font-extrabold text-slate-900 dark:text-white">
                                    {formatPrice(item.price)}
                                </p>
                            </div>

                            {/* সরানোর বাটন — চাপলে আইটেম বাদ, প্রোডাক্টের Add to Cart বাটন আবার চালু */}
                            <button
                                type="button"
                                onClick={() => handleRemove(item.id, item.name)}
                                aria-label={t('cart.removeAria', { name: item.name })}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-300/70 bg-white/70 text-sm font-bold text-slate-500 transition-all duration-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-90 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            {/* ===== সেকশন ২ — মোট দাম ও অর্ডার কনফার্ম ===== */}
            <aside
                aria-label={t('cart.orderSummary')}
                className="self-start rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur lg:col-span-2 lg:sticky lg:top-24 dark:border-slate-700/70 dark:bg-slate-900/60"
            >
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    {t('cart.orderSummary')}
                </h2>

                <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-600 dark:text-slate-400">
                            {t('cart.itemCount', { count: items.length })}
                        </dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-600 dark:text-slate-400">{t('cart.delivery')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{t('cart.deliveryNote')}</dd>
                    </div>
                </dl>

                <div className="mt-4 flex items-baseline justify-between border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                    <span className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        {t('cart.subtotal')}
                    </span>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(subtotal)}
                    </span>
                </div>

                {/* কনফার্ম অর্ডার — চাপলে পেমেন্ট ও শিপিং পেজে চলে যায় (কার্ট এখনো খালি হয় না) */}
                <Link
                    href="/checkout"
                    className="mt-6 block w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-center text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                >
                    {t('cart.confirmOrder')}
                </Link>

                <p className="mt-4 text-center">
                    <Link
                        href="/#categories"
                        className="text-sm font-semibold text-slate-500 transition-colors duration-300 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                        {t('cart.continueShopping')}
                    </Link>
                </p>
            </aside>
        </div>
    );
};

export default CartView;
