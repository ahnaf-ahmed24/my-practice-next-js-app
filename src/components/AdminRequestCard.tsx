'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from '@/components/LanguageProvider';

export type AdminRequestState = {
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string; // সার্ভার ফরম্যাট করে পাঠায় (হাইড্রেশন মিল থাকে)
    reviewedAt: string | null;
    note: string | null;
};

type AdminRequestCardProps = {
    name: string;
    email: string;
    isAdmin: boolean;
    request: AdminRequestState | null;
};

// গ্রাহকের ড্যাশবোর্ডের অ্যাডমিন রেজিস্ট্রেশন কার্ড —
// কাস্টমার অ্যাকাউন্টের নাম ও ইমেইল দিয়ে অ্যাডমিন আবেদন, অবস্থা দেখায়
const AdminRequestCard = ({ name, email, isAdmin, request }: AdminRequestCardProps) => {
    const router = useRouter();
    const t = useTranslations();
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            // নাম ও ইমেইল পাঠানো হয় না — সার্ভার সেশন থেকেই নেয়
            const response = await fetch('/api/admin/requests', { method: 'POST' });
            const data = (await response.json().catch(() => null)) as
                | { status?: string; error?: string }
                | null;

            if (!response.ok) {
                toast.error(data?.error ?? t('profile.adminRequestFailed'));
                return;
            }

            toast.success(
                data?.status === 'active'
                    ? t('profile.adminRequestActive')
                    : t('profile.adminRequestSent'),
            );
            router.refresh(); // সার্ভার থেকে নতুন অবস্থা আসবে
        } catch {
            toast.error(t('profile.networkError'));
        } finally {
            setSubmitting(false);
        }
    };

    // অনুমোদিত অ্যাডমিন — অ্যাডমিন প্যানেলে লগইনের নির্দেশনা
    if (isAdmin) {
        return (
            <section className="rounded-3xl border border-emerald-200/80 bg-emerald-50/90 p-6 shadow-sm backdrop-blur dark:border-emerald-900/70 dark:bg-emerald-950/40">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    {t('profile.adminRequestTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-emerald-800 dark:text-emerald-300">
                    {t('profile.adminRequestApproved')}
                </p>
                <Link
                    href="/admin/login"
                    className="mt-4 inline-block rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-[length:200%_auto] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-600/25 transition-all duration-500 hover:bg-right active:scale-95"
                >
                    {t('profile.adminRequestOpenPanel')}
                </Link>
            </section>
        );
    }

    // অনুরোধ অনুমোদনের অপেক্ষায়
    if (request?.status === 'pending') {
        return (
            <section className="rounded-3xl border border-amber-200/80 bg-amber-50/90 p-6 shadow-sm backdrop-blur dark:border-amber-900/70 dark:bg-amber-950/40">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    {t('profile.adminRequestTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                    ⏳ {t('profile.adminRequestPending')}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                    {t('profile.adminRequestPendingHint')}
                </p>
                <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-400/80">
                    {t('profile.adminRequestRequestedAt', { date: request.requestedAt })}
                </p>
            </section>
        );
    }

    // বাতিল হলে আবার আবেদন করা যায়
    if (request?.status === 'rejected') {
        return (
            <section className="rounded-3xl border border-rose-200/80 bg-rose-50/90 p-6 shadow-sm backdrop-blur dark:border-rose-900/70 dark:bg-rose-950/40">
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                    {t('profile.adminRequestTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-rose-800 dark:text-rose-300">
                    ✕ {t('profile.adminRequestRejected')}
                </p>
                {request.note && (
                    <p className="mt-2 text-xs leading-relaxed text-rose-700/90 dark:text-rose-400/90">
                        {t('profile.adminRequestNote', { note: request.note })}
                    </p>
                )}
                <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="mt-4 rounded-xl border border-rose-300/70 bg-white/70 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-800/70 dark:bg-slate-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                    {submitting ? t('profile.adminRequestSubmitting') : t('profile.adminRequestRetry')}
                </button>
            </section>
        );
    }

    // নতুন আবেদন
    return (
        <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                {t('profile.adminRequestTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {t('profile.adminRequestDesc')}
            </p>
            <p className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700/70 dark:bg-slate-800/50 dark:text-slate-300">
                {t('profile.adminRequestUsing', { name, email })}
            </p>
            <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-700 bg-[length:200%_auto] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-600/25 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? t('profile.adminRequestSubmitting') : t('profile.adminRequestSubmit')}
            </button>
        </section>
    );
};

export default AdminRequestCard;
