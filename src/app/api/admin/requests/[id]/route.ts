import { NextResponse } from 'next/server';
import { ADMIN_ROLE, isInitialAdmin, requireAdmin, requireCustomer, setUserRole } from '@/lib/admin';
import {
    deleteAdminRequest,
    getAdminRequest,
    setAdminRequestStatus,
} from '@/lib/admin-requests';

type RouteContext = { params: Promise<{ id: string }> };

// অ্যাডমিন অনুরোধের সিদ্ধান্ত — অনুমোদন বা বাতিল
// একমাত্র ইনিশিয়াল (প্রথম) অ্যাডমিন এই সিদ্ধান্ত নিতে পারেন
export async function POST(request: Request, { params }: RouteContext) {
    const guard = await requireAdmin();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    const body = await request.json().catch(() => null);
    const decision = String(body?.decision ?? '');
    const note = typeof body?.note === 'string' ? body.note.slice(0, 300) : undefined;

    if (decision !== 'approve' && decision !== 'reject') {
        return NextResponse.json(
            { error: 'Decision must be either "approve" or "reject".' },
            { status: 400 },
        );
    }

    // ইনিশিয়াল অ্যাডমিনই অনুমোদন করতে পারবেন
    if (!(await isInitialAdmin(guard.session.user.id))) {
        return NextResponse.json(
            { error: 'Only the initial administrator can approve administrator requests.' },
            { status: 403 },
        );
    }

    const adminRequest = await getAdminRequest(id);
    if (!adminRequest) {
        return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (adminRequest.status !== 'pending') {
        return NextResponse.json(
            { error: 'This request has already been reviewed.' },
            { status: 409 },
        );
    }

    if (decision === 'approve') {
        // অনুমোদন — ইউজারটি অ্যাডমিন হিসেবে উন্নীত হয়
        const promoted = await setUserRole(adminRequest.userId, ADMIN_ROLE);
        if (!promoted) {
            return NextResponse.json(
                { error: 'Could not promote the account to administrator.' },
                { status: 500 },
            );
        }
    }

    await setAdminRequestStatus(
        id,
        decision === 'approve' ? 'approved' : 'rejected',
        guard.session.user.id,
        note,
    );

    return NextResponse.json({
        status: decision === 'approve' ? 'approved' : 'rejected',
        userId: adminRequest.userId,
    });
}

// গ্রাহক নিজের অপেক্ষমাণ অ্যাডমিন অনুরোধ তুলে নেয় (DELETE)
// নিজের অনুরোধই তুলে নেওয়া যায়, অন্যের নয় — আর শুধু 'pending' অনুরোধই
export async function DELETE(_request: Request, { params }: RouteContext) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    const adminRequest = await getAdminRequest(id);
    if (!adminRequest || adminRequest.userId !== guard.session.user.id) {
        return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    if (adminRequest.status !== 'pending') {
        return NextResponse.json(
            { error: 'This request has already been reviewed.' },
            { status: 409 },
        );
    }

    const deleted = await deleteAdminRequest(guard.session.user.id, id);
    if (!deleted) {
        return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
}
