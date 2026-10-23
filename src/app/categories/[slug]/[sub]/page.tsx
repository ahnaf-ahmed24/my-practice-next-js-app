import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, getCategoryBySlug, getSubcategory } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

// বিল্ড টাইমে সব বৈধ ক্যাটাগরি + সাবক্যাটাগরি স্লগ প্রি-রেন্ডার করা হয়
export const generateStaticParams = () =>
    categories.flatMap((category) =>
        category.subcategories.map((sub) => ({
            slug: category.slug,
            sub: sub.slug,
        }))
    );

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; sub: string }>;
}): Promise<Metadata> {
    const { slug, sub: subSlug } = await params;
    const category = getCategoryBySlug(slug);
    const subcategory = getSubcategory(slug, subSlug);

    if (!category || !subcategory) {
        return { title: 'Subcategory not found — NextMart' };
    }

    return {
        title: `${subcategory.name} — ${category.name} — NextMart`,
        description: `Browse ${subcategory.products.length} ${subcategory.name} products in our ${category.name} collection.`,
    };
}

export default async function SubcategoryPage({
    params,
}: {
    params: Promise<{ slug: string; sub: string }>;
}) {
    const { slug, sub: subSlug } = await params;
    const category = getCategoryBySlug(slug);
    const subcategory = getSubcategory(slug, subSlug);

    // অচেনা ক্যাটাগরি বা সাবক্যাটাগরি → ৪০৪
    if (!category || !subcategory) notFound();

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
                    <Link href={`/categories/${category.slug}`} className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300">
                        {category.name}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-bold text-slate-900 dark:text-white">{subcategory.name}</span>
                </nav>

                {/* সাবক্যাটাগরি হেডার */}
                <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25">
                        <Image
                            src={subcategory.products[0].image}
                            alt={subcategory.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                        />
                    </span>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                            {subcategory.name}
                        </h1>
                        <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                            Inside <span className="font-bold text-slate-900 dark:text-white">{category.name}</span> · every style, one place.
                        </p>
                    </div>
                </div>

                {/* ফলাফল বার */}
                <div className="mt-10 flex flex-col items-start justify-between gap-3 border-b border-slate-200/60 pb-4 sm:flex-row sm:items-center dark:border-slate-700/60">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Showing <span className="gradient-text font-extrabold">{subcategory.products.length}</span> products
                    </p>
                    <Link
                        href={`/categories/${category.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 transition-transform duration-300 hover:translate-x-0.5 dark:text-indigo-300"
                    >
                        ← All {category.name.toLowerCase()}
                    </Link>
                </div>

                {/* পণ্যের কার্ড গ্রিড (১০০টি) */}
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {subcategory.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* এই ক্যাটাগরির অন্যান্য সাবক্যাটাগরি */}
                <div className="mt-20 rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                        More in <span className="gradient-text">{category.name}</span>
                    </h2>
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        {category.subcategories
                            .filter((item) => item.slug !== subcategory.slug)
                            .map((item) => (
                                <Link
                                    key={item.slug}
                                    href={`/categories/${category.slug}/${item.slug}`}
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
