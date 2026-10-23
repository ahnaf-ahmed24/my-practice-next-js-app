// লোডিং স্কেলেটন — params রেজল্ভ হওয়া পর্যন্ত পেজের লেআউটের মতো জায়গা দখল রাখে।
// (Cache Components: পুরো পেজ params-এর উপর নির্ভরশীল, তাই পুরো সেগমেন্ট একটি
//  <Suspense> বাউন্ডারির নিচে — এটিই নেক্সটের নির্ধারিত loading.js প্যাটার্ন)
// স্কেলেটন নির্দিষ্ট (deterministic) — এখানে Date.now()/Math.random() চলবে না।
const ProductLoading = () => (
    <div className="relative overflow-hidden">
        {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব (ফাইনাল লেআউটের মতোই) */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            {/* ব্রেডক্রাম্ব */}
            <div className="h-4 w-72 max-w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />

            <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* ছবির জায়গা */}
                <div className="h-72 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/60 sm:h-96" />

                {/* বিস্তারিতের জায়গা */}
                <div className="flex flex-col gap-4">
                    <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="h-10 w-3/4 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="h-9 w-48 animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="space-y-2.5">
                        <div className="h-4 w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                        <div className="h-4 w-5/6 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
                    </div>
                    <div className="mt-2 h-12 w-full animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="mt-2 h-28 w-full animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-700/60" />
                </div>
            </div>

            {/* রিলেটেড প্রোডাক্টের জায়গা */}
            <div className="mt-20 h-8 w-64 max-w-full animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-700/60" />
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-64 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
                <div className="h-64 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
                <div className="h-64 animate-pulse rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
            </div>
        </div>
    </div>
);

export default ProductLoading;
