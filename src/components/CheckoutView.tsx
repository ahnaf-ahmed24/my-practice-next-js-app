'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCart } from '@/components/CartProvider';
import { authClient } from '@/lib/auth-client';
import { useLanguage, useTranslations } from '@/components/LanguageProvider';
import type { SavedAddress } from '@/lib/address';
import {
    divisions,
    getDeliveryCharge,
    getDeliveryZone,
    getDistricts,
    isValidBdPhone,
    OUTSIDE_DHAKA_DELIVERY_CHARGE,
} from '@/lib/bangladesh';
import { formatPrice } from '@/lib/currency';

type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'cod' | 'card' | 'bank';

type PlacedOrder = {
    id: string;
    total: number;
    count: number;
    delivery: number;
    method: string;
};

const paymentMethods: { id: PaymentMethod; icon: string; badge?: PaymentMethod }[] = [
    { id: 'bkash', icon: '🧧', badge: 'bkash' },
    { id: 'nagad', icon: '📲' },
    { id: 'rocket', icon: '🚀' },
    { id: 'cod', icon: '💵' },
    { id: 'card', icon: '💳' },
    { id: 'bank', icon: '🏦' },
];

const banks = [
    'BRAC Bank',
    'Dutch-Bangla Bank',
    'City Bank',
    'Islami Bank',
    'Standard Chartered',
    'Eastern Bank',
    'IFIC Bank',
    'Mercantile Bank',
];

// ইনপুট ফিল্ডের স্টাইল — পুরো অ্যাপে একই রকম রাখা হয়
const inputClass =
    'mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500';

