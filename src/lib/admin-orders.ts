import { db } from '@/lib/mongodb';
import { USERS_COLLECTION, toUserObjectId, type AdminUserDoc } from '@/lib/admin';
import { getAllOrders, type OrderDoc } from '@/lib/shop';
import { resolveOrderStatus } from '@/lib/order-status';
import type { AdminOrderView } from '@/lib/order-views';

// অ্যাডমিন প্যানেলের জন্য অর্ডারগুলো গ্রাহকের তথ্যসহ দেখায়
export const getAdminOrders = async (limit = 100): Promise<AdminOrderView[]> => {
    const orders = await getAllOrders(limit);

    // গ্রাহকের নাম-ইমেইল একসাথে বের করা (N+1 এড়াতে)
    const userIds = [
        ...new Set(
            orders
                .map((order) => toUserObjectId(order.userId))
                .filter((id): id is NonNullable<typeof id> => id !== null),
        ),
    ];
    const users = await db
        .collection<AdminUserDoc>(USERS_COLLECTION)
        .find({ _id: { $in: userIds } })
        .toArray();
    const userById = new Map(users.map((user) => [user._id.toHexString(), user]));

    return orders.map((order) => toAdminOrderView(order, userById.get(order.userId)));
};

const toAdminOrderView = (order: OrderDoc, user?: AdminUserDoc): AdminOrderView => ({
    id: order.orderId,
    userId: order.userId,
    customerName: user?.name ?? 'Guest customer',
    customerEmail: user?.email ?? '',
    createdAt: new Date(order.createdAt).toISOString(),
    items: order.items ?? [],
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    total: order.total,
    paymentMethod: order.paymentMethod,
    estimatedDelivery: order.estimatedDelivery,
    address: order.address,
    // পুরোনো অর্ডারে স্ট্যাটাস নেই — বয়স থেকে বের হয়
    status: resolveOrderStatus(order),
    tracking: order.tracking ?? [],
    approvedAt: order.approvedAt ? new Date(order.approvedAt).toISOString() : null,
    approvedBy: order.approvedBy ?? null,
    updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
});
