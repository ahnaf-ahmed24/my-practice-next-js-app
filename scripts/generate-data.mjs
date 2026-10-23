// public/data.json তৈরির স্ক্রিপ্ট — নড দিয়ে চালান: node scripts/generate-data.mjs
// প্রতিটি ক্যাটাগরির প্রতিটি সাবক্যাটাগরিতে ঠিক ১০০টি পণ্য তৈরি হয়।
// PRNG সিডেড, তাই দুবার চালালে একই ডেটা তৈরি হবে।

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// --- সিডেড র‍্যান্ডম (LCG) — পুনরুৎপাদনযোগ্য ডেটা ---
let seed = 20261020;
const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
};
const randInt = (min, max) => min + Math.floor(rand() * (max - min + 1));
const round2 = (n) => Math.round(n * 100) / 100;

// রঙের সাধারণ তালিকা (ডিফল্ট ভ্যারিয়েন্ট)
const COLORS = ['White', 'Black', 'Navy', 'Olive', 'Sand', 'Charcoal', 'Maroon', 'Teal', 'Lavender', 'Rust'];

// প্রতিটি সাবক্যাটাগরি: ১০টি স্টাইল × ১০টি ভ্যারিয়েন্ট = ১০০টি পণ্য
const SPEC = [
    {
        slug: 'electronics',
        name: 'Electronics',
        icon: '💻',
        desc: 'Phones, laptops, audio gear and smart devices.',
        gradient: 'from-blue-500 via-indigo-500 to-purple-600',
        subs: [
            { slug: 'smartphones', name: 'Smartphones', icon: '📱', noun: 'Smartphone', material: 'Flagship-grade', price: [399, 1199], styles: ['Nova', 'Apex', 'Volt', 'Prism', 'Zenith', 'Quark', 'Lumen', 'Kite', 'Orbit', 'Halo'] },
            { slug: 'laptops', name: 'Laptops', icon: '💻', noun: 'Laptop', material: 'Pro-grade', price: [549, 2199], styles: ['Aero', 'Terra', 'Nimbus', 'Onyx', 'Pulsar', 'Vertex', 'Slate', 'Drift', 'Forge', 'Crest'] },
            { slug: 'headphones', name: 'Headphones & Audio', icon: '🎧', noun: 'Headphones', material: 'Studio-quality', price: [49, 399], styles: ['Aurora', 'Echo', 'Pulse', 'Drift', 'Nova', 'Halo', 'Vibe', 'Orbit', 'Crest', 'Zen'] },
            { slug: 'wearables', name: 'Wearables', icon: '⌚', noun: 'Smartwatch', material: 'Fitness-ready', price: [79, 499], styles: ['Tempo', 'Rhythm', 'Motion', 'Vertex', 'Aero', 'Trace', 'Flux', 'Orbit', 'Dash', 'Pulse'] },
            { slug: 'gaming', name: 'Gaming', icon: '🎮', noun: 'Gaming Controller', material: 'Tournament-grade', price: [39, 199], styles: ['Rift', 'Titan', 'Vortex', 'Phantom', 'Spark', 'Blitz', 'Core', 'Nova', 'Apex', 'Edge'] },
            { slug: 'cameras', name: 'Cameras', icon: '📷', noun: 'Mirrorless Camera', material: 'Creator-grade', price: [449, 2999], styles: ['Vista', 'Frame', 'Lumen', 'Focus', 'Prism', 'Halo', 'Nova', 'Orbit', 'Slate', 'Drift'] },
        ],
    },
    {
        slug: 'fashion',
        name: 'Fashion',
        icon: '👕',
        desc: 'Apparel, footwear and accessories for every season.',
        gradient: 'from-pink-500 via-rose-500 to-orange-500',
        subs: [
            { slug: 't-shirts', name: 'T-Shirts', icon: '👕', noun: 'T-Shirt', material: 'Soft cotton', price: [14, 59], styles: ['Classic', 'Premium', 'Everyday', 'Vintage', 'Sporty', 'Relaxed', 'Slim', 'Street', 'Eco', 'Luxury'] },
            { slug: 'shoes', name: 'Shoes & Sneakers', icon: '👟', noun: 'Sneakers', material: 'All-day comfort', price: [39, 189], styles: ['Velocity', 'Trail', 'Court', 'Metro', 'Sprint', 'Drift', 'Alpine', 'Urban', 'Flux', 'Vertex'] },
            { slug: 'jackets', name: 'Jackets & Outerwear', icon: '🧥', noun: 'Jacket', material: 'Weather-ready', price: [59, 299], styles: ['Stormbreaker', 'Denim', 'Bomber', 'Parka', 'Coach', 'Wind', 'Puffer', 'Utility', 'Heritage', 'Alpine'] },
            { slug: 'bags', name: 'Bags & Luggage', icon: '👜', noun: 'Backpack', material: 'Travel-ready', price: [29, 199], styles: ['Voyager', 'Metro', 'Summit', 'Urban', 'Explorer', 'Campus', 'Heritage', 'Flux', 'Trail', 'Nova'] },
            { slug: 'dresses', name: 'Dresses', icon: '👗', noun: 'Dress', material: 'Breathable weave', price: [29, 179], styles: ['Blossom', 'Velvet', 'Satin', 'Meadow', 'Aura', 'Pearl', 'Ember', 'Tide', 'Lush', 'Ruby'] },
            { slug: 'accessories', name: 'Accessories', icon: '🧢', noun: 'Cap', material: 'Everyday staple', price: [12, 79], styles: ['Classic', 'Corduroy', 'Trucker', 'Alpine', 'Retro', 'Sport', 'Urban', 'Heritage', 'Canvas', 'Minimal'] },
        ],
    },
    {
        slug: 'home-living',
        name: 'Home & Living',
        icon: '🛋️',
        desc: 'Furniture, decor, kitchen and lighting essentials.',
        gradient: 'from-amber-500 via-orange-500 to-red-500',
        subs: [
            { slug: 'furniture', name: 'Furniture', icon: '🪑', noun: 'Lounge Chair', material: 'Solid-wood frame', price: [99, 899], styles: ['Nimbus', 'Terra', 'Haven', 'Loft', 'Ridge', 'Ember', 'Slate', 'Cove', 'Grove', 'Atlas'] },
            { slug: 'kitchen', name: 'Kitchen & Dining', icon: '🍳', noun: 'Cookware Set', material: 'Non-stick', price: [29, 399], styles: ['Granite', 'ProChef', 'Everyday', 'Copper', 'Heritage', 'Forge', 'Slate', 'Bistro', 'Ember', 'Vista'] },
            { slug: 'bedding', name: 'Bedding', icon: '🛏️', noun: 'Duvet Set', material: 'Brushed microfiber', price: [49, 249], styles: ['Cloudsoft', 'Linen', 'Flannel', 'Breeze', 'Velvet', 'Serene', 'Drift', 'Meadow', 'Slate', 'Aura'] },
            { slug: 'lighting', name: 'Lighting', icon: '💡', noun: 'Floor Lamp', material: 'Dimmable LED', price: [29, 249], styles: ['Lumen', 'Halo', 'Aurora', 'Ember', 'Prism', 'Ridge', 'Cove', 'Orbit', 'Trace', 'Vertex'] },
            { slug: 'decor', name: 'Home Decor', icon: '🪴', noun: 'Decor Vase', material: 'Hand-glazed', price: [14, 129], styles: ['Terra', 'Blossom', 'Serene', 'Meadow', 'Lush', 'Aura', 'Pearl', 'Ember', 'Tide', 'Slate'] },
        ],
    },
    {
        slug: 'beauty',
        name: 'Beauty',
        icon: '💄',
        desc: 'Skincare, makeup, grooming and personal care.',
        gradient: 'from-fuchsia-500 via-pink-500 to-purple-600',
        subs: [
            { slug: 'skincare', name: 'Skincare', icon: '🧴', noun: 'Face Serum', material: 'Dermatologist-tested', price: [14, 89], styles: ['Hydra', 'Glow', 'Renew', 'Calm', 'Velvet', 'Aura', 'Pure', 'Silk', 'Lush', 'Aqua'] },
            { slug: 'makeup', name: 'Makeup', icon: '💋', noun: 'Lip Tint', material: 'Long-wear', price: [9, 49], styles: ['Berry', 'Nude', 'Coral', 'Ruby', 'Blush', 'Ember', 'Rose', 'Peach', 'Plum', 'Frost'] },
            { slug: 'haircare', name: 'Haircare', icon: '💇', noun: 'Shampoo', material: 'Sulfate-free', price: [12, 59], styles: ['Silk', 'Renew', 'Pure', 'Calm', 'Volume', 'Hydra', 'Root', 'Gloss', 'Fresh', 'Aura'] },
            { slug: 'fragrances', name: 'Fragrances', icon: '🌸', noun: 'Eau de Parfum', material: 'Long-lasting', price: [29, 199], styles: ['Blossom', 'Ember', 'Aura', 'Velvet', 'Meadow', 'Tide', 'Ruby', 'Lush', 'Silk', 'Dusk'] },
            { slug: 'grooming', name: 'Grooming', icon: '🪒', noun: 'Grooming Kit', material: 'Precision-engineered', price: [19, 149], styles: ['Apex', 'Classic', 'Pro', 'Edge', 'Forge', 'Slate', 'Vertex', 'Nova', 'Core', 'Metro'] },
        ],
    },
    {
        slug: 'sports',
        name: 'Sports & Outdoors',
        icon: '⚽',
        desc: 'Fitness gear, camping, cycling and adventure kit.',
        gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
        subs: [
            { slug: 'fitness', name: 'Fitness', icon: '🏋️', noun: 'Resistance Band Set', material: 'Anti-snap latex', price: [19, 129], styles: ['Flex', 'Power', 'Core', 'Titan', 'Blaze', 'Forge', 'Vertex', 'Pulse', 'Apex', 'Volt'] },
            { slug: 'cycling', name: 'Cycling', icon: '🚴', noun: 'Cycling Helmet', material: 'MIPS-protected', price: [49, 249], styles: ['Aero', 'Velocity', 'Summit', 'Metro', 'Sprint', 'Alpine', 'Drift', 'Flux', 'Vertex', 'Trail'] },
            { slug: 'yoga', name: 'Yoga & Mindfulness', icon: '🧘', noun: 'Yoga Mat', material: 'Non-slip grip', price: [19, 99], styles: ['Zen', 'Serene', 'Aura', 'Lotus', 'Breeze', 'Meadow', 'Drift', 'Tide', 'Cloud', 'Slate'] },
            { slug: 'camping', name: 'Camping', icon: '🏕️', noun: 'Camping Tent', material: 'Waterproof 3000mm', price: [99, 599], styles: ['Summit', 'Ridge', 'Trail', 'Alpine', 'Explorer', 'Basecamp', 'Terra', 'Cove', 'Atlas', 'Drift'] },
            { slug: 'hiking', name: 'Hiking', icon: '🥾', noun: 'Hiking Boots', material: 'Grip outsole', price: [59, 299], styles: ['Trailblazer', 'Alpine', 'Summit', 'Ridge', 'Scout', 'Drift', 'Terra', 'Forge', 'Blaze', 'Vertex'] },
        ],
    },
    {
        slug: 'books',
        name: 'Books & Stationery',
        icon: '📚',
        desc: 'Bestsellers, notebooks, art supplies and office.',
        gradient: 'from-indigo-500 via-blue-500 to-cyan-500',
        subs: [
            { slug: 'fiction', name: 'Fiction', icon: '📖', noun: 'Novel', material: 'Bestselling', price: [12, 49], styles: ['Silent', 'Midnight', 'Ember', 'Hidden', 'Golden', 'Distant', 'Frozen', 'Borrowed', 'Quiet', 'Electric'], variants: ['Paperback', 'Hardcover', 'Illustrated', 'Large Print', 'Audiobook', 'eBook', 'Signed', 'Deluxe', 'Pocket', 'Collector'] },
            { slug: 'notebooks', name: 'Notebooks & Journals', icon: '📓', noun: 'Notebook', material: 'Lay-flat binding', price: [9, 49], styles: ['Linen', 'Classic', 'Pocket', 'Heritage', 'Minimal', 'Ruled', 'Kraft', 'Slate', 'Aura', 'Field'] },
            { slug: 'stationery', name: 'Pens & Stationery', icon: '🖊️', noun: 'Fountain Pen', material: 'Brass body', price: [9, 129], styles: ['Inkflow', 'Classic', 'Pocket', 'Heritage', 'Minimal', 'Slate', 'Vertex', 'Nova', 'Core', 'Crest'] },
            { slug: 'art-supplies', name: 'Art Supplies', icon: '🎨', noun: 'Watercolor Set', material: 'Artist-grade', price: [14, 149], styles: ['Blossom', 'Terra', 'Lush', 'Meadow', 'Prism', 'Aura', 'Studio', 'Vibrant', 'Ruby', 'Tide'] },
            { slug: 'kids-books', name: 'Kids & Young Readers', icon: '🧸', noun: 'Picture Book', material: 'Illustrated', price: [8, 39], styles: ['Sleepy', 'Happy', 'Brave', 'Curious', 'Tiny', 'Silly', 'Magic', 'Jolly', 'Wild', 'Sunny'] },
        ],
    },
];

