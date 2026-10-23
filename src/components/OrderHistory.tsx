'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from '@/components/LanguageProvider';
import {
    getStatusStep,
    ORDER_STATUS_STEPS,
    type OrderStatus,
    type TrackingEvent,
} from '@/lib/order-status';
import { formatPrice } from '@/lib/currency';

export type OrderItemView = {
    id: string;
    name: string;
    price: number;
    image: string;
    icon?: string;
};

export type OrderView = {
    id: string;
    createdAt: string;
    items: OrderItemView[];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    paymentMethod: string;
    estimatedDelivery: string;
    status: OrderStatus;
    tracking: TrackingEvent[];
    approvedAt: string | null;
    address: {
        name: string;
        phone: string;
        area: string;
        thana: string;
        district: string;
        division: string;
        landmark?: string;
        notes?: string;
    };
};

// কত সেকেন্ড পরপর অর্ডারের অবস্থা রিফ্রেশ হবে (লাইভ ট্র্যাকিং)
const POLL_INTERVAL = 10_000;

const statusStyles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    shipped: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
};

const stepIcons: Record<string, string> = {
    pending: '⏳',
    processing: '📦',
    shipped: '🚚',
    delivered: '✅',
};

// পুরোনো অর্ডারের তালিকা — স্ট্যাটাস টাইমলাইন, ট্র্যাকিং ও বিস্তারিত দেখানো যায়
const OrderHistory = ({ orders }: { orders: OrderView[] }) => {
    const t = useTranslations();
    const router = useRouter();
    const [openId, setOpenId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [liveOrders, setLiveOrders] = useState<OrderView[]>(orders);

    // সার্ভার থেকে আসা ড্যাটা বদলালে সিঙ্ক হয়
    const [synced, setSynced] = useState(orders);
    if (synced !== orders) {
        setSynced(orders);
        setLiveOrders(orders);
    }

    // লাইভ আপডেট — অ্যাডমিন ট্র্যাকিং পাঠালে এখানে দেখা যায়
    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            try {
                const response = await fetch('/api/orders', { cache: 'no-store' });
                if (!response.ok) return;

                const data = await response.json();
                if (!cancelled && Array.isArray(data.orders)) setLiveOrders(data.orders);
            } catch {
                // নেটওয়ার্ক সমস্যা — পরের টিকে আবার চেষ্টা হবে
            }
        };

        const timer = setInterval(poll, POLL_INTERVAL);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    // অর্ডার মুছে ফেলা (বাতিল করা) — প্রসেসিং/শিপড অর্ডারে সার্ভার 409 দেয়, কারণটি দেখানো হয়
    const handleDelete = async (id: string) => {
        setDeletingId(id);

        const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(() => null);
        const data = (await response?.json().catch(() => null)) as { error?: string } | null;

        setDeletingId(null);

        if (!response?.ok) {
            toast.error(data?.error ?? t('profile.error'));
            return;
        }

        toast.success(t('profile.orderDeleted'));
        setLiveOrders((prev) => prev.filter((order) => order.id !== id));
        router.refresh();
    };

    if (!liveOrders.length) {
        return (
            <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/50 p-8 text-center backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/40">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                    📦
                </span>
                <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
                    {t('profile.ordersEmpty')}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t('profile.ordersEmptyHint')}
                </p>
                <Link
                    href="/#categories"
                    className="mt-5 inline-block rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95"
                >
                    {t('cart.startShopping')}
                </Link>
            </div>
        );
    }

    return (
        <ul className="space-y-4">
            {liveOrders.map((order) => {
                const status = order.status;
                const step = getStatusStep(status);
                const isOpen = openId === order.id;
                const isCancelled = status === 'cancelled';
                // অ্যাডমিন অনুমোদনের আগে বা ডেলিভার হওয়ার পরেই মুছে ফেলা যায়
                const canRemove = status === 'pending' || status === 'delivered' || status === 'cancelled';

                return (
                    <li
                        key={order.id}
                        className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/60"
                    >
                        {/* অর্ডার হেডার */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
                            <div>
                                <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    #{order.id}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                    {' · '}
                                    {order.items.length} {t('profile.items')}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusStyles[status]}`}
                                >
                                    {t(`profile.status.${status}`)}
                                </span>

                                {/* অর্ডার মুছে ফেলার অপশন */}
                                {canRemove && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(order.id)}
                                        disabled={deletingId === order.id}
                                        aria-label={t('profile.deleteOrderAria', { id: order.id })}
                                        title={
                                            status === 'pending'
                                                ? t('profile.cancelOrder')
                                                : t('profile.removeOrder')
                                        }
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-200/70 text-xs text-rose-500 transition-colors duration-300 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                    >
                                        {deletingId === order.id ? '…' : '🗑'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* স্ট্যাটাস টাইমলাইন */}
                        {!isCancelled && (
                            <div className="px-4 pt-4 sm:px-5">
                                <ol className="flex items-center gap-2">
                                    {ORDER_STATUS_STEPS.map((item, index) => (
                                        <li key={item} className="flex flex-1 items-center gap-2">
                                            <span
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors duration-300 ${
                                                    index <= step
                                                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300'
                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                                }`}
                                            >
                                                {stepIcons[item]}
                                            </span>
                                            {index < ORDER_STATUS_STEPS.length - 1 && (
                                                <span
                                                    className={`h-0.5 flex-1 rounded-full ${
                                                        index < step
                                                            ? 'bg-indigo-400'
                                                            : 'bg-slate-200 dark:bg-slate-700'
                                                    }`}
                                                />
                                            )}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* শিপমেন্ট ট্র্যাকিং (লাইভ) */}
                        {order.tracking.length > 0 && (
                            <div className="mx-4 mt-4 rounded-2xl border border-indigo-100/80 bg-indigo-50/50 p-4 sm:mx-5 dark:border-indigo-900/60 dark:bg-indigo-950/20">
                                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    {t('profile.trackingTitle')}
                                </p>

                                <ol className="mt-3 space-y-3">
                                    {order.tracking.map((event) => (
                                        <li key={event.id} className="flex gap-3">
                                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs shadow-sm dark:bg-slate-800">
                                                {stepIcons[event.status]}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {event.note || t(`profile.status.${event.status}`)}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                    {t(`profile.status.${event.status}`)}
                                                    {event.location ? ` · ${event.location}` : ''} ·{' '}
                                                    {new Date(event.createdAt).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* পণ্যের তালিকা */}
                        <ul className="mt-4 space-y-3 px-4 sm:px-5">
                            {order.items.map((item) => (
                                <li key={item.id} className="flex items-center gap-3">
                                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/60 dark:to-slate-900/60">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            sizes="44px"
                                            className="object-cover"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {item.icon ? `${item.icon} ` : ''}
                                        {item.name}
                                    </span>
                                    <span className="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">
                                        {formatPrice(item.price)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* টোটাল ও বিস্তারিত */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/60 px-4 py-4 sm:px-5 dark:border-slate-700/60">
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                <p>
                                    {t('profile.paidWith')}:{' '}
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {order.paymentMethod}
                                    </span>
                                </p>
                                <p className="mt-0.5">
                                    {t('profile.deliveryCharge')}:{' '}
                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                        {order.deliveryCharge === 0
                                            ? t('checkout.free')
                                            : formatPrice(order.deliveryCharge)}
                                    </span>
                                </p>
                            </div>

                            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                {formatPrice(order.total)}
                            </p>
                        </div>

                        {/* বিস্তারিত টগল */}
                        <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : order.id)}
                            className="w-full border-t border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors duration-300 hover:text-indigo-600 sm:px-5 dark:border-slate-700/60 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:text-indigo-300"
                        >
                            {isOpen ? t('profile.hideDetails') : t('profile.details')}
                        </button>

                        {isOpen && (
                            <div className="space-y-4 border-t border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                        {t('profile.deliverTo')}
                                    </p>
                                    <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                                        {order.address.name} · {order.address.phone}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        {order.address.area}, {order.address.thana}, {order.address.district},
                                        {order.address.division}
                                    </p>
                                    {order.address.landmark && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {order.address.landmark}
                                        </p>
                                    )}
                                    {order.address.notes && (
                                        <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                                            “{order.address.notes}”
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 text-sm dark:border-slate-700/70 dark:bg-slate-800/40">
                                    <p className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {t('checkout.itemCountLabel', { count: order.items.length })}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {formatPrice(order.subtotal)}
                                        </span>
                                    </p>
                                    <p className="mt-2 flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {t('checkout.deliveryCharge')}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {order.deliveryCharge === 0
                                                ? t('checkout.free')
                                                : formatPrice(order.deliveryCharge)}
                                        </span>
                                    </p>
                                    <p className="mt-2 flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {t('checkout.deliveryTime')}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {order.estimatedDelivery}
                                        </span>
                                    </p>
                                    <p className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3 dark:border-slate-700/70">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {t('checkout.total')}
                                        </span>
                                        <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                                            {formatPrice(order.total)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default OrderHistory;
