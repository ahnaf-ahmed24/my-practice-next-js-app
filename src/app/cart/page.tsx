import type { Metadata } from 'next';
import CartHeader from '@/components/CartHeader';
import CartView from '@/components/CartView';

export const metadata: Metadata = {
    title: 'Your Cart — NextMart',
    description: 'Review the products you added to your cart.',
};

// কার্ট পেজ — তালিকা ক্লায়েন্ট কম্পোনেন্ট (কার্ট স্টেট ব্রাউজারে থাকে)
const CartPage = () => (
    <div className="relative overflow-hidden">
        {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <CartHeader />

            <CartView />
        </div>
    </div>
);

export default CartPage;
