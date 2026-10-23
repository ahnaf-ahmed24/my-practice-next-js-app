'use client';

import { useState } from 'react';

// পাসওয়ার্ড ফিল্ডে শো/হাইড টগল — লগইন ও সাইনআপ ফর্মে ব্যবহার হয়
const PasswordInput = ({
    id,
    autoComplete,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    autoComplete: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
}) => {
    const [show, setShow] = useState(false);

    return (
        <div className="relative mt-2">
            <input
                id={id}
                type={show ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete={autoComplete}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
            />
            <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
                {show ? (
                    // eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                ) : (
                    // eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
