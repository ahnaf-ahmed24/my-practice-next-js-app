import { ObjectId } from 'mongodb';
import { db } from '@/lib/mongodb';
import type { AdminRequestView } from '@/lib/order-views';

export type { AdminRequestView } from '@/lib/order-views';

// অ্যাডমিন অনুমোদনের অনুরোধের কালেকশন
export const ADMIN_REQUESTS_COLLECTION = 'adminRequests';

export type AdminRequestStatus = 'pending' | 'approved' | 'rejected';

export type AdminRequestDoc = {
    _id?: ObjectId;
    userId: string;
    name: string;
    email: string;
    status: AdminRequestStatus;
    requestedAt: Date;
    reviewedAt?: Date | null;
    reviewedBy?: string | null;
    note?: string | null;
};

const requests = () => db.collection<AdminRequestDoc>(ADMIN_REQUESTS_COLLECTION);

// নতুন অ্যাডমিন অনুরোধ যোগ করে (অনুমোদনের অপেক্ষায়)
export const createAdminRequest = async (data: {
    userId: string;
    name: string;
    email: string;
}) => {
    const doc: AdminRequestDoc = {
        userId: data.userId,
        name: data.name,
        email: data.email,
        status: 'pending',
        requestedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        note: null,
    };

    await requests().insertOne(doc);
    return doc;
};

// অনুরোধের তালিকা — নতুন আগে
export const listAdminRequests = async (
    status?: AdminRequestStatus,
    limit = 100,
): Promise<AdminRequestView[]> => {
    const docs = await requests()
        .find(status ? { status } : {})
        .sort({ requestedAt: -1 })
        .limit(limit)
        .toArray();

    return docs.map(toView);
};

// একটি অনুরোধ খোঁজে
export const getAdminRequest = async (id: string) => {
    const objectId = toObjectId(id);
    if (!objectId) return null;
    return requests().findOne({ _id: objectId });
};

// একটি ইউজারের নিজের অনুরোধ খোঁজে (সবচেয়ে নতুনটি)
export const findAdminRequestByUserId = async (userId: string) => {
    const docs = await requests()
        .find({ userId })
        .sort({ requestedAt: -1 })
        .limit(1)
        .toArray();

    return docs[0] ?? null;
};

// অনুরোধের সিদ্ধান্ত সংরক্ষণ করে (অনুমোদন/বাতিল)
export const setAdminRequestStatus = async (
    id: string,
    status: AdminRequestStatus,
    reviewedBy: string,
    note?: string,
) => {
    const objectId = toObjectId(id);
    if (!objectId) return false;

    const result = await requests().updateOne(
        { _id: objectId },
        {
            $set: {
                status,
                reviewedAt: new Date(),
                reviewedBy,
                note: note?.trim() || null,
            },
        },
    );

    return result.matchedCount > 0;
};

// স্ট্রিং থেকে ObjectId — ভুল ফরম্যাট হলে null
const toObjectId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

const toView = (doc: AdminRequestDoc): AdminRequestView => ({
    id: doc._id?.toHexString() ?? '',
    userId: doc.userId,
    name: doc.name,
    email: doc.email,
    status: doc.status,
    requestedAt: new Date(doc.requestedAt).toISOString(),
    reviewedAt: doc.reviewedAt ? new Date(doc.reviewedAt).toISOString() : null,
    reviewedBy: doc.reviewedBy ?? null,
    note: doc.note ?? null,
});
