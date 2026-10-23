import { ObjectId } from 'mongodb';
import { headers } from 'next/headers';
import { auth, type Session } from '@/lib/auth';
import { db } from '@/lib/mongodb';
import { ADMIN_ROLE } from '@/lib/auth-constants';
import { isAdminScope, isCustomerScope } from '@/lib/session-scope';

export { ADMIN_ROLE };

// Better Auth ইউজার কালেকশনের নাম (auth.ts এ modelName: 'user')
export const USERS_COLLECTION = 'user';

// MongoDB অ্যাডাপ্টার ইউজারের `id` ফিল্ডটি `_id` হিসেবে রাখে এবং সেটি ObjectId
export type AdminUserDoc = {
    _id: ObjectId;
    name: string;
    email: string;
    role?: string;
    banned?: boolean;
    createdAt: Date;
};

export type AdminUserView = {
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean;
    createdAt: string;
};

const users = () => db.collection<AdminUserDoc>(USERS_COLLECTION);

// স্ট্রিং আইডিকে ObjectId-তে রূপান্তর — ভুল ফরম্যাট হলে null
export const toUserObjectId = (id: string) =>
    ObjectId.isValid(id) ? new ObjectId(id) : null;

// বর্তমান সেশন — headers() অ্যাসিং, তাই শুধু সার্ভার কম্পোনেন্ট/রুট হ্যান্ডলারে
export const getSession = async () => auth.api.getSession({ headers: await headers() });

export type AdminGuard =
    | { ok: true; session: Session }
    | { ok: false; status: 401 | 403; error: string };

export type CustomerGuard =
    | { ok: true; session: Session }
    | { ok: false; status: 401 | 403; error: string };

// অ্যাডমিন গেট — এটাই আসল সুরক্ষা (প্রক্সি শুধু দ্রুত প্রাথমিক চেক)
// অ্যাডমিন ফিচার শুধু অ্যাডমিন প্যানেল দিয়ে লগইন করলেই পাওয়া যায়
export const requireAdmin = async (): Promise<AdminGuard> => {
    const session = await getSession();

    if (!session) {
        return { ok: false, status: 401, error: 'You must be logged in.' };
    }

    if (session.user.role !== ADMIN_ROLE) {
        return { ok: false, status: 403, error: 'Administrator access required.' };
    }

    if (!isAdminScope(session)) {
        return {
            ok: false,
            status: 403,
            error: 'Sign in through the administrator panel to use admin features.',
        };
    }

    return { ok: true, session };
};

// কাস্টমার গেট — অ্যাডমিন প্যানেল দিয়ে লগইন করা সেশনে কাস্টমার ফিচার থাকে না
export const requireCustomer = async (): Promise<CustomerGuard> => {
    const session = await getSession();

    if (!session) {
        return { ok: false, status: 401, error: 'You must be logged in.' };
    }

    if (!isCustomerScope(session)) {
        return {
            ok: false,
            status: 403,
            error: 'This session is signed in to the administrator panel.',
        };
    }

    return { ok: true, session };
};

// ইমেইল দিয়ে ইউজার খোঁজে (ইমেইল সবসময় ছোট হাতের অক্ষরে সংরক্ষিত)
export const findUserByEmail = async (email: string) =>
    users().findOne({ email: email.toLowerCase() });

// কতজন অ্যাডমিন আছেন
export const countAdmins = () => users().countDocuments({ role: ADMIN_ROLE });

// ইনিশিয়াল (প্রথম) অ্যাডমিন — সবচেয়ে আগে তৈরি অ্যাডমিন
// নতুন অ্যাডমিনদের অনুমোদন একমাত্র তিনিই করতে পারেন
export const getInitialAdmin = () =>
    users().findOne({ role: ADMIN_ROLE }, { sort: { createdAt: 1 } });

// ইনিশিয়াল অ্যাডমিন কি না — সেশনের আইডির সাথে মিলিয়ে দেখা হয়
export const isInitialAdmin = async (userId: string) => {
    const initialAdmin = await getInitialAdmin();
    return Boolean(initialAdmin) && initialAdmin?._id.toHexString() === userId;
};

// ইউজারের রোল বদলে (অ্যাডমিন অনুমোদনে ব্যবহার হয়)
export const setUserRole = async (userId: string, role: string) => {
    const objectId = toUserObjectId(userId);
    if (!objectId) return false;

    const result = await users().updateOne(
        { _id: objectId },
        { $set: { role, updatedAt: new Date() } },
    );
    return result.matchedCount > 0;
};

// সব ইউজার — অ্যাডমিন প্যানেলের তালিকা
export const listUsers = async (limit = 200): Promise<AdminUserView[]> => {
    const docs = await users().find({}).sort({ createdAt: -1 }).limit(limit).toArray();

    return docs.map((doc) => ({
        id: doc._id.toHexString(),
        name: doc.name,
        email: doc.email,
        role: doc.role ?? 'user',
        banned: Boolean(doc.banned),
        createdAt: new Date(doc.createdAt).toISOString(),
    }));
};
