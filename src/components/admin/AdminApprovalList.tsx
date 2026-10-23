'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { AdminRequestView } from '@/lib/order-views';
import { formatDateTime, formatRelativeTime } from '@/components/admin/format';

const STATUS_STYLES: Record<AdminRequestView['status'], string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
};

// অ্যাডমিন অনুমোদনের অনুরোধের তালিকা — অনুমোদন একমাত্র ইনিশিয়াল অ্যাডমিন করতে পারেন
const AdminApprovalList = ({
    requests,
    isInitialAdmin,
    onChanged,
}: {
    requests: AdminRequestView[];
    isInitialAdmin: boolean;
    onChanged: () => void;
}) => {
    const [busyId, setBusyId] = useState<string | null>(null);
    const [note, setNote] = useState<Record<string, string>>({});

    const pending = requests.filter((request) => request.status === 'pending');
    const reviewed = requests.filter((request) => request.status !== 'pending');

    const decide = async (request: AdminRequestView, decision: 'approve' | 'reject') => {
        setBusyId(request.id);

        try {
            const response = await fetch(`/api/admin/requests/${request.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ decision, note: note[request.id] ?? '' }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                toast.error(data?.error ?? 'Could not review the request.');
                return;
            }

            toast.success(
                decision === 'approve'
                    ? `${request.name} is now an administrator.`
                    : `${request.name}'s request was rejected.`,
            );

            onChanged();
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* কার সিদ্ধান্তের ওপর নির্ভর করে */}
            <p
                className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                    isInitialAdmin
                        ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300'
                }`}
            >
                {isInitialAdmin
                    ? '🛡️ You are the initial administrator — you can approve or reject every new administrator registration.'
                    : '⏳ Only the initial administrator can approve new administrator registrations. You can still review the list below.'}
            </p>

            {/* অপেক্ষমাণ অনুরোধ */}
            <section>
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Pending requests ({pending.length})
                </h3>

                {pending.length === 0 ? (
                    <p className="mt-3 rounded-2xl border border-dashed border-slate-300/80 bg-white/50 p-6 text-center text-sm text-slate-500 dark:border-slate-700/80 dark:bg-slate-900/40 dark:text-slate-400">
                        No administrator requests are waiting for approval.
                    </p>
                ) : (
                    <ul className="mt-3 space-y-3">
                        {pending.map((request) => (
                            <li
                                key={request.id}
                                className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 backdrop-blur sm:p-5 dark:border-slate-700/70 dark:bg-slate-900/60"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                                            {request.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                            {request.email}
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            Requested {formatDateTime(request.requestedAt)} ·{' '}
                                            {formatRelativeTime(request.requestedAt)}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[request.status]}`}
                                    >
                                        Pending
                                    </span>
                                </div>

                                <label className="mt-4 block">
                                    <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                        Review note (optional)
                                    </span>
                                    <input
                                        type="text"
                                        value={note[request.id] ?? ''}
                                        onChange={(event) =>
                                            setNote((prev) => ({
                                                ...prev,
                                                [request.id]: event.target.value,
                                            }))
                                        }
                                        maxLength={300}
                                        placeholder="Verified with the operations team"
                                        className="mt-1 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                                    />
                                </label>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => decide(request, 'approve')}
                                        disabled={!isInitialAdmin || busyId === request.id}
                                        className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-[length:200%_auto] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/25 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {busyId === request.id ? 'Working…' : '✓ Approve'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decide(request, 'reject')}
                                        disabled={!isInitialAdmin || busyId === request.id}
                                        className="rounded-xl border border-rose-200/70 bg-white/70 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/70 dark:bg-slate-900/70 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                    >
                                        ✕ Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* পর্যালোচিত */}
            {reviewed.length > 0 && (
                <section>
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Reviewed ({reviewed.length})
                    </h3>

                    <ul className="mt-3 space-y-2">
                        {reviewed.map((request) => (
                            <li
                                key={request.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/50"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                        {request.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        {request.email}
                                        {request.reviewedAt
                                            ? ` · reviewed ${formatDateTime(request.reviewedAt)}`
                                            : ''}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[request.status]}`}
                                >
                                    {request.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default AdminApprovalList;
