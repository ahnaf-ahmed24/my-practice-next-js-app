// প্রোফাইল ছবির কনস্ট্যান্ট ও হেল্পার — সার্ভার ও ক্লায়েন্ট দুটো থেকেই ইমপোর্ট করা যায়
// (mongodb শুধু টাইপ ইমপোর্ট, তাই ক্লায়েন্ট বান্ডেলে ড্রাইভার যায় না)
import type { Binary } from 'mongodb';

// মঙ্গোডিবি (Atlas) কালেকশন — প্রতি ইউজারের ছবি এক ডকুমেন্টে বাইনারি হিসেবে থাকে
export const PROFILE_IMAGE_COLLECTION = 'user_profile_images';

// ডকুমেন্ট স্ট্রাকচার — _id হলো better-auth ইউজার আইডি
export type ProfileImageDoc = {
    _id: string;
    data: Binary;
    contentType: string;
    size: number;
    updatedAt: Date;
};

// সর্বোচ্চ আপলোড সাইজ: ২ মেগাবাইট
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// অনুমোদিত ছবির ফরম্যাট
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
] as const;

export const isAllowedImageType = (type: string): type is (typeof ALLOWED_IMAGE_TYPES)[number] =>
    (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type);

// user.image ফিল্ডে সংরক্ষিত URL — ?v= দিয়ে ব্রাউজার ক্যাশ বাইপাস করা হয়
export const profileImageUrl = (userId: string, version: number | string) =>
    `/api/profile/image/${userId}?v=${version}`;
