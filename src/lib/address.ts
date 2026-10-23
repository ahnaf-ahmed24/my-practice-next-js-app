// ডেলিভারি ঠিকানা — ক্লায়েন্ট ও সার্ভার দুই জায়গায় ব্যবহৃত টাইপ (কোনো সার্ভার-নির্ভর কোড নেই)

// ঠিকানার তথ্য
export type ShippingAddress = {
    name: string;
    phone: string;
    altPhone?: string;
    email: string;
    division: string;
    district: string;
    thana: string;
    postCode?: string;
    area: string;
    landmark?: string;
    notes?: string;
};

// প্রোফাইলে সংরক্ষিত ঠিকানা
export type SavedAddress = {
    id: string;
    label: string;
    isDefault: boolean;
    createdAt: string;
    address: ShippingAddress;
};
