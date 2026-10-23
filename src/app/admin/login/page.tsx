import { Suspense } from 'react';
import type { Metadata } from 'next';
import AdminLoginPanel from '@/components/admin/AdminLoginPanel';

export const metadata: Metadata = {
    title: 'Administrator sign in — NextMart',
    description:
        'NextMart Control Center — administrator sign in, order approvals and live shipment tracking.',
};

// অ্যাডমিন প্যানেলের লগইন — ক্লায়েন্ট প্যানেল (/login) থেকে আলাদা
const AdminLoginPage = () => (
    <Suspense>
        <AdminLoginPanel />
    </Suspense>
);

export default AdminLoginPage;
