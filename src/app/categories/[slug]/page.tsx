import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, getCategoryBySlug, countCategoryProducts } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

// বিল্ড টাইমে সব বৈধ ক্যাটাগরি স্লগ প্রি-রেন্ডার করা হয়
export const generateStaticParams = () =>
    categories.map((category) => ({ slug: category.slug }));

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const category = getCategoryBySlug(slug);

    if (!category) {
        return { title: 'Category not found — NextMart' };
    }

    return {
        title: `${category.name} — NextMart`,
        description: `${category.desc} Browse subcategories and handpicked products in our ${category.name} collection.`,
    };
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const category = getCategoryBySlug(slug);

    // অচেনা স্লগ → ৪০৪
    if (!category) notFound();

    const totalProducts = countCategoryProducts(category);

    // ফিচার্ড: প্রতিটি সাবক্যাটাগরির প্রথম পণ্য (সর্বোচ্চ ৬টি)
    const featured = category.subcategories
        .map((sub) => sub.products[0])
        .filter(Boolean)
        .slice(0, 6);

    const otherCategories = categories.filter((item) => item.slug !== slug);

    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                {/* ব্রেডক্রাম্ব */}
                <nav aria-label="Breadcrumb" className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Link href="/" className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                        Home
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/#categories" className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                        Categories
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-bold text-slate-900 dark:text-white">{category.name}</span>
                </nav>

                {/* ক্যাটাগরি হেডার */}
                <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <span className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${category.gradient} text-4xl shadow-xl shadow-indigo-500/25`}>
                        {category.icon}
                    </span>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            {category.name}
                        </h1>
                        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                            {category.desc}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                            <span className="gradient-text font-extrabold">{category.subcategories.length}</span> subcategories ·{' '}
                            <span className="gradient-text font-extrabold">{totalProducts}</span> products
                        </p>
                    </div>
                </div>

                {/* সাবক্যাটাগরি */}
                <div className="mt-12">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        Shop by <span className="gradient-text">subcategory</span>
                    </h2>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {category.subcategories.map((sub) => (
                            <Link
                                key={sub.slug}
                                href={`/categories/${category.slug}/${sub.slug}`}
                                className="group flex items-center gap-4 rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-indigo-500/10"
                            >
                                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 transition-transform duration-500 group-hover:scale-110">
                                    <Image
                                        src={sub.products[0].image}
                                        alt={sub.name}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-base font-bold text-slate-900 transition-colors duration-300 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                                        {sub.name}
                                    </span>
                                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        {sub.products.length} products
                                    </span>
                                </span>
                                <span className="shrink-0 text-indigo-500 transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ফিচার্ড পণ্য */}
                <div className="mt-16">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        Featured <span className="gradient-text">picks</span>
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        One handpicked favorite from each subcategory.
                    </p>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {featured.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>

                {/* অন্যান্য ক্যাটাগরি */}
                <div className="mt-20 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        Keep <span className="gradient-text">exploring</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        More departments, more finds — check out the other categories.
                    </p>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        {otherCategories.map((item) => (
                            <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md hover:shadow-indigo-500/15 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                            >
                                <span>{item.icon}</span>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
