'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { formatPrice } from '@/lib/currency';
import type { OrderStatus } from '@/lib/order-status';
import type { AdminOrderView, AdminRequestView } from '@/lib/order-views';
import AdminOrderCard, { STATUS_LABELS } from '@/components/admin/AdminOrderCard';
import AdminApprovalList from '@/components/admin/AdminApprovalList';
import { formatRelativeTime } from '@/components/admin/format';

// কত সেকেন্ড পরপর অ্যাডমিন ড্যাটা রিফ্রেশ হবে (লাইভ আপডেট)
const POLL_INTERVAL = 8000;

type Tab = 'orders' | 'approvals';
type Filter = 'all' | OrderStatus;

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All orders' },
    { id: 'pending', label: 'Awaiting approval' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
];

// অ্যাডমিন প্যানেল — অর্ডার অনুমোদন, অ্যাডমিন অনুমোদন ও লাইভ শিপমেন্ট ট্র্যাকিং
const AdminConsole = ({
    initialOrders,
    initialRequests,
    adminName,
    isInitialAdmin,
}: {
    initialOrders: AdminOrderView[];
    initialRequests: AdminRequestView[];
    adminName: string;
    isInitialAdmin: boolean;
}) => {
    const router = useRouter();

    const [orders, setOrders] = useState(initialOrders);
    const [requests, setRequests] = useState(initialRequests);
    const [tab, setTab] = useState<Tab>('orders');
    const [filter, setFilter] = useState<Filter>('all');
    const [lastSync, setLastSync] = useState(() => new Date().toISOString());
    const [now, setNow] = useState(() => Date.now());
    const [steppingDown, setSteppingDown] = useState(false);

    // সার্ভার থেকে আসা প্রাথমিক ড্যাটা বদলালে সিঙ্ক হয়
    const [syncedOrders, setSyncedOrders] = useState(initialOrders);
    if (syncedOrders !== initialOrders) {
        setSyncedOrders(initialOrders);
        setOrders(initialOrders);
    }

    const [syncedRequests, setSyncedRequests] = useState(initialRequests);
    if (syncedRequests !== initialRequests) {
        setSyncedRequests(initialRequests);
        setRequests(initialRequests);
    }

    // ড্যাটা রিফ্রেশ — অর্ডার ও অ্যাডমিন অনুরোধ
    const refresh = useCallback(async () => {
        try {
            const [ordersResponse, requestsResponse] = await Promise.all([
                fetch('/api/admin/orders', { cache: 'no-store' }),
                fetch('/api/admin/requests', { cache: 'no-store' }),
            ]);

            if (ordersResponse.ok) {
                const data = await ordersResponse.json();
                if (Array.isArray(data.orders)) setOrders(data.orders);
            }

            if (requestsResponse.ok) {
                const data = await requestsResponse.json();
                if (Array.isArray(data.requests)) setRequests(data.requests);
            }

            setLastSync(new Date().toISOString());
        } catch {
            // নেটওয়ার্ক সমস্যা — পরের টিকে আবার চেষ্টা হবে
        }
    }, []);

    // লাইভ পোলিং
    useEffect(() => {
        const timer = setInterval(refresh, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [refresh]);

    // "X ago" লেবেল আপডেট রাখতে টাইমার
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10_000);
        return () => clearInterval(timer);
    }, []);

    const stats = useMemo(
        () => ({
            total: orders.length,
            pending: orders.filter((order) => order.status === 'pending').length,
            inTransit: orders.filter((order) => order.status === 'shipped').length,
            delivered: orders.filter((order) => order.status === 'delivered').length,
            revenue: orders.reduce((sum, order) => sum + order.total, 0),
            requests: requests.filter((request) => request.status === 'pending').length,
        }),
        [orders, requests],
    );

    const visibleOrders = useMemo(
        () => (filter === 'all' ? orders : orders.filter((order) => order.status === filter)),
        [orders, filter],
    );

    const handleSignOut = async () => {
        await authClient.signOut();
        toast.success('Signed out.');
        router.push('/admin/login');
        router.refresh();
    };

    // অ্যাডমিন পদ ছাড়া — রোল 'user' হয়ে গেলে অ্যাডমিন স্কোপের সেশনে আর কিছুই চলে না,
    // তাই সাইন আউট করে হোমপেজে পাঠানো হয় (আবার কাস্টমার প্যানেলে লগইন করলেই হবে)
    const handleStepDown = async () => {
        if (steppingDown) return;
        setSteppingDown(true);

        try {
            const response = await fetch('/api/admin/step-down', { method: 'POST' });
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                toast.error(data?.error ?? 'Could not step down.');
                return;
            }

            await authClient.signOut();
            toast.success('You are no longer an administrator.');
            router.push('/');
            router.refresh();
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSteppingDown(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ===== হেডার ===== */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60">
                <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>
                        Live · updated {formatRelativeTime(lastSync, now)}
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        NextMart Control Center
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Signed in as{' '}
                        <span className="font-bold text-slate-900 dark:text-white">{adminName}</span>
                        {isInitialAdmin && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                Initial administrator
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* পদ ছাড়া — প্রাথমিক অ্যাডমিন ছাড়া সব অ্যাডমিনের জন্য */}
                    {!isInitialAdmin && (
                        <button
                            type="button"
                            onClick={handleStepDown}
                            disabled={steppingDown}
                            className="rounded-xl border border-amber-300/70 bg-amber-50/70 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-amber-700 transition-colors hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-800/70 dark:bg-slate-900/70 dark:text-amber-300 dark:hover:bg-amber-950/40"
                        >
                            {steppingDown ? 'Stepping down…' : 'Step down'}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="rounded-xl border border-slate-300/70 bg-white/70 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-600 transition-colors hover:border-rose-400 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-rose-500 dark:hover:text-rose-400"
                    >
                        Sign out
                    </button>
                </div>
            </div>

            {/* ===== পরিসংখ্যান ===== */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total orders" value={String(stats.total)} icon="📦" />
                <StatCard
                    label="Awaiting approval"
                    value={String(stats.pending)}
                    icon="⏳"
                    highlight={stats.pending > 0}
                />
                <StatCard label="In transit" value={String(stats.inTransit)} icon="🚚" />
                <StatCard label="Delivered" value={String(stats.delivered)} icon="✅" />
                <StatCard label="Revenue" value={formatPrice(stats.revenue)} icon="💰" />
                <StatCard
                    label="Admin requests"
                    value={String(stats.requests)}
                    icon="🛡️"
                    highlight={stats.requests > 0}
                />
            </div>

            {/* ===== ট্যাব ===== */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-1 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                {(
                    [
                        { id: 'orders', label: 'Orders & tracking' },
                        { id: 'approvals', label: 'Administrator approvals' },
                    ] as const
                ).map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                            tab === item.id
                                ? 'bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-800 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                    >
                        {item.label}
                        {item.id === 'approvals' && stats.requests > 0 && (
                            <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                                {stats.requests}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ===== অর্ডার ট্যাব ===== */}
            {tab === 'orders' && (
                <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60">
                    {/* ফিল্টার */}
                    <div className="flex flex-wrap gap-2">
                        {FILTERS.map((item) => {
                            const count =
                                item.id === 'all'
                                    ? orders.length
                                    : orders.filter((order) => order.status === item.id).length;

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFilter(item.id)}
                                    className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${
                                        filter === item.id
                                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                                            : 'border-slate-200/70 bg-white/60 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-indigo-300'
                                    }`}
                                >
                                    {item.label}
                                    <span className="ml-1.5 opacity-60">{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {visibleOrders.length === 0 ? (
                        <p className="mt-6 rounded-2xl border border-dashed border-slate-300/80 bg-white/50 p-10 text-center text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-400">
                            {filter === 'all'
                                ? 'No orders yet. New orders appear here automatically.'
                                : `No ${STATUS_LABELS[filter as OrderStatus].toLowerCase()} orders right now.`}
                        </p>
                    ) : (
                        <ul className="mt-5 space-y-4">
                            {visibleOrders.map((order) => (
                                <AdminOrderCard key={order.id} order={order} onChanged={refresh} />
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {/* ===== অ্যাডমিন অনুমোদন ট্যাব ===== */}
            {tab === 'approvals' && (
                <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <AdminApprovalList
                        requests={requests}
                        isInitialAdmin={isInitialAdmin}
                        onChanged={refresh}
                    />
                </section>
            )}
        </div>
    );
};

// ছোট পরিসংখ্যান কার্ড
const StatCard = ({
    label,
    value,
    icon,
    highlight = false,
}: {
    label: string;
    value: string;
    icon: string;
    highlight?: boolean;
}) => (
    <div
        className={`rounded-2xl border p-3 text-center shadow-sm backdrop-blur sm:p-4 ${
            highlight
                ? 'border-amber-300/80 bg-amber-50/80 dark:border-amber-800/70 dark:bg-amber-950/30'
                : 'border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60'
        }`}
    >
        <span className="text-xl">{icon}</span>
        <p className="mt-1 truncate text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">
            {value}
        </p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {label}
        </p>
    </div>
);

export default AdminConsole;
