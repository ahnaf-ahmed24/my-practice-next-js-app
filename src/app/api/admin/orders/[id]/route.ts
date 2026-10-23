import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { deleteOrderById, getOrderById, updateOrderStatus } from '@/lib/shop';
import {
    canTransitionTo,
    resolveOrderStatus,
    type OrderStatus,
} from '@/lib/order-status';

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// অ্যাডমিন একটি অর্ডারের অবস্থা বদলায় ও শিপমেন্ট ট্র্যাকিং আপডেট পাঠায়
export async function PATCH(request: Request, { params }: RouteContext) {
    const guard = await requireAdmin();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const order = await getOrderById(id);
    if (!order) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const currentStatus = resolveOrderStatus(order);

    const requestedStatus = body.status === undefined ? currentStatus : String(body.status);
    if (!VALID_STATUSES.includes(requestedStatus as OrderStatus)) {
        return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
    }

    const nextStatus = requestedStatus as OrderStatus;

    if (!canTransitionTo(currentStatus, nextStatus)) {
        return NextResponse.json(
            { error: `Cannot move an order from "${currentStatus}" to "${nextStatus}".` },
            { status: 409 },
        );
    }

    const note = typeof body.note === 'string' ? body.note.trim().slice(0, 200) : '';
    const location = typeof body.location === 'string' ? body.location.trim().slice(0, 80) : '';

    // অবস্থা না বদলালে শুধু নোট দিলেও একটি ট্র্যাকিং ইভেন্ট যোগ হবে
    if (nextStatus === currentStatus && !note) {
        return NextResponse.json(
            { error: 'Add a note or choose a new status.' },
            { status: 400 },
        );
    }

    const updated = await updateOrderStatus(id, nextStatus, {
        note,
        location,
        adminName: guard.session.user.name,
    });

    if (!updated) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
        status: nextStatus,
        tracking: updated.tracking,
        approvedAt: updated.approvedAt ? new Date(updated.approvedAt).toISOString() : null,
        approvedBy: updated.approvedBy ?? null,
        updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : null,
    });
}

// অ্যাডমিন যেকোনো অবস্থার অর্ডার মুছে ফেলতে পারে —
// (All orders / Awaiting approval / Processing / Shipped / Delivered / Cancelled সবগুলোতে কাজ করে)
export async function DELETE(_request: Request, { params }: RouteContext) {
    const guard = await requireAdmin();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;

    const deleted = await deleteOrderById(id);

    if (!deleted) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
}
