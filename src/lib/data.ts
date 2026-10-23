// public/data.json থেকে টাইপড ডেটা ও হেল্পার।
// ডেটা পুনর্জেনারেট করতে চালান: node scripts/generate-data.mjs
import rawData from '../../public/data.json';

export type Product = {
    id: string;
    name: string;
    icon: string;
    image: string; // public/products/-এর পাথ
    desc: string;
    price: number;
    oldPrice?: number;
    rating: number;
    reviews: number;
    badge?: string;
};

export type Subcategory = {
    slug: string;
    name: string;
    icon: string;
    noun: string;
    products: Product[];
};

export type Category = {
    slug: string;
    name: string;
    icon: string;
    desc: string;
    gradient: string;
    subcategories: Subcategory[];
};

// JSON ইমপোর্ট করে টাইপ অ্যাসার্ট সহ রপ্তানি
export const categories = rawData as Category[];

// slug দিয়ে ক্যাটাগরি খুঁজে — না পেলে undefined
export const getCategoryBySlug = (slug: string): Category | undefined =>
    categories.find((category) => category.slug === slug);

// নেভবারের ক্যাটাগরি বারের হালকা ডেটা — শুধু নেভিগেশনের তথ্য, পণ্য ছাড়া।
// পুরো data.json (১ MB+) ক্লায়েন্ট বান্ডেলে না যায় তাই সার্ভার থেকে এই স্লিম অ্যারেই
// ক্লায়েন্ট কম্পোনেন্টে (Navbar/CategoryBar) প্রস হিসেবে পাঠানো হয়।
export type CategoryNavItem = {
    slug: string;
    name: string;
    icon: string;
    subcategories: { slug: string; name: string; icon: string }[];
};

export const categoryNavItems: CategoryNavItem[] = categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    subcategories: category.subcategories.map((sub) => ({
        slug: sub.slug,
        name: sub.name,
        icon: sub.icon,
    })),
}));

// ক্যাটাগরি + সাবক্যাটাগরি slug দিয়ে সাবক্যাটাগরি খুঁজে
export const getSubcategory = (categorySlug: string, subSlug: string): Subcategory | undefined =>
    getCategoryBySlug(categorySlug)?.subcategories.find((sub) => sub.slug === subSlug);

// ক্যাটাগরির মোট পণ্য সংখ্যা (সব সাবক্যাটাগরি মিলিয়ে)
export const countCategoryProducts = (category: Category): number =>
    category.subcategories.reduce((total, sub) => total + sub.products.length, 0);

// পণ্যের id দিয়ে পণ্যটি এবং তার ক্যাটাগরি/সাবক্যাটাগরি খুঁজে — না পেলে undefined
export const getProductLocation = (
    productId: string,
): { product: Product; category: Category; subcategory: Subcategory } | undefined => {
    for (const category of categories) {
        for (const subcategory of category.subcategories) {
            const product = subcategory.products.find((item) => item.id === productId);
            if (product) return { product, category, subcategory };
        }
    }
    return undefined;
};
