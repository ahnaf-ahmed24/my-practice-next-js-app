import Image from 'next/image';
import Link from 'next/link';
import AddToCartButton from '@/components/AddToCartButton';
import type { Product } from '@/lib/data';
import { formatPrice } from '@/lib/currency';

// ব্যাজ রঙের ম্যাপ
const badgeStyles: Record<string, string> = {
    'Best Seller': 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    New: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
};

const defaultBadgeStyle = 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300';

// ছাড়ের শতাংশ বের করে (গোল করা)
const discountPercent = (product: Product) =>
    product.oldPrice
        ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
        : 0;

// পণ্যের কার্ড (সার্ভার কম্পোনেন্ট) — শুধু বাটন ক্লায়েন্ট সাইডে
const ProductCard = ({ product }: { product: Product }) => {
    const discount = discountPercent(product);

    return (
        <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/15 dark:border-slate-700/70 dark:bg-slate-900/60 dark:hover:shadow-indigo-500/10">
            {/* পণ্যের আসল ছবি */}
            <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/60 dark:to-slate-900/60">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* ব্যাজ */}
                {product.badge && (
                    <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeStyles[product.badge] ?? defaultBadgeStyle}`}>
                        {product.badge}
                    </span>
                )}
                {discount > 0 && (
                    <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                        -{discount}%
                    </span>
                )}
            </div>

            {/* পণ্যের তথ্য */}
            <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-bold leading-snug text-slate-900 dark:text-white">
                    {/* পুরো কার্ডে ক্লিক করলে বিস্তারিত পেজে যায় (stretched link) */}
                    <Link
                        href={`/products/${product.id}`}
                        className="transition-colors duration-300 hover:text-indigo-600 after:absolute after:inset-0 after:content-[''] dark:hover:text-indigo-300"
                    >
                        {product.name}
                    </Link>
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {product.desc}
                </p>

                {/* রেটিং */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-amber-400">★</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                        {product.rating.toFixed(1)}
                    </span>
                    <span>({product.reviews.toLocaleString()} reviews)</span>
                </div>

                {/* দাম ও কার্ট বাটন */}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <p className="flex flex-wrap items-baseline gap-2">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && (
                            <span className="text-sm font-medium text-slate-400 line-through dark:text-slate-500">
                                {formatPrice(product.oldPrice)}
                            </span>
                        )}
                    </p>

                    <span className="relative z-10">
                        <AddToCartButton product={product} />
                    </span>
                </div>
            </div>
        </article>
    );
};

export default ProductCard;
