// অথ রোল ও সেশন স্কোপের ধ্রুব কনস্ট্যান্ট
// (auth.ts ও admin.ts দুটোই এখান থেকে নেয়, যাতে circular import না হয়)

// অ্যাডমিন রোল — better-auth admin প্লাগইনের adminRoles এর সাথে মিলিয়ে রাখা
export const ADMIN_ROLE = 'admin';

// সাধারণ গ্রাহকের রোল
export const CUSTOMER_ROLE = 'user';

// সেশনের স্কোপ — কোন লগইন প্যানেল দিয়ে ঢোকা হয়েছে
// 'admin' = অ্যাডমিন প্যানেল · 'customer' = কাস্টমার প্যানেল
export type SessionScope = 'admin' | 'customer';

// লগইনের সময় স্কোপ জানানোর হেডার — সেশন তৈরির সময় সেশনে সংরক্ষিত হয়
export const SCOPE_HEADER = 'x-nextmart-scope';
