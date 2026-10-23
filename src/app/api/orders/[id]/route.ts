import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/admin';
import { deleteOrder, getOrderById } from '@/lib/shop';
import { resolveOrderStatus } from '@/lib/order-status';

type RouteContext = { params: Promise<{ id: string }> };

// অর্ডার মুছে ফেলা (DELETE) — লগইন করা ইউজারের নিজের অর্ডারই মোছা যায়
export async function DELETE(_request: Request, { params }: RouteContext) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const { id } = await params;

    // অর্ডারটি আদৌ এই ইউজারের কি না দেখা
    const order = await getOrderById(id);
    if (!order || order.userId !== session.user.id) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // প্রসেসিং বা তার পরের ধাপে (শিপড) ঢুকলে আর বাতিল করা যায় না —
    // পুরনো অর্ডারে স্ট্যাটাস ফিল্ড না থাকলেও প্রকৃত অবস্থা বয়স থেকে মিলিয়ে দেখা হয়
    const status = resolveOrderStatus(order);
    if (status === 'processing' || status === 'shipped') {
        return NextResponse.json(
            {
                error:
                    'This order is already being processed — an administrator has approved it, so it can no longer be cancelled.',
            },
            { status: 409 },
        );
    }

    const deleted = await deleteOrder(session.user.id, id);

    if (!deleted) {
        return NextResponse.json(
            {
                error:
                    'This order is already being processed — an administrator has approved it, so it can no longer be cancelled from here.',
            },
            { status: 409 },
        );
    }

    return NextResponse.json({ deleted: true });
}

// অর্ডারের বর্তমান অবস্থা (গ্রাহকের ট্র্যাকিং ভিউয়ের জন্য)
export async function GET(_request: Request, { params }: RouteContext) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const { id } = await params;
    const order = await getOrderById(id);

    if (!order || order.userId !== session.user.id) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({
        id: order.orderId,
        status: resolveOrderStatus(order),
        tracking: order.tracking ?? [],
        approvedAt: order.approvedAt ? order.approvedAt.toISOString() : null,
        updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
    });
}
