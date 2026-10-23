import Link from 'next/link';
import { categories, countCategoryProducts } from '@/lib/data';

const ProductCategories = () => {
    return (
        <section id="categories" className="relative mx-auto max-w-6xl px-4 pb-24 sm:px-6">
            {/* সেকশন হেডার */}
            <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                    🗂️ Browse Catalog
                </span>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                    Shop by <span className="gradient-text">Category</span>
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Six curated departments, thousands of handpicked products —
                    everything you need, all in one place.
                </p>
            </div>

            {/* ক্যাটাগরি কার্ড গ্রিড */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Link
                        key={category.name}
                        href={`/categories/${category.slug}`}
                        className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-indigo-500/10"
                    >
                        {/* আইকন টাইল */}
                        <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} text-2xl shadow-lg shadow-indigo-500/25 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                            {category.icon}
                        </span>

                        <div className="mt-4 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                                {category.name}
                            </h3>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {countCategoryProducts(category)} items
                            </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            {category.desc}
                        </p>

                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                            Explore
                            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </span>
                    </Link>
                ))}
            </div>

            {/* সব ক্যাটাগরি লিংক */}
            <div className="mt-12 text-center">
                <Link
                    href="/learn-more"
                    className="group inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 bg-white/70 px-8 py-4 text-sm font-bold uppercase tracking-wide text-slate-700 backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                >
                    How it works
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
            </div>
        </section>
    );
};

export default ProductCategories;
