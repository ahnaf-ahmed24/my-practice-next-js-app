'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { SCOPE_HEADER } from '@/lib/auth-constants';
import PasswordInput from '@/components/PasswordInput';

// লগইন ও সাইনআপ ফর্ম — এক পেজে দুটি মোড
const AuthForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = searchParams.get('next') ?? '/';
    // নেভবার থেকে সরাসরি সাইন-আপ মোডে আসতে ?mode=signup সাপোর্ট
    const initialMode = searchParams.get('mode') === 'signup' ? 'sign-up' : 'sign-in';

    const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // ইমেইল ভেরিফিকেশন প্রয়োজন হলে এই স্টেটে থাকে
    const [awaitingVerify, setAwaitingVerify] = useState(false);
    const [resending, setResending] = useState(false);

    const isSignUp = mode === 'sign-up';

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const result = await authClient.signUp.email({
                    name,
                    email,
                    password,
                    // কাস্টমার প্যানেল — সেশনের স্কোপ 'customer' হবে
                    fetchOptions: { headers: { [SCOPE_HEADER]: 'customer' } },
                });

                if (result.error) {
                    toast.error(result.error.message ?? 'Could not create account.');
                    return;
                }

                // requireEmailVerification চালু থাকলে টোকেন আসে না → ভেরিফিকেশন লিংকের অপেক্ষা
                if (result.data && !result.data.token) {
                    setAwaitingVerify(true);
                    toast.success('Account created! Check your email to verify.');
                    return;
                }

                toast.success('Welcome to NextMart! 🎉');
                router.push(next);
                router.refresh();
            } else {
                const result = await authClient.signIn.email({
                    email,
                    password,
                    // কাস্টমার প্যানেল — সেশনের স্কোপ 'customer' হবে
                    // (অ্যাডমিনও এখান থেকে গ্রাহক হিসেবে ঢুকতে পারে)
                    fetchOptions: { headers: { [SCOPE_HEADER]: 'customer' } },
                });

                if (result.error) {
                    toast.error(result.error.message ?? 'Invalid email or password.');
                    return;
                }

                toast.success('Logged in successfully.');
                router.push(next);
                router.refresh();
            }
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        try {
            const result = await authClient.sendVerificationEmail({
                email,
                callbackURL: '/login',
            });
            if (result.error) {
                toast.error(result.error.message ?? 'Could not resend email.');
                return;
            }
            toast.success('Verification email resent. Check your inbox.');
        } catch {
            toast.error('Network error. Please try again.');
        } finally {
            setResending(false);
        }
    };

    // ভেরিফিকেশনের অপেক্ষায় থাকা স্ক্রিন
    if (awaitingVerify) {
        return (
            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />
                <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 text-center sm:px-6">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-2xl shadow-lg shadow-indigo-500/30">
                        📧
                    </span>
                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Verify your email
                    </h1>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                        We sent a verification link to
                        <br />
                        <span className="break-words font-bold text-slate-900 dark:text-white">{email}</span>.
                        Click it to activate your account.
                    </p>
                    <div className="mt-8 flex flex-col items-center gap-3">
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {resending ? 'Sending…' : 'Resend email'}
                        </button>
                        <button
                            onClick={() => {
                                setAwaitingVerify(false);
                                setMode('sign-in');
                            }}
                            className="text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                        >
                            ← Back to log in
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
                {/* লোগো ও শিরোনাম */}
                <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-2xl shadow-lg shadow-indigo-500/30">
                        🛍️
                    </span>
                    <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {isSignUp
                            ? 'Join NextMart to shop categories and exclusive deals.'
                            : 'Log in to continue shopping.'}
                    </p>
                </div>

                {/* ফর্ম */}
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60"
                >
                    {isSignUp && (
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">Name</span>
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

                    <label className="mt-5 block">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="jane@example.com"
                            className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                        />
                    </label>

                    <label className="mt-5 block">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Password</span>
                        <PasswordInput
                            id="password"
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={setPassword}
                            placeholder="••••••••"
                        />
                        {isSignUp && (
                            <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
                                Minimum 8 characters.
                            </span>
                        )}
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
                    </button>

                    {/* মোড টগল */}
                    <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setMode(isSignUp ? 'sign-in' : 'sign-up');
                            }}
                            className="font-bold text-indigo-600 underline underline-offset-2 transition-colors hover:opacity-80 dark:text-indigo-300"
                        >
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </form>

                {/* হোমে ফেরত */}
                <p className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                        ← Back to home
                    </Link>
                </p>

                {/* অ্যাডমিন প্যানেলের লগইন আলাদা */}
                <p className="mt-3 text-center">
                    <Link
                        href="/admin/login"
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                    >
                        🛡️ Administrator panel
                    </Link>
                </p>
            </div>
        </div>
    );
};

// useSearchParams Suspense বাউন্ডারি চায়
const LoginPage = () => (
    <Suspense>
        <AuthForm />
    </Suspense>
);

export default LoginPage;
