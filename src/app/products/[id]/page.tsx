import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import { getProductLocation } from '@/lib/data';
import { formatPrice } from '@/lib/currency';

// ছাড়ের শতাংশ বের করে (গোল করা) — ProductCard-এর মতোই
const discountPercent = (price: number, oldPrice?: number) =>
    oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const location = getProductLocation(id);

    if (!location) {
        return { title: 'Product not found — NextMart' };
    }

    return {
        title: `${location.product.name} — NextMart`,
        description: location.product.desc,
    };
}

// পণ্যের বিস্তারিত পেজ — কার্ডে ক্লিক করলে এখানে আসে, এখানে Add to Cart বাটন আছে
export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const location = getProductLocation(id);

    // অচেনা পণ্য → ৪০৪
    if (!location) notFound();

    const { product, category, subcategory } = location;
    const discount = discountPercent(product.price, product.oldPrice);

    // একই সাবক্যাটাগরির অন্য পণ্য (সর্বোচ্চ ৩টি)
    const related = subcategory.products.filter((item) => item.id !== product.id).slice(0, 3);

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
                    <Link
                        href={`/categories/${category.slug}/${subcategory.slug}`}
                        className="transition-colors duration-300 hover:text-indigo-600 dark:hover:text-indigo-300"
                    >
                        {subcategory.name}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-bold text-slate-900 dark:text-white">{product.name}</span>
                </nav>

                {/* পণ্যের মূল তথ্য */}
                <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12">
                    {/* ছবি */}
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 sm:h-96 dark:from-slate-800/60 dark:to-slate-900/60">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                loading="eager"
                                fetchPriority="high"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                            />

                            {product.badge && (
                                <span className="absolute left-5 top-5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 shadow dark:bg-amber-950/70 dark:text-amber-300">
                                    {product.badge}
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="absolute right-5 top-5 rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow">
                                    -{discount}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* বিস্তারিত */}
                    <div className="flex flex-col">
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
                            {product.icon} {subcategory.name}
                        </span>

                        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                            {product.name}
                        </h1>

                        {/* রেটিং */}
                        <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                            <span className="text-amber-400">★</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{product.rating.toFixed(1)}</span>
                            <span>({product.reviews.toLocaleString()} reviews)</span>
                        </div>

                        {/* দাম */}
                        <p className="mt-5 flex flex-wrap items-baseline gap-3">
                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                {formatPrice(product.price)}
                            </span>
                            {product.oldPrice && (
                                <>
                                    <span className="text-lg font-medium text-slate-400 line-through dark:text-slate-500">
                                        {formatPrice(product.oldPrice)}
                                    </span>
                                    <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-950/70 dark:text-rose-300">
                                        সাশ্রয় {formatPrice(product.oldPrice - product.price)}
                                    </span>
                                </>
                            )}
                        </p>

                        <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">{product.desc}</p>

                        {/* Add to Cart */}
                        <div className="mt-7">
                            <AddToCartButton product={product} variant="lg" />
                        </div>

                        {/* পণ্যের মেটা তথ্য */}
                        <dl className="mt-8 grid grid-cols-1 gap-y-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 text-sm sm:grid-cols-2 sm:gap-x-6 dark:border-slate-700/70 dark:bg-slate-800/40">
                            <dt className="text-slate-500 dark:text-slate-400">Category</dt>
                            <dd className="font-bold text-slate-900 dark:text-white">{category.name}</dd>

                            <dt className="text-slate-500 dark:text-slate-400">Subcategory</dt>
                            <dd className="font-bold text-slate-900 dark:text-white">{subcategory.name}</dd>

                            <dt className="text-slate-500 dark:text-slate-400">SKU</dt>
                            <dd className="break-words font-bold text-slate-900 uppercase dark:text-white">{product.id}</dd>

                            <dt className="text-slate-500 dark:text-slate-400">Availability</dt>
                            <dd className="font-bold text-emerald-600 dark:text-emerald-400">✓ In stock</dd>
                        </dl>

                        <Link
                            href={`/categories/${category.slug}/${subcategory.slug}`}
                            className="mt-6 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-indigo-600 transition-transform duration-300 hover:-translate-x-0.5 dark:text-indigo-300"
                        >
                            ← Back to {subcategory.name}
                        </Link>
                    </div>
                </div>

                {/* একই সাবক্যাটাগরির অন্য পণ্য */}
                {related.length > 0 && (
                    <section className="mt-20">
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            More in <span className="gradient-text">{subcategory.name}</span>
                        </h2>
                        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <ProductCard key={item.id} product={item} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
