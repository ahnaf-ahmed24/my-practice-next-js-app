// অর্ডারের অবস্থা — ক্লায়েন্ট ও সার্ভার দুই জায়গায় ব্যবহার হয় (সার্ভার-নির্ভর কোড নেই)

// pending → processing → shipped → delivered   (cancelled আলাদা শাখা)
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS_STEPS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

// অ্যাডমিন প্যানেল থেকে পাঠানো শিপমেন্ট আপডেট — একটি ইভেন্ট
export type TrackingEvent = {
    id: string;
    status: OrderStatus;
    note: string;
    location: string;
    createdAt: string;
    createdBy: string;
};

// অ্যাডমিন একটি অর্ডার যেসব অবস্থায় নিতে পারে
export const ORDER_STATUS_TARGETS: OrderStatus[] = ['processing', 'shipped', 'delivered', 'cancelled'];

// একটি অবস্থা থেকে কোন অবস্থায় যাওয়া যায়
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
};

// অবস্থা বদলানোর অনুমোদিত কিনা যাচাই
export const canTransitionTo = (from: OrderStatus, to: OrderStatus) =>
    from === to || ORDER_STATUS_TRANSITIONS[from].includes(to);

// অবস্থা অনুযায়ী ধাপের সংখ্যা (০, ১, ২, ৩)
export const getStatusStep = (status: OrderStatus) => {
    const index = ORDER_STATUS_STEPS.indexOf(status);
    return index === -1 ? 0 : index;
};

// পুরোনো অর্ডারে স্ট্যাটাস ফিল্ড নেই — সেগুলোর অবস্থা বয়স থেকে বের হয়
// ২৪ ঘণ্টার মধ্যে প্রসেসিং, ৩ দিনে শিপড, এরপর ডেলিভারড
export const getOrderStatus = (createdAt: Date | string, now: Date = new Date()): OrderStatus => {
    const hours = (now.getTime() - new Date(createdAt).getTime()) / 3_600_000;

    if (hours < 24) return 'processing';
    if (hours < 72) return 'shipped';
    return 'delivered';
};

// অর্ডার ডকুমেন্টের প্রকৃত অবস্থা — স্ট্যাটাস না থাকলে পুরোনো নিয়মে বয়স থেকে
export const resolveOrderStatus = (order: {
    status?: OrderStatus | null;
    createdAt: Date | string;
}): OrderStatus => order.status ?? getOrderStatus(order.createdAt);

// অ্যাডমিন অনুমোদনের অপেক্ষায় আছে কি না
export const isAwaitingApproval = (status: OrderStatus) => status === 'pending';
