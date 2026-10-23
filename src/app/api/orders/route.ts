import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/admin';
import { getDistricts } from '@/lib/bangladesh';
import { createOrder, getUserOrders, type OrderItem, type ShippingAddress } from '@/lib/shop';
import { resolveOrderStatus } from '@/lib/order-status';

// লগইন করা ইউজারের অর্ডার — তালিকা (GET) ও নতুন অর্ডার (POST)
// শুধু কাস্টমার প্যানেল দিয়ে লগইন করা সেশনের জন্য
export async function GET() {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;
    const orders = await getUserOrders(session.user.id);

    return NextResponse.json({
        orders: orders.map((order) => ({
            id: order.orderId,
            createdAt: order.createdAt.toISOString(),
            items: order.items,
            subtotal: order.subtotal,
            deliveryCharge: order.deliveryCharge,
            total: order.total,
            paymentMethod: order.paymentMethod,
            address: order.address,
            estimatedDelivery: order.estimatedDelivery,
            // অ্যাডমিন অনুমোদন ও লাইভ শিপমেন্ট ট্র্যাকিং
            status: resolveOrderStatus(order),
            tracking: order.tracking ?? [],
            approvedAt: order.approvedAt ? order.approvedAt.toISOString() : null,
        })),
    });
}

export async function POST(request: Request) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const items = body.items as OrderItem[] | undefined;
    const address = body.address as ShippingAddress | undefined;

    if (!Array.isArray(items) || !items.length || !address) {
        return NextResponse.json({ error: 'Order items and address are required.' }, { status: 400 });
    }

    // জেলা যেন নির্বাচিত বিভাগের মধ্যেই থাকে
    if (!getDistricts(address.division).includes(address.district)) {
        return NextResponse.json({ error: 'Invalid district for the selected division.' }, { status: 400 });
    }

    const subtotal = items.reduce((total, item) => total + Number(item.price ?? 0), 0);
    const deliveryCharge = Number(body.deliveryCharge ?? 0);
    const total = subtotal + deliveryCharge;

    const order = await createOrder({
        orderId: String(body.orderId ?? '').slice(0, 24) || `NM-${Date.now()}`,
        userId: session.user.id,
        items,
        subtotal,
        deliveryCharge,
        total,
        paymentMethod: String(body.paymentMethod ?? 'Cash on Delivery').slice(0, 40),
        address,
        estimatedDelivery: String(body.estimatedDelivery ?? '2–4 working days').slice(0, 40),
    });

    return NextResponse.json({ id: order.orderId, total: order.total }, { status: 201 });
}
