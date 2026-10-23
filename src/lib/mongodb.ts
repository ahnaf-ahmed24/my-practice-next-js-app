import { MongoClient } from 'mongodb';

// MongoDB ক্লায়েন্ট সিঙ্গলটন — হট রিলোডে নতুন কনেকশন না বানিয়ে গ্লোবাল ক্যাশে ব্যবহার করে
const uri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/nextmart';

// টাইপ-স্ক্রিপ্টে গ্লোবালে ক্লায়েন্ট রাখার জন্য
declare global {
    var _mongoClient: MongoClient | undefined;
}

// ক্লায়েন্ট তৈরি/পুনরুদ্ধার করে — টোপোলজি বন্ধ হয়ে গেলে (যেমন DB বন্ধ থাকা অবস্থায়
// প্রথম রিকোয়েস্টে কানেকশন ব্যর্থ হলে) নতুন ক্লায়েন্ট বানায়, নইলে পুরনোটি ব্যবহার করে
const getClient = (): MongoClient => {
    const existing = global._mongoClient;

    // বিদ্যমান ক্লায়েন্টের টোপোলজি বন্ধ কিনা যাচাই (পাবলিক ইভেন্ট দিয়ে)
    const topology = (existing as { topology?: { isClosed?: () => boolean } } | undefined)?.topology;
    if (existing && !(topology?.isClosed?.() ?? false)) {
        return existing;
    }

    const fresh = new MongoClient(uri, { maxPoolSize: 10 });

    // কানেকশন বন্ধ হলে ক্যাশ থেকে সরিয়ে দিন, যাতে পরের রিকোয়েস্টে নতুনটি তৈরি হয়
    fresh.on('close', () => {
        if (global._mongoClient === fresh) {
            global._mongoClient = undefined;
        }
    });

    global._mongoClient = fresh;
    return fresh;
};

const client = getClient();

// প্রোডাকশনে গ্লোবাল ক্যাশ লাগে না (প্রতি প্রসেসে একটিই ক্লায়েন্ট থাকে)
if (process.env.NODE_ENV !== 'production') {
    global._mongoClient = client;
}

export { client };
export const db = client.db();
