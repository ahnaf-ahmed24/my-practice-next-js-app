// বাংলাদেশি টাকা (৳) — পুরো সাইটের দাম এই ফরম্যাটে দেখানো হয়
export const CURRENCY = '৳';

// ৳1,299 — হাজারের ভাগ দিয়ে আলাদা করে দেখায়
export const formatPrice = (value: number) => `${CURRENCY}${value.toLocaleString('en-US')}`;
