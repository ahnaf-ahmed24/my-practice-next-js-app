'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/order-status';
import type { AdminOrderView } from '@/lib/order-views';
import { formatDateTime, formatRelativeTime } from '@/components/admin/format';

export const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Awaiting approval',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    processing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    shipped: 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
    delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
};

const STATUS_ICONS: Record<OrderStatus, string> = {
    pending: '⏳',
    processing: '📦',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '✖️',
};

// অ্যাডমিন প্যানেলের একটি অর্ডার কার্ড — অনুমোদন ও লাইভ ট্র্যাকিং
const AdminOrderCard = ({
    order,
    onChanged,
}: {
    order: AdminOrderView;
    onChanged: () => void;
}) => {
    const [status, setStatus] = useState<OrderStatus>(order.status);
    const [note, setNote] = useState('');
    const [location, setLocation] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // সার্ভার থেকে নতুন অবস্থা এলে ড্রপডাউনে সিঙ্ক হয়
    const [syncedStatus, setSyncedStatus] = useState(order.status);
    if (syncedStatus !== order.status) {
        setSyncedStatus(order.status);
        setStatus(order.status);
    }

    const targets = ORDER_STATUS_TRANSITIONS[order.status];

    const sendUpdate = async (nextStatus: OrderStatus) => {
        setSaving(true);

        try {
            const response = await fetch(`/api/admin/orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus, note, location }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                toast.error(data?.error ?? 'Could not update the order.');
                return;
            }

            toast.success(
                nextStatus === 'processing'
                    ? `Order #${order.id} approved — processing started.`
                    : `Shipment update sent for #${order.id}.`,
            );

            setNote('');
            setLocation('');
            onChanged();
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // অর্ডার মুছে ফেলা — সব অবস্থাতেই কাজ করে
    const handleDelete = async () => {
        setDeleting(true);

        try {
            const response = await fetch(`/api/admin/orders/${order.id}`, { method: 'DELETE' });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                toast.error(data?.error ?? 'Could not delete the order.');
                return;
            }

            toast.success(`Order #${order.id} deleted.`);
            onChanged();
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    return (
        <li className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 backdrop-blur transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/60">
            {/* হেডার */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5 dark:border-slate-700/60">
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        #{order.id}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {order.customerName} · {order.customerEmail || 'no email'} ·{' '}
                        {formatDateTime(order.createdAt)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        📍 {order.address.area}, {order.address.thana}, {order.address.district},{' '}
                        {order.address.division} · {order.address.phone}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[order.status]}`}
                    >
                        {STATUS_ICONS[order.status]} {STATUS_LABELS[order.status]}
                    </span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatPrice(order.total)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.paymentMethod} · {order.items.length} item
                        {order.items.length === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            {/* পণ্য */}
            <ul className="space-y-2 px-4 pt-4 sm:px-5">
                {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-300">
                            {item.icon ? `${item.icon} ` : ''}
                            {item.name}
                        </span>
                        <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                            {formatPrice(item.price)}
                        </span>
                    </li>
                ))}
            </ul>

            {/* অনুমোদন ও ট্র্যাকিং আপডেট */}
            <div className="mt-4 space-y-3 border-t border-slate-200/60 px-4 py-4 sm:px-5 dark:border-slate-700/60">
                {order.status === 'pending' ? (
                    <button
                        type="button"
                        onClick={() => sendUpdate('processing')}
                        disabled={saving}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-[length:200%_auto] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/25 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? 'Approving…' : '✓ Approve & start processing'}
                    </button>
                ) : (
                    <p className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                        ✓ Order processing approved
                        {order.approvedBy ? ` by ${order.approvedBy}` : ''}
                        {order.approvedAt ? ` · ${formatRelativeTime(order.approvedAt)}` : ''}
                    </p>
                )}

                {/* স্ট্যাটাস বদলানো ও লাইভ ট্র্যাকিং নোট */}
                <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Status
                        </span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value as OrderStatus)}
                            disabled={saving || targets.length === 0}
                            className="mt-1 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white"
                        >
                            <option value={order.status}>{STATUS_LABELS[order.status]}</option>
                            {targets.map((target) => (
                                <option key={target} value={target}>
                                    {STATUS_LABELS[target]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Tracking note
                        </span>
                        <input
                            type="text"
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder="Left Dhaka warehouse"
                            maxLength={200}
                            className="mt-1 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </label>

                    <label className="block">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Location
                        </span>
                        <input
                            type="text"
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="Dhaka"
                            maxLength={80}
                            className="mt-1 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </label>
                </div>

                <button
                    type="button"
                    onClick={() => sendUpdate(status)}
                    disabled={saving || targets.length === 0}
                    className="w-full rounded-xl bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-800 bg-[length:200%_auto] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-900/20 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
                >
                    {saving ? 'Sending…' : 'Send shipment update'}
                </button>

                {/* অর্ডার মুছে ফেলা — সব অবস্থাতেই কাজ করে */}
                <div className="border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
                    {confirmDelete ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 dark:border-rose-900/70 dark:bg-rose-950/30">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                                Delete order #{order.id}? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(false)}
                                    disabled={deleting}
                                    className="rounded-lg border border-slate-300/70 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition-colors hover:border-slate-400 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="rounded-lg bg-gradient-to-r from-rose-600 to-red-700 bg-[length:200%_auto] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-rose-600/25 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? 'Deleting…' : 'Yes, delete'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/70 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        >
                            🗑 Delete order
                        </button>
                    )}
                </div>
            </div>

            {/* ট্র্যাকিং টাইমলাইন */}
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className="w-full border-t border-slate-200/60 bg-slate-50/60 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors duration-300 hover:text-indigo-600 sm:px-5 dark:border-slate-700/60 dark:bg-slate-800/30 dark:text-slate-400 dark:hover:text-indigo-300"
            >
                {expanded
                    ? 'Hide tracking history'
                    : `Tracking history (${order.tracking.length})`}
            </button>

            {expanded && (
                <div className="border-t border-slate-200/60 px-4 py-4 sm:px-5 dark:border-slate-700/60">
                    {order.tracking.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No shipment updates yet.
                        </p>
                    ) : (
                        <ol className="space-y-3">
                            {order.tracking.map((event) => (
                                <li key={event.id} className="flex gap-3">
                                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs dark:bg-indigo-950/70">
                                        {STATUS_ICONS[event.status]}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                            {event.note || STATUS_LABELS[event.status]}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {STATUS_LABELS[event.status]}
                                            {event.location ? ` · ${event.location}` : ''} ·{' '}
                                            {formatDateTime(event.createdAt)} ·{' '}
                                            {formatRelativeTime(event.createdAt)}
                                            {event.createdBy ? ` · ${event.createdBy}` : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </li>
    );
};

export default AdminOrderCard;