// অর্ডার নম্বর তৈরি — কম্পোনেন্টের বাইরে, তাই রেন্ডারের সময় কখনো চলে না
const createOrderId = () => `NM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// চেকআউট ভিউ — বাংলাদেশি শিপিং ঠিকানা + পেমেন্ট মেথড + অর্ডার সামারি
const CheckoutView = ({ savedAddresses = [] }: { savedAddresses?: SavedAddress[] }) => {
    const { items, clearCart } = useCart();
    const { data: session } = authClient.useSession();
    const { language } = useLanguage();
    const t = useTranslations();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
    const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

    // প্রোফাইলে সংরক্ষিত ঠিকানা থেকে ফর্ম নিজে থেকেই পূরণ হয়
    // (ডিফল্ট ঠিকানাটি আগে দেখানো হয়, ব্যবহারকারী অন্যটি বেছে নিতে পারেন)
    const defaultAddress = savedAddresses.find((item) => item.isDefault) ?? savedAddresses[0];

    const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? '');
    const [division, setDivision] = useState(defaultAddress?.address.division ?? 'Dhaka');
    const [district, setDistrict] = useState(defaultAddress?.address.district ?? 'Dhaka');

    const selectedAddress = savedAddresses.find((item) => item.id === selectedAddressId);

    const districts = getDistricts(division);
    const subtotal = items.reduce((total, item) => total + item.price, 0);
    const deliveryCharge = getDeliveryCharge(district);
    const total = subtotal + deliveryCharge;
    const zone = getDeliveryZone(district);

    // লগইন করা থাকলে নাম ও ইমেইল ফর্মে নিজে থেকেই বসে যায়।
    // সেশন আসার আগ পর্যন্ত ফর্ম খালি থাকে, তারপর key বদলে ইনপুট নতুন করে বসে।
    const sessionUser = session?.user;

    // কোন উৎস থেকে ফর্ম পূরণ হচ্ছে — সংরক্ষিত ঠিকানা আগে, নয়তো লগইনের তথ্য
    const prefillSource = selectedAddress
        ? `saved-${selectedAddress.id}`
        : `session-${sessionUser?.id ?? 'guest'}`;

    const prefillName = selectedAddress?.address.name ?? sessionUser?.name ?? '';
    const prefillEmail = selectedAddress?.address.email ?? sessionUser?.email ?? '';
    const prefillPhone = selectedAddress?.address.phone ?? '';

    // সংরক্ষিত ঠিকানা বেছে নিলে পুরো ফর্ম ঐ ঠিকানা অনুযায়ী বসে যায়
    const handleSelectAddress = (id: string) => {
        setSelectedAddressId(id);

        const next = savedAddresses.find((item) => item.id === id);
        if (next) {
            setDivision(next.address.division);
            setDistrict(next.address.district);
        }
    };

    // বিভাগ বদলালে সেই বিভাগের প্রথম জেলা বসে যায়
    const handleDivisionChange = (nextDivision: string) => {
        setDivision(nextDivision);
        setDistrict(getDistricts(nextDivision)[0] ?? '');
    };

    // অর্ডার প্লেস — লগইন করা থাকলে অর্ডারটি অ্যাকাউন্টে সংরক্ষিত হয়
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // পেজ রিলোড বন্ধ

        const form = new FormData(event.currentTarget);
        const phone = String(form.get('phone') ?? '').replace(/[\s-]/g, '');

        if (!isValidBdPhone(phone)) {
            toast.error(t('checkout.invalidPhone'));
            return;
        }

        const count = items.length;
        const orderId = createOrderId();
        const method = t(`checkout.payment.${paymentMethod}`);

        const address = {
            name: String(form.get('name') ?? '').trim(),
            phone,
            altPhone: String(form.get('altPhone') ?? '').trim(),
            email: String(form.get('email') ?? '').trim(),
            division: String(form.get('division') ?? ''),
            district: String(form.get('district') ?? ''),
            thana: String(form.get('thana') ?? '').trim(),
            postCode: String(form.get('postCode') ?? '').trim(),
            area: String(form.get('area') ?? '').trim(),
            landmark: String(form.get('landmark') ?? '').trim(),
            notes: String(form.get('notes') ?? '').trim(),
        };

        // লগইন করা ইউজারের অর্ডার সার্ভারে সংরক্ষিত হয়
        if (sessionUser) {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    items,
                    subtotal,
                    deliveryCharge,
                    paymentMethod: method,
                    address,
                    estimatedDelivery:
                        zone === 'inside' ? t('checkout.estimateInside') : t('checkout.estimateOutside'),
                }),
            }).catch(() => null);

            if (!response?.ok) {
                toast.error(t('checkout.orderFailed'));
                return;
            }

            // "এই ঠিকানাটি সংরক্ষণ করে রাখুন" চেক করা থাকলে ঠিকানা সেভ হয়
            // PUT ব্যবহার করা হয় — আগে থেকে একই ঠিকানা থাকলে সেটিই আপডেট হয়,
            // তাই প্রতিটি অর্ডারে নতুন এন্ট্রি জমে না
            if (form.get('saveAddress')) {
                await fetch('/api/addresses', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ label: t('profile.homeLabel'), address }),
                }).catch(() => null);
            }
        }

        clearCart();
        setPlacedOrder({ id: orderId, total, count, delivery: deliveryCharge, method });
        toast.success(t('checkout.orderToast', { id: orderId }));
    };

    // অর্ডার সফল হয়ে গেছে
    if (placedOrder) {
        return (
            <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-300/60 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10 dark:border-emerald-800/60 dark:bg-slate-900/60">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl shadow-lg shadow-emerald-500/30">
                    ✅
                </span>
                <h3 className="mt-5 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {t('checkout.successTitle')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t('checkout.successDesc')}
                </p>

                {sessionUser && (
                    <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/60 px-4 py-2 text-xs font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-300">
                        💾 {t('checkout.savedToAccount')}
                    </p>
                )}

                <dl className="mt-6 space-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 text-sm dark:border-slate-700/70 dark:bg-slate-800/40">
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">{t('checkout.orderNumber')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{placedOrder.id}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">{t('checkout.paymentMethod')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{placedOrder.method}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">{t('checkout.itemCount')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{placedOrder.count}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">{t('checkout.deliveryCharge')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">
                            {placedOrder.delivery === 0 ? t('checkout.free') : formatPrice(placedOrder.delivery)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
                        <dt className="font-bold text-slate-900 dark:text-white">{t('checkout.total')}</dt>
                        <dd className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(placedOrder.total)}
                        </dd>
                    </div>
                </dl>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/#categories"
                        className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                    >
                        {t('checkout.moreShopping')}
                    </Link>
                    <Link
                        href="/cart"
                        className="rounded-2xl border border-slate-300/70 bg-white/70 px-6 py-3 text-sm font-bold uppercase tracking-wide text-slate-600 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
                    >
                        {t('checkout.viewCart')}
                    </Link>
                </div>
            </div>
        );
    }

    // কার্ট খালি হলে চেকআউট করার কিছু নেই
    if (items.length === 0) {
        return (
            <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 text-center shadow-sm backdrop-blur sm:p-10 dark:border-slate-700/70 dark:bg-slate-900/60">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-3xl shadow-lg shadow-indigo-500/30">
                    🛒
                </span>
                <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t('checkout.emptyTitle')}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('checkout.emptyDesc')}</p>
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
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-5">
            {/* ===== সেকশন ১ — শিপিং ও পেমেন্ট ফর্ম ===== */}
            <div className="space-y-6 lg:col-span-3">
                {/* শিপিং ঠিকানা */}
                <section
                    aria-label={t('checkout.shippingTitle')}
                    className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-md shadow-indigo-500/30">
                            🚚
                        </span>
                        <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                            {t('checkout.shippingTitle')}
                        </h3>
                    </div>

                    {/* প্রোফাইলে সংরক্ষিত ঠিকানা থেকে দ্রুত বেছে নিন */}
                    {savedAddresses.length > 0 && (
                        <div className="mt-5">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                {t('checkout.savedAddresses')}
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {savedAddresses.map((item) => {
                                    const isActive = item.id === selectedAddressId;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleSelectAddress(item.id)}
                                            aria-pressed={isActive}
                                            className={`rounded-2xl border p-3 text-left transition-all duration-300 ${
                                                isActive
                                                    ? 'border-indigo-400 bg-indigo-50/60 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40'
                                                    : 'border-slate-200/70 bg-white/60 hover:border-indigo-300 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:border-indigo-700'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                                                {isActive ? '📍' : '📌'} {item.label}
                                                {item.isDefault && (
                                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                                                        {t('profile.defaultBadge')}
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                                                {item.address.area}, {item.address.thana},{' '}
                                                {item.address.district}
                                            </span>
                                        </button>
                                    );
                                })}

                                {/* নতুন ঠিকানা দিয়ে অর্ডার করা */}
                                {selectedAddressId && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectAddress('')}
                                        className="rounded-2xl border border-dashed border-slate-300/80 p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/80 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
                                    >
                                        + {t('checkout.useNewAddress')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* লগইন থাকলে নাম-ইমেইল অটো-ফিল */}
                    {selectedAddress ? (
                        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-300/60 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {t('checkout.addressPrefilled')}
                        </p>
                    ) : sessionUser ? (
                        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-300/60 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {t('checkout.prefilled')}
                        </p>
                    ) : (
                        language === 'bn' && (
                            <p className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-indigo-200/70 bg-indigo-50/60 px-4 py-3 text-xs font-medium text-indigo-700 dark:border-indigo-800/60 dark:bg-indigo-950/30 dark:text-indigo-300">
                                {t('checkout.loginHint')}{' '}
                                <Link
                                    href="/login?next=/checkout"
                                    className="font-bold underline underline-offset-2 transition-colors hover:text-indigo-900 dark:hover:text-indigo-100"
                                >
                                    {t('checkout.loginNow')}
                                </Link>
                            </p>
                        )
                    )}

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.fullName')}
                            </span>
                            <input
                                key={`name-${prefillSource}`}
                                type="text"
                                name="name"
                                required
                                defaultValue={prefillName}
                                placeholder={t('checkout.namePlaceholder')}
                                className={inputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.phone')}
                            </span>
                            <input
                                key={`phone-${prefillSource}`}
                                type="tel"
                                name="phone"
                                required
                                inputMode="numeric"
                                defaultValue={prefillPhone}
                                placeholder="01712345678"
                                className={inputClass}
                            />
                            <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
                                {t('checkout.phoneHint')}
                            </span>
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.altPhone')}{' '}
                                <span className="font-normal text-slate-400">{t('checkout.optional')}</span>
                            </span>
                            <input
                                key={`altPhone-${prefillSource}`}
                                type="tel"
                                name="altPhone"
                                inputMode="numeric"
                                defaultValue={selectedAddress?.address.altPhone ?? ''}
                                placeholder="01812345678"
                                className={inputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.email')}
                            </span>
                            <input
                                key={`email-${prefillSource}`}
                                type="email"
                                name="email"
                                required
                                defaultValue={prefillEmail}
                                placeholder="you@example.com"
                                className={inputClass}
                            />
                        </label>

                        {/* বিভাগ */}
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.division')}
                            </span>
                            <select
                                name="division"
                                value={division}
                                onChange={(event) => handleDivisionChange(event.target.value)}
                                className={inputClass}
                            >
                                {divisions.map((item) => (
                                    <option key={item.name} value={item.name}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* জেলা — বিভাগের অধীনের জেলাগুলোই দেখায় */}
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.district')}
                            </span>
                            <select
                                name="district"
                                value={district}
                                onChange={(event) => setDistrict(event.target.value)}
                                className={inputClass}
                            >
                                {districts.map((districtName) => (
                                    <option key={districtName} value={districtName}>
                                        {districtName}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* থানা / উপজেলা */}
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.thana')}
                            </span>
                            <input
                                key={`thana-${prefillSource}`}
                                type="text"
                                name="thana"
                                required
                                defaultValue={selectedAddress?.address.thana ?? ''}
                                placeholder={t('checkout.thanaPlaceholder')}
                                className={inputClass}
                            />
                        </label>

                        {/* পোস্ট কোড */}
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.postCode')}{' '}
                                <span className="font-normal text-slate-400">{t('checkout.optional')}</span>
                            </span>
                            <input
                                key={`postCode-${prefillSource}`}
                                type="text"
                                name="postCode"
                                inputMode="numeric"
                                defaultValue={selectedAddress?.address.postCode ?? ''}
                                placeholder="1209"
                                className={inputClass}
                            />
                        </label>

                        {/* রোড / এলাকা / বাসা */}
                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.address')}
                            </span>
                            <input
                                key={`area-${prefillSource}`}
                                type="text"
                                name="area"
                                required
                                defaultValue={selectedAddress?.address.area ?? ''}
                                placeholder={t('checkout.areaPlaceholder')}
                                className={inputClass}
                            />
                        </label>

                        {/* ল্যান্ডমার্ক */}
                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.landmark')}{' '}
                                <span className="font-normal text-slate-400">{t('checkout.optional')}</span>
                            </span>
                            <input
                                key={`landmark-${prefillSource}`}
                                type="text"
                                name="landmark"
                                defaultValue={selectedAddress?.address.landmark ?? ''}
                                placeholder={t('checkout.landmarkPlaceholder')}
                                className={inputClass}
                            />
                        </label>

                        {/* বিশেষ নির্দেশনা */}
                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.notes')}{' '}
                                <span className="font-normal text-slate-400">{t('checkout.optional')}</span>
                            </span>
                            <textarea
                                key={`notes-${prefillSource}`}
                                name="notes"
                                rows={3}
                                defaultValue={selectedAddress?.address.notes ?? ''}
                                placeholder={t('checkout.notesPlaceholder')}
                                className={`${inputClass} resize-y`}
                            />
                        </label>
                    </div>

                    <label className="mt-5 flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <input
                            type="checkbox"
                            name="saveAddress"
                            defaultChecked
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700"
                        />
                        {t('checkout.saveAddress')}
                    </label>
                </section>

                {/* পেমেন্ট মেথড */}
                <section
                    aria-label={t('checkout.paymentTitle')}
                    className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60"
                >
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-xl shadow-md shadow-indigo-500/30">
                            💳
                        </span>
                        <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                            {t('checkout.paymentTitle')}
                        </h3>
                    </div>

                    <div className="mt-6 space-y-3">
                        {paymentMethods.map((method) => {
                            const isActive = paymentMethod === method.id;
                            return (
                                <label
                                    key={method.id}
                                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 transition-all duration-300 ${
                                        isActive
                                            ? 'border-indigo-400 bg-indigo-50/60 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40'
                                            : 'border-slate-200/70 bg-white/60 hover:border-indigo-300 dark:border-slate-700/70 dark:bg-slate-900/40 dark:hover:border-indigo-700'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method.id}
                                        checked={isActive}
                                        onChange={() => setPaymentMethod(method.id)}
                                        className="h-4 w-4 shrink-0 border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700"
                                    />
                                    <span className="text-xl">{method.icon}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                                            {t(`checkout.payment.${method.id}`)}
                                        </span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                                            {t(`checkout.payment.${method.id}Hint`)}
                                        </span>
                                    </span>
                                    {method.badge && (
                                        <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:bg-rose-950/70 dark:text-rose-300">
                                            {t('checkout.popular')}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>

                    {/* মোবাইল ওয়ালেট — bKash / Nagad / Rocket */}
                    {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') && (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.walletNumber', { wallet: t(`checkout.payment.${paymentMethod}`) })}
                                </span>
                                <input
                                    key={`wallet-${prefillSource}`}
                                    type="tel"
                                    name="walletNumber"
                                    required
                                    inputMode="numeric"
                                    defaultValue={prefillPhone}
                                    placeholder="01712345678"
                                    className={inputClass}
                                />
                            </label>

                            {paymentMethod === 'bkash' && (
                                <label className="block">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                        {t('checkout.accountType')}
                                    </span>
                                    <select name="bkashAccountType" className={inputClass}>
                                        <option value="personal">{t('checkout.accountTypePersonal')}</option>
                                        <option value="merchant">{t('checkout.accountTypeMerchant')}</option>
                                    </select>
                                </label>
                            )}
                        </div>
                    )}

                    {/* কার্ড ডিটেইলস */}
                    {paymentMethod === 'card' && (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.cardNumber')}
                                </span>
                                <input
                                    type="text"
                                    name="cardNumber"
                                    required
                                    inputMode="numeric"
                                    placeholder="4242 4242 4242 4242"
                                    className={inputClass}
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.cardExpiry')}
                                </span>
                                <input type="text" name="cardExpiry" required placeholder="MM / YY" className={inputClass} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.cvc')}
                                </span>
                                <input type="text" name="cardCvc" required inputMode="numeric" placeholder="123" className={inputClass} />
                            </label>
                        </div>
                    )}

                    {/* ব্যাংক ট্রান্সফার */}
                    {paymentMethod === 'bank' && (
                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            <label className="block sm:col-span-2">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.bankName')}
                                </span>
                                <select name="bankName" className={inputClass}>
                                    {banks.map((bank) => (
                                        <option key={bank} value={bank}>
                                            {bank}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.accountNumber')}
                                </span>
                                <input type="text" name="accountNumber" required className={inputClass} />
                            </label>

                            <label className="block">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {t('checkout.routingNumber')}
                                </span>
                                <input type="text" name="routingNumber" required className={inputClass} />
                            </label>
                        </div>
                    )}

                    {/* ক্যাশ অন ডেলিভারি নোট */}
                    {paymentMethod === 'cod' && (
                        <p className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm leading-relaxed text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                            {t('checkout.codNote')}
                        </p>
                    )}
                </section>
            </div>

            {/* ===== সেকশন ২ — অর্ডার সামারি ও প্লেস অর্ডার ===== */}
            <aside
                aria-label={t('checkout.summaryTitle')}
                className="self-start rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur lg:col-span-2 lg:sticky lg:top-24 dark:border-slate-700/70 dark:bg-slate-900/60"
            >
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    {t('checkout.summaryTitle')}
                </h3>

                {/* কার্টের আইটেমস */}
                <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
                    {items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3">
                            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/60 dark:to-slate-900/60">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="48px"
                                    className="object-cover"
                                />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                                    {item.icon ? `${item.icon} ` : ''}
                                    {item.name}
                                </span>
                                <span className="block text-xs text-slate-500 dark:text-slate-400">
                                    {t('cart.sku', { id: item.id })}
                                </span>
                            </span>
                            <span className="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">
                                {formatPrice(item.price)}
                            </span>
                        </li>
                    ))}
                </ul>

                <dl className="mt-5 space-y-3 border-t border-slate-200/60 pt-5 text-sm dark:border-slate-700/60">
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-600 dark:text-slate-400">
                            {t('checkout.itemCountLabel', { count: items.length })}
                        </dt>
                        <dd className="font-bold text-slate-900 dark:text-white">{formatPrice(subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-600 dark:text-slate-400">{t('checkout.deliveryCharge')}</dt>
                        <dd
                            className={`font-bold ${
                                deliveryCharge === 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                            }`}
                        >
                            {deliveryCharge === 0 ? t('checkout.free') : formatPrice(deliveryCharge)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between">
                        <dt className="text-slate-600 dark:text-slate-400">{t('checkout.deliveryTime')}</dt>
                        <dd className="font-bold text-slate-900 dark:text-white">
                            {zone === 'inside' ? t('checkout.estimateInside') : t('checkout.estimateOutside')}
                        </dd>
                    </div>
                </dl>

                {/* ডেলিভারি নিয়ে নোট */}
                <p className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs leading-relaxed text-slate-600 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-400">
                    {zone === 'inside'
                        ? t('checkout.noteInside')
                        : t('checkout.noteOutside', {
                              charge: formatPrice(OUTSIDE_DHAKA_DELIVERY_CHARGE),
                              district,
                          })}
                </p>

                <div className="mt-4 flex items-baseline justify-between border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                    <span className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        {t('checkout.total')}
                    </span>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{formatPrice(total)}</span>
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                >
                    {t('checkout.placeOrder')}
                </button>

                <p className="mt-4 text-center">
                    <Link
                        href="/cart"
                        className="text-sm font-semibold text-slate-500 transition-colors duration-300 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                        {t('checkout.backToCart')}
                    </Link>
                </p>
            </aside>
        </form>
    );
};

export default CheckoutView;
