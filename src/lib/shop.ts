import { ObjectId } from 'mongodb';
import { db } from '@/lib/mongodb';
import type { ShippingAddress } from '@/lib/address';
import type { OrderStatus, TrackingEvent } from '@/lib/order-status';
import type { OrderItem } from '@/lib/order-views';

export type { ShippingAddress } from '@/lib/address';
export type { OrderItem } from '@/lib/order-views';

// মঙ্গোডিবি কালেকশনের নাম
export const ORDERS_COLLECTION = 'orders';
export const ADDRESSES_COLLECTION = 'addresses';

// ডেলিভারি ঠিকানা (অর্ডার ও সংরক্ষিত ঠিকানা দুটোতেই একই) — টাইপ src/lib/address.ts এ

export type OrderDoc = {
    _id?: ObjectId;
    orderId: string;
    userId: string;
    createdAt: Date;
    items: OrderItem[];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    paymentMethod: string;
    address: ShippingAddress;
    estimatedDelivery: string;
    // অ্যাডমিন-কন্ট্রোলড অবস্থা ও শিপমেন্ট ট্র্যাকিং
    status: OrderStatus;
    tracking: TrackingEvent[];
    approvedAt?: Date | null;
    approvedBy?: string | null;
    updatedAt?: Date | null;
};

export type AddressDoc = {
    _id?: ObjectId;
    userId: string;
    label: string;
    address: ShippingAddress;
    isDefault: boolean;
    createdAt: Date;
    updatedAt?: Date;
};

const orders = () => db.collection<OrderDoc>(ORDERS_COLLECTION);
const addresses = () => db.collection<AddressDoc>(ADDRESSES_COLLECTION);

// নতুন অর্ডার যোগ করে — নতুন অর্ডার অ্যাডমিনের অনুমোদনের অপেক্ষায় 'pending' হিসেবে জন্মায়
export const createOrder = async (order: Omit<OrderDoc, '_id' | 'createdAt' | 'status' | 'tracking'>) => {
    const doc: OrderDoc = {
        ...order,
        status: 'pending',
        tracking: [],
        createdAt: new Date(),
    };
    await orders().insertOne(doc);
    return doc;
};

// ইউজারের সব অর্ডার — নতুন আগে
export const getUserOrders = async (userId: string, limit = 20) =>
    orders()
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

// সব অর্ডার — অ্যাডমিন প্যানেলের জন্য (নতুন আগে)
export const getAllOrders = async (limit = 100) =>
    orders()
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

// অর্ডার নম্বর দিয়ে একটি অর্ডার
export const getOrderById = async (orderId: string) =>
    orders().findOne({ orderId });

// অর্ডারের অবস্থা বদলায় ও একটি ট্র্যাকিং ইভেন্ট যোগ করে
export const updateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    meta: { note?: string; location?: string; adminName: string },
) => {
    const order = await orders().findOne({ orderId });
    if (!order) return null;

    const now = new Date();
    const event: TrackingEvent = {
        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        status,
        note: (meta.note ?? '').trim(),
        location: (meta.location ?? '').trim(),
        createdAt: now.toISOString(),
        createdBy: meta.adminName,
    };

    const set: Record<string, unknown> = { status, updatedAt: now };

    // 'processing' হলে অর্ডারটি অনুমোদিত হয় — কে অনুমোদন করেছে তা রাখা হয়
    if (status === 'processing' && order.status !== 'processing') {
        set.approvedAt = now;
        set.approvedBy = meta.adminName;
    }

    await orders().updateOne({ orderId }, { $set: set, $push: { tracking: event } });

    return {
        ...order,
        ...set,
        status,
        tracking: [...(order.tracking ?? []), event],
    };
};

