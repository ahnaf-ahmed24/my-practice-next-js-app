'use client';

const ThemeToggle = () => {
    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch {
            /* localStorage unavailable — theme applies for this visit only */
        }
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle light and dark mode"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100/80 shadow-sm transition-colors duration-300 hover:border-indigo-300 active:scale-95 md:h-9 md:w-[4.25rem] md:justify-start dark:border-slate-700/60 dark:bg-slate-800/80 dark:hover:border-indigo-500"
        >
            {/* মোবাইলে শুধু আইকন */}
            <span aria-hidden className="text-sm md:hidden">
                ☀️
            </span>
            <span aria-hidden className="hidden text-sm dark:inline md:hidden">
                🌙
            </span>

            {/* ডেস্কটপে স্লাইডিং নব */}
            <span className="absolute left-1 top-1 hidden h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md transition-transform duration-300 ease-out dark:translate-x-[1.75rem] dark:from-indigo-500 dark:to-purple-600 md:block" />

            {/* সূর্য ও চাঁদ আইকন */}
            <span className="absolute left-0 top-0 hidden h-9 w-9 items-center justify-center text-sm md:flex">
                ☀️
            </span>
            <span className="absolute right-0 top-0 hidden h-9 w-9 items-center justify-center text-sm md:flex">
                🌙
            </span>
        </button>
    );
};

export default ThemeToggle;
