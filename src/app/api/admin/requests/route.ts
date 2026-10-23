import { NextResponse } from 'next/server';
import { ADMIN_ROLE, countAdmins, requireAdmin, requireCustomer, setUserRole } from '@/lib/admin';
import {
    createAdminRequest,
    findAdminRequestByUserId,
    listAdminRequests,
    type AdminRequestStatus,
} from '@/lib/admin-requests';

// অ্যাডমিন অনুমোদনের অনুরোধের তালিকা — শুধু অ্যাডমিন
export async function GET(request: Request) {
    const guard = await requireAdmin();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const status = new URL(request.url).searchParams.get('status') as AdminRequestStatus | null;

    const requests = await listAdminRequests(
        status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined,
    );

    return NextResponse.json({ requests });
}

// গ্রাহক নিজের কাস্টমার অ্যাকাউন্টের নাম ও ইমেইল দিয়ে অ্যাডমিন রেজিস্ট্রেশনের অনুরোধ করে
//
// নিয়ম:
//  - নাম ও ইমেইল সেশন থেকেই নেওয়া হয় (রিকোয়েস্ট বডি থেকে নয়) — যাচাইকৃত অ্যাকাউন্টের তথ্যই যায়
//  - অনুমোদন দেবেন প্রাথমিক (ইনিশিয়াল) অ্যাডমিন — অনুমোদনের পর রোল 'admin' হয়
//  - বর্তমানে কোনো অ্যাডমিন না থাকলে সাথে সাথেই অ্যাডমিন (ইনিশিয়াল অ্যাডমিনের নিয়ম)
export async function POST() {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { user } = guard.session;

    // ইতিমধ্যেই অ্যাডমিন
    if (user.role === ADMIN_ROLE) {
        return NextResponse.json(
            { error: 'You are already an administrator.' },
            { status: 409 },
        );
    }

    // একই সময়ে একাধিক অপেক্ষমাণ অনুরোধ রাখা যায় না
    const existing = await findAdminRequestByUserId(user.id);
    if (existing?.status === 'pending') {
        return NextResponse.json(
            { error: 'Your administrator request is already waiting for approval.' },
            { status: 409 },
        );
    }

    // কোনো অ্যাডমিন নেই মানে এই অ্যাকাউন্টটিই প্রথম অ্যাডমিন — সাথে সাথেই উন্নীত
    if ((await countAdmins()) === 0) {
        const promoted = await setUserRole(user.id, ADMIN_ROLE);
        if (!promoted) {
            return NextResponse.json(
                { error: 'Could not promote the account to administrator.' },
                { status: 500 },
            );
        }

        return NextResponse.json({ status: 'active' });
    }

    // অনুমোদনের অপেক্ষায় — সেশনের নাম ও ইমেইলই অনুরোধের তথ্য
    await createAdminRequest({
        userId: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
    });

    return NextResponse.json({ status: 'pending' });
}
