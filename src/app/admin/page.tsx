import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Control Center — NextMart',
    description:
        'NextMart Control Center — order approvals, administrator approvals and live shipment tracking.',
};

// কন্ট্রোল প্যানেল এখন অ্যাডমিনের প্রোফাইলেই (/profile) — এটি শুধু পুরোনো লিংকের জন্য অ্যালিয়াস
const AdminPage = () => {
    redirect('/profile');
};

export default AdminPage;
