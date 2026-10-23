// অর্ডার ও অ্যাডমিন অনুরোধের ভিউ টাইপ — ক্লায়েন্ট ও সার্ভার দুই জায়গায় ব্যবহৃত
// (কোনো সার্ভার-নির্ভর কোড নেই, তাই ক্লায়েন্ট কম্পোনেন্টেও ইমপোর্ট করা যায়)

import type { ShippingAddress } from '@/lib/address';
import type { OrderStatus, TrackingEvent } from '@/lib/order-status';

// অর্ডারে থাকা একটি পণ্য
export type OrderItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    icon?: string;
};

// অ্যাডমিন প্যানেলের অর্ডার ভিউ
export type AdminOrderView = {
    id: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    createdAt: string;
    items: OrderItem[];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    paymentMethod: string;
    estimatedDelivery: string;
    address: ShippingAddress;
    status: OrderStatus;
    tracking: TrackingEvent[];
    approvedAt: string | null;
    approvedBy: string | null;
    updatedAt: string | null;
};

// অ্যাডমিন অনুমোদনের অনুরোধ
export type AdminRequestView = {
    id: string;
    userId: string;
    name: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    note: string | null;
};

// গ্রাহকের অর্ডার ভিউ (প্রোফাইল ড্যাশবোর্ড)
export type CustomerOrderView = {
    id: string;
    createdAt: string;
    items: OrderItem[];
    subtotal: number;
    deliveryCharge: number;
    total: number;
    paymentMethod: string;
    estimatedDelivery: string;
    status: OrderStatus;
    tracking: TrackingEvent[];
    approvedAt: string | null;
    address: ShippingAddress;
};
