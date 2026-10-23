'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { SCOPE_HEADER } from '@/lib/auth-constants';
import { getSessionScope } from '@/lib/session-scope';
import PasswordInput from '@/components/PasswordInput';

type Mode = 'sign-in' | 'register';

type Notice = {
    tone: 'error' | 'success' | 'info';
    text: string;
} | null;

type AdminMe = {
    role: string;
    isAdmin: boolean;
    isInitialAdmin: boolean;
    scope: 'admin' | 'customer';
    request: { status: 'pending' | 'approved' | 'rejected'; requestedAt: string } | null;
};

// শুধু অ্যাডমিন প্যানেলের ভেতরে রিডাইরেক্ট (ওপেন রিডাইরেক্ট এড়ানো)
// অ্যাডমিনের প্রোফাইলেই কন্ট্রোল প্যানেল দেখা যায়
const safeNext = (value: string | null) => {
    if (!value || value.startsWith('//')) return '/profile';
    return value === '/profile' || value.startsWith('/admin') ? value : '/profile';
};

const noticeStyles: Record<NonNullable<Notice>['tone'], string> = {
    error: 'border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300',
    success: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300',
    info: 'border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300',
};

// অ্যাডমিন প্যানেলের লগইন ও রেজিস্ট্রেশন প্যানেল
const AdminLoginPanel = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = safeNext(searchParams.get('next'));

    const [mode, setMode] = useState<Mode>('sign-in');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [notice, setNotice] = useState<Notice>(null);
    const [me, setMe] = useState<AdminMe | null>(null);
    // অ্যাডমিন প্যানেলে ঢোকা ব্যর্থ হলে সেটি দেখানো হবে (অপেক্ষমাণ স্ক্রিন এড়ানো)
    const [rejected, setRejected] = useState(false);

    const { data: session, isPending } = authClient.useSession();

    // অ্যাডমিন স্কোপ + অ্যাডমিন রোল — দুটোই থাকতেই অ্যাডমিন প্যানেলে ঢোকা যায়
    const isAdmin =
        session?.user?.role === 'admin' && getSessionScope(session) === 'admin';
    const userId = session?.user?.id;

    // লগইন করা অ্যাডমিন — সরাসরি ড্যাশবোর্ডে পাঠাও
    useEffect(() => {
        if (isAdmin) router.replace(next);
    }, [isAdmin, next, router]);

    // লগইন করা কিন্তু অ্যাডমিন নন — নিজের অনুমোদনের অবস্থা দেখাও
    useEffect(() => {
        if (!userId || isAdmin) return;

        let cancelled = false;

        fetch('/api/admin/me')
            .then((response) => (response.ok ? response.json() : null))
            .then((data: AdminMe | null) => {
                if (!cancelled && data) setMe(data);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [userId, isAdmin]);

    // ===== লগইন =====
    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setNotice(null);

        try {
            const result = await authClient.signIn.email({
                email,
                password,
                // অ্যাডমিন প্যানেল — সেশনের স্কোপ 'admin' হতে চায়
                // (স্কোপ কেবল সত্যিকারের অ্যাডমিনকেই দেওয়া হয়, সার্ভারে যাচাই করে)
                fetchOptions: { headers: { [SCOPE_HEADER]: 'admin' } },
            });

            if (result.error) {
                setNotice({ tone: 'error', text: result.error.message ?? 'Invalid email or password.' });
                return;
            }

            const current = await authClient.getSession();

            // স্কোপ 'admin' না হলে এই অ্যাকাউন্ট অ্যাডমিন প্যানেলে ঢুকতে পারে না
            if (getSessionScope(current.data) === 'admin') {
                toast.success('Signed in to the admin panel.');
                router.replace(next);
                router.refresh();
                return;
            }

            // সাধারণ গ্রাহক — সেশন বাতিল করে দেওয়া হচ্ছে
            await authClient.signOut();
            setRejected(true);

            setNotice({
                tone: 'error',
                text: 'This account does not have administrator access. New administrator accounts need approval from the initial administrator.',
            });
        } catch {
            setNotice({ tone: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    // ===== রেজিস্ট্রেশন =====
    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setNotice(null);

        try {
            const response = await fetch('/api/admin/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                setNotice({
                    tone: 'error',
                    text: data?.error ?? 'Could not create the administrator account.',
                });
                return;
            }

            // রেজিস্ট্রেশনের সময় তৈরি সাধারণ সেশন বাতিল করা হচ্ছে —
            // এরপর অ্যাডমিন-স্কোপ সেশন তৈরি হবে
            await authClient.signOut().catch(() => null);

            if (data?.status === 'active') {
                // প্রথম অ্যাডমিন — অ্যাডমিন-স্কোপ সেশন তৈরি করে সরাসরি কন্ট্রোল প্যানেলে
                const signIn = await authClient.signIn.email({
                    email,
                    password,
                    fetchOptions: { headers: { [SCOPE_HEADER]: 'admin' } },
                });

                if (signIn.error) {
                    setNotice({
                        tone: 'error',
                        text: 'Account created, but sign in failed. Please sign in again.',
                    });
                    setMode('sign-in');
                    return;
                }

                toast.success('You are now the initial administrator of NextMart.');
                router.replace('/profile');
                router.refresh();
                return;
            }

            if (data?.status === 'pending') {
                setNotice({
                    tone: 'info',
                    text: 'Your administrator account has been created and is waiting for approval by the initial administrator. You will be able to sign in once it is approved.',
                });
                setMode('sign-in');
                return;
            }

            setNotice({
                tone: 'info',
                text: 'Account created. Verify your email, then sign in with your administrator credentials.',
            });
            setMode('sign-in');
        } catch {
            setNotice({ tone: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    // ===== লগইন করা কিন্তু অ্যাডমিন নন =====
    if (session && !isAdmin && !isPending && !rejected) {
        return (
            <PendingState me={me} onSignOut={async () => {
                await authClient.signOut();
                setMe(null);
                setRejected(false);
                router.refresh();
            }} />
        );
    }

    const isRegister = mode === 'register';

    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-slate-600/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                {/* লোগো ও শিরোনাম */}
                <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-indigo-700 to-purple-800 text-2xl shadow-lg shadow-indigo-900/30">
                        🛡️
                    </span>
                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        NextMart Control Center
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {isRegister
                            ? 'Register an administrator account.'
                            : 'Administrator sign in — orders, approvals and live shipment tracking.'}
                    </p>
                </div>

                {/* মোড টগল */}
                <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-1 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                    {(
                        [
                            { id: 'sign-in', label: 'Admin sign in' },
                            { id: 'register', label: 'Register admin' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setMode(tab.id);
                                setNotice(null);
                            }}
                            className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                                mode === tab.id
                                    ? 'bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-800 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ফর্ম */}
                <form
                    onSubmit={isRegister ? handleRegister : handleSignIn}
                    className="mt-5 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60"
                >
                    {isRegister && (
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Full name</span>
                            <input
                                type="text"
                                required
                                autoComplete="name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Jane Doe"
                                className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                            />
                        </label>
                    )}

                    <label className={`block ${isRegister ? 'mt-5' : ''}`}>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="admin@example.com"
                            className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </label>

                    <label className="mt-5 block">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Password</span>
                        <PasswordInput
                            id="admin-password"
                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={setPassword}
                            placeholder="••••••••"
                        />
                        {isRegister && (
                            <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
                                Minimum 8 characters.
                            </span>
                        )}
                    </label>

                    {notice && (
                        <p
                            role="status"
                            className={`mt-5 rounded-xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.tone]}`}
                        >
                            {notice.text}
                        </p>
                    )}

                    {isRegister && (
                        <p className="mt-4 rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-700/70 dark:bg-slate-800/40 dark:text-slate-400">
                            The very first administrator registered here becomes the{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                initial administrator
                            </span>{' '}
                            automatically. Every later administrator registration stays pending until the
                            initial administrator approves it.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-800 bg-[length:200%_auto] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-900/25 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading
                            ? 'Please wait…'
                            : isRegister
                              ? 'Create administrator account'
                              : 'Sign in to admin panel'}
                    </button>
                </form>

                {/* ক্লায়েন্ট প্যানেলে ফেরত */}
                <p className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                        ← Customer sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

// অ্যাডমিন রোল না পাওয়া ইউজারদের জন্য — অনুমোদনের অবস্থা দেখায়
const PendingState = ({
    me,
    onSignOut,
}: {
    me: AdminMe | null;
    onSignOut: () => void;
}) => {
    const status = me?.request?.status;

    const copy = {
        pending: {
            title: 'Approval pending',
            body: 'Your administrator account is waiting for the initial administrator to approve it. You will be able to sign in to this panel right after that.',
            tone: 'text-amber-600 dark:text-amber-400',
            ring: 'border-amber-200/80 bg-amber-50/90 dark:border-amber-900/70 dark:bg-amber-950/40',
        },
        rejected: {
            title: 'Request rejected',
            body: 'Your administrator registration was rejected by the initial administrator. This account stays a regular customer account.',
            tone: 'text-rose-600 dark:text-rose-400',
            ring: 'border-rose-200/80 bg-rose-50/90 dark:border-rose-900/70 dark:bg-rose-950/40',
        },
        approved: {
            title: 'Approved',
            body: 'Your account was approved. Sign out and sign in again to open the admin panel.',
            tone: 'text-emerald-600 dark:text-emerald-400',
            ring: 'border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/40',
        },
        none: {
            title: 'No administrator access',
            body: 'This account is signed in but it does not have administrator access, and there is no administrator registration for it.',
            tone: 'text-slate-600 dark:text-slate-400',
            ring: 'border-slate-200/80 bg-slate-50/90 dark:border-slate-700/70 dark:bg-slate-800/40',
        },
    }[status ?? 'none'];

    // কাস্টমার প্যানেলে লগইন করা অ্যাডমিন — এখানে এসে অ্যাডমিন প্যানেলে ঢুকতে হবে
    const isCustomerSignedAdmin = me?.isAdmin === true && me?.scope !== 'admin';

    const title = isCustomerSignedAdmin ? 'Signed in as a customer' : copy.title;
    const body = isCustomerSignedAdmin
        ? 'You are signed in through the customer panel. Sign out first, then sign in here to open the administrator panel.'
        : copy.body;

    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400/20 via-indigo-400/20 to-purple-500/20 blur-3xl" />

            <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-indigo-700 to-purple-800 text-2xl shadow-lg shadow-indigo-900/30">
                        🛡️
                    </span>
                    <h1 className={`mt-5 text-2xl font-extrabold tracking-tight ${copy.tone}`}>
                        {title}
                    </h1>
                </div>

                <div className={`mt-8 rounded-3xl border p-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${copy.ring}`}>
                    {body}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onSignOut}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-800 bg-[length:200%_auto] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-900/25 transition-all duration-500 hover:bg-right active:scale-95"
                    >
                        Sign out
                    </button>
                    <Link
                        href="/"
                        className="flex-1 rounded-2xl border border-slate-300/70 bg-white/70 px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-slate-600 transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                    >
                        Back to store
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPanel;
