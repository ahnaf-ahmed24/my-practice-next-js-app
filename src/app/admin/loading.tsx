export default function AdminLoading() {
    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-slate-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-slate-600/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
                <div className="space-y-6">
                    <div className="h-32 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {[0, 1, 2, 3, 4, 5].map((key) => (
                            <div
                                key={key}
                                className="h-24 animate-pulse rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60"
                            />
                        ))}
                    </div>
                    <div className="h-12 animate-pulse rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
                    <div className="h-72 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
                </div>
            </div>
        </div>
    );
}