// অর্ডার মুছে ফেলে (অর্ডার নম্বর দিয়ে) — অ্যাডমিন অনুমোদনের আগের অর্ডার বাতিল করা যায়,
// আর ডেলিভার হওয়া অর্ডার ইতিহাস থেকে মুছে ফেলা যায়
export const deleteOrder = async (userId: string, orderId: string) => {
    const result = await orders().deleteOne({
        userId,
        orderId,
        $or: [
            // স্ট্যাটাস না থাকা পুরোনো অর্ডারগুলোও মুছে ফেলা যায়
            { status: { $exists: false } },
            { status: 'pending' },
            { status: 'delivered' },
            { status: 'cancelled' },
        ],
    });
    return result.deletedCount > 0;
};

// অ্যাডমিন যেকোনো অর্ডার মুছে ফেলতে পারে — ইউজারের সাথে সম্পর্ক নেই
export const deleteOrderById = async (orderId: string) => {
    const result = await orders().deleteOne({ orderId });
    return result.deletedCount > 0;
};

// ইউজারের সংরক্ষিত ঠিকানা — ডিফল্ট আগে
export const getUserAddresses = async (userId: string) =>
    addresses()
        .find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray();

// ঠিকানা সংরক্ষণ করে (প্রথম ঠিকানাটি ডিফল্ট হয়)
export const createAddress = async (
    userId: string,
    address: ShippingAddress,
    label: string,
) => {
    const count = await addresses().countDocuments({ userId });
    const doc: AddressDoc = {
        userId,
        label,
        address,
        isDefault: count === 0,
        createdAt: new Date(),
    };

    await addresses().insertOne(doc);
    return doc;
};

// ছোট-বড় অক্ষর ও বাড়তি ফাঁকা উপেক্ষা করে ঠিকানা মিলিয়ে দেখে
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

// একই ডেলিভারি ঠিকানা কি না — ফোন নম্বর ও জেলা এক হলে একই ঠিকানা ধরা হয়
const isSameAddress = (saved: ShippingAddress, next: ShippingAddress) =>
    normalize(saved.phone ?? '') === normalize(next.phone ?? '') &&
    normalize(saved.district ?? '') === normalize(next.district ?? '');

// অর্ডারের সময় ঠিকানা সংরক্ষণ করে — আগের একই ঠিকানা থাকলে সেটিই আপডেট হয়,
// নতুন এন্ট্রি বানানো হয় না (লেবেল ও ডিফল্ট ফ্ল্যাগ অপরিবর্তিত থাকে)
export const upsertAddress = async (
    userId: string,
    address: ShippingAddress,
    label: string,
) => {
    // ডিফল্ট ঠিকানাকে আগে দেখা হয়, তারপর নতুন ঠিকানাগুলো
    const saved = await addresses()
        .find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray();

    const match = saved.find((item) => isSameAddress(item.address, address));

    if (match?._id) {
        const merged: ShippingAddress = { ...match.address, ...address };

        await addresses().updateOne(
            { _id: match._id },
            { $set: { address: merged, updatedAt: new Date() } },
        );

        return { ...match, address: merged, updated: true };
    }

    const created = await createAddress(userId, address, label);
    return { ...created, updated: false };
};

// ঠিকানা মুছে ফেলে
export const deleteAddress = async (userId: string, id: string) => {
    const objectId = toObjectId(id);
    if (!objectId) return false;

    const result = await addresses().deleteOne({ _id: objectId, userId });
    return result.deletedCount > 0;
};

// ডিফল্ট ঠিকানা বদলায়
export const setDefaultAddress = async (userId: string, id: string) => {
    const objectId = toObjectId(id);
    if (!objectId) return false;

    const target = await addresses().findOne({ _id: objectId, userId });
    if (!target) return false;

    await addresses().updateMany({ userId }, { $set: { isDefault: false } });
    await addresses().updateOne({ _id: objectId, userId }, { $set: { isDefault: true } });

    return true;
};

// স্ট্রিং থেকে ObjectId — ভুল ফরম্যাট হলে null
const toObjectId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : null);