// এক সাবক্যাটাগরির ১০০টি পণ্য বানায়
const buildProducts = (sub) => {
    const variants = sub.variants ?? COLORS;
    const products = [];
    let n = 0;

    // public/products/-এ ডাউনলোড করা ছবি (scripts/download-images.mjs)
    const IMAGE_VARIANTS = 2;

    for (const style of sub.styles) {
        for (const variant of variants) {
            n += 1;
            const price = randInt(sub.price[0], sub.price[1]);
            const badgeRoll = rand();

            const product = {
                id: `${sub.slug}-${n}`,
                name: `${style} ${variant} ${sub.noun}`,
                icon: sub.icon,
                image: `/products/${sub.slug}-${((n - 1) % IMAGE_VARIANTS) + 1}.jpg`,
                desc: `${sub.material} ${style.toLowerCase()} ${sub.noun.toLowerCase()} in ${variant.toLowerCase()}.`,
                price,
            };

            // ৩০% পণ্যে ছাড় (পুরনো দাম)
            if (rand() < 0.3) {
                product.oldPrice = Math.round(price * (1.15 + rand() * 0.2));
            }

            product.rating = round2(4 + rand()); // 4.00 – 4.99
            product.reviews = randInt(38, 3480);

            if (badgeRoll < 0.12) product.badge = 'Best Seller';
            else if (badgeRoll < 0.2) product.badge = 'New';

            products.push(product);
        }
    }

    return products;
};

// ক্যাটাগরি অ্যারে তৈরি
const categories = SPEC.map((category) => ({
    slug: category.slug,
    name: category.name,
    icon: category.icon,
    desc: category.desc,
    gradient: category.gradient,
    subcategories: category.subs.map((sub) => ({
        slug: sub.slug,
        name: sub.name,
        icon: sub.icon,
        noun: sub.noun,
        products: buildProducts(sub),
    })),
}));

// যাচাই: প্রতি সাবক্যাটাগরিতে ঠিক ১০০টি পণ্য
for (const category of categories) {
    for (const sub of category.subcategories) {
        if (sub.products.length !== 100) {
            throw new Error(`${category.slug}/${sub.slug} has ${sub.products.length} products, expected 100`);
        }
    }
}

const outPath = join(root, 'public', 'data.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(categories, null, 2) + '\n', 'utf8');

const totalSubs = categories.reduce((n, c) => n + c.subcategories.length, 0);
const totalProducts = categories.reduce(
    (n, c) => n + c.subcategories.reduce((m, s) => m + s.products.length, 0),
    0
);
console.log(`✔ ${outPath}`);
console.log(`  ${categories.length} categories · ${totalSubs} subcategories · ${totalProducts} products`);
