import { NextResponse } from 'next/server';
import { ADMIN_ROLE, getSession, isInitialAdmin } from '@/lib/admin';
import { findAdminRequestByUserId } from '@/lib/admin-requests';
import { getSessionScope } from '@/lib/session-scope';

// লগইন করা ইউজারের অ্যাডমিন অবস্থা — অ্যাডমিন প্যানেলে নিজের অবস্থা দেখতে
// (নিজের তথ্য, তাই যেকোনো লগইন করা সেশনের জন্য কাজ করে)
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    const [initial, request] = await Promise.all([
        isInitialAdmin(session.user.id),
        findAdminRequestByUserId(session.user.id),
    ]);

    return NextResponse.json({
        role: session.user.role ?? 'user',
        isAdmin: session.user.role === ADMIN_ROLE,
        isInitialAdmin: initial,
        scope: getSessionScope(session),
        request: request
            ? {
                  status: request.status,
                  requestedAt: new Date(request.requestedAt).toISOString(),
                  reviewedAt: request.reviewedAt
                      ? new Date(request.reviewedAt).toISOString()
                      : null,
              }
            : null,
    });
}
