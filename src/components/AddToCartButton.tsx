'use client';

import { toast } from 'sonner';
import { useCart, type CartItem } from '@/components/CartProvider';

type AddToCartButtonProps = {
    // কার্টে রাখার মতো সামান্য তথ্য যথেষ্ট — পুরো পণ্য অবজেক্ট লাগে না
    product: CartItem;
    variant?: 'sm' | 'lg';
};

// "Add to Cart" বাটন — কার্টে থাকলে বাটন ডিজেবল হয়ে যায় ("✓ In Cart")
// X চেপে কার্ট থেকে সরালে এই বাটন আবার চালু হয় (স্টেট কনটেক্সট থেকে আসে)
const AddToCartButton = ({ product, variant = 'sm' }: AddToCartButtonProps) => {
    const { isInCart, addItem } = useCart();
    const inCart = isInCart(product.id);

    const handleClick = () => {
        addItem({ id: product.id, name: product.name, price: product.price, image: product.image, icon: product.icon });
        toast.success(`${product.name} added to cart. 🛒`);
    };

    const isLarge = variant === 'lg';

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={inCart}
            aria-live="polite"
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wide shadow-lg transition-all duration-300 active:scale-95 ${
                isLarge ? 'w-full px-6 py-4 text-sm' : ''
            } ${
                inCart
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none dark:bg-slate-800 dark:text-slate-400'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-indigo-500/30 hover:opacity-90'
            }`}
        >
            {inCart ? '✓ In Cart' : '🛒 Add to Cart'}
        </button>
    );
};

export default AddToCartButton;
