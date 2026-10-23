import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAdminOrders } from '@/lib/admin-orders';

// অ্যাডমিন প্যানেলের সব অর্ডার — শুধু অ্যাডমিন
export async function GET() {
    const guard = await requireAdmin();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const orders = await getAdminOrders();

    return NextResponse.json({ orders });
}
