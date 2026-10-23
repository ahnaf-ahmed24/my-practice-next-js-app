'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

// কার্টে রাখা পণ্যের সামান্য কপি (পুরো ডেটাসেট ক্লায়েন্টে না পাঠাতে)
export type CartItem = {
    id: string;
    name: string;
    price: number;
    image: string;
    icon?: string;
};

type CartContextValue = {
    items: CartItem[];
    isInCart: (id: string) => boolean;
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// localStorage কী — রিফ্রেশ করলেও কার্ট থেকে যায়
const STORAGE_KEY = 'nextmart-cart';

// সার্ভার রেন্ডারে কার্ট খালি (localStorage থাকে না)
const EMPTY_ITEMS: CartItem[] = [];

// স্ন্যাপশটের রেফারেন্স স্থির রাখা হয় — নইলে useSyncExternalStore লুপে পড়ে
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY_ITEMS;

const parseItems = (raw: string): CartItem[] => {
    try {
        const data: unknown = JSON.parse(raw);
        return Array.isArray(data) ? (data as CartItem[]) : EMPTY_ITEMS;
    } catch {
        // নষ্ট ডেটা হলে শান্তভাবে খালি কার্ট
        return EMPTY_ITEMS;
    }
};

const readItems = (): CartItem[] => {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? '';
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedItems = parseItems(raw);
    }
    return cachedItems;
};

// লেখার পর নিজের ট্যাবেও রি-রেন্ডার হয় (storage ইভেন্ট শুধু অন্য ট্যাবে আসে)
const writeItems = (items: CartItem[]) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // প্রাইভেট মোড/ফুল স্টোরেজ — ব্যর্থ হলেও অ্যাপ চলতে থাকে
    }
    window.dispatchEvent(new Event('cart-changed'));
};

const subscribe = (onChange: () => void) => {
    window.addEventListener('storage', onChange);
    window.addEventListener('cart-changed', onChange);
    return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener('cart-changed', onChange);
    };
};

const getServerSnapshot = () => EMPTY_ITEMS;

// কার্ট স্টেট শেয়ার করে — পেজ রিলোড ছাড়া সব জায়গায় একই কার্ট
export const useCart = (): CartContextValue => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a <CartProvider>.');
    }
    return context;
};

const CartProvider = ({ children }: { children: ReactNode }) => {
    // localStorage-ই একমাত্র সত্য — সার্ভার/ক্লায়েন্ট দুই জায়গায় নিরাপদ
    const items = useSyncExternalStore(subscribe, readItems, getServerSnapshot);

    const isInCart = useCallback((id: string) => items.some((item) => item.id === id), [items]);

    const addItem = useCallback((item: CartItem) => {
        const current = readItems();
        if (current.some((existing) => existing.id === item.id)) return;
        writeItems([...current, item]);
    }, []);

    const removeItem = useCallback((id: string) => {
        writeItems(readItems().filter((item) => item.id !== id));
    }, []);

    const clearCart = useCallback(() => writeItems(EMPTY_ITEMS), []);

    const value = useMemo(
        () => ({ items, isInCart, addItem, removeItem, clearCart }),
        [items, isInCart, addItem, removeItem, clearCart],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
