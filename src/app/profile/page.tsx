import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { isInitialAdmin } from '@/lib/admin';
import { getAdminOrders } from '@/lib/admin-orders';
import { findAdminRequestByUserId, listAdminRequests } from '@/lib/admin-requests';
import { getUserAddresses, getUserOrders } from '@/lib/shop';
import { resolveOrderStatus } from '@/lib/order-status';
import { getSessionScope } from '@/lib/session-scope';
import { formatPrice } from '@/lib/currency';
import Avatar from '@/components/Avatar';
import ProfileForm from '@/components/ProfileForm';
import OrderHistory, { type OrderView } from '@/components/OrderHistory';
import AddressBook, { type AddressView } from '@/components/AddressBook';
import ProfileDashboardLabels from '@/components/ProfileDashboardLabels';
import AdminConsole from '@/components/admin/AdminConsole';
import AdminRequestCard, { type AdminRequestState } from '@/components/AdminRequestCard';
import type { TranslationKey } from '@/lib/i18n';

// প্রোফাইলের শিরোনাম — শুধু গ্রাহকের ড্যাশবোর্ডে দেখানো হয়
const ProfileHeading = () => (
    <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-800/70 dark:bg-slate-900/70 dark:text-indigo-300">
            <ProfileDashboardLabels label="profile.badge" />
        </span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            <ProfileDashboardLabels label="profile.titleLead" />
            <span className="gradient-text">
                <ProfileDashboardLabels label="profile.titleAccent" />
            </span>
        </h2>
    </div>
);

// প্রোফাইল ড্যাশবোর্ড — সেশন, অর্ডার ও সংরক্ষিত ঠিকানা পড়ে
// (রানটাইম API ব্যবহার হওয়ায় সাসপেন্সের ভেতরে থাকতে হয়)
const ProfileContent = async () => {
    const session = await auth.api.getSession({ headers: await headers() });

    // প্রক্সি আগেই লগইন ছাড়া রোধ করে, এখানেও নিরাপত্তার জন্য যাচাই
    if (!session) {
        redirect('/login?next=/profile');
    }

    const { user } = session;

    // অ্যাডমিন প্যানেল দিয়ে লগইন করলেই কন্ট্রোল প্যানেল দেখা যায়
    // (কাস্টমার প্যানেলে লগইন করলে সাধারণ ড্যাশবোর্ড)
    if (user.role === 'admin' && getSessionScope(session) === 'admin') {
        const [orders, requests, initial] = await Promise.all([
            getAdminOrders(),
            listAdminRequests(),
            isInitialAdmin(user.id),
        ]);

        return (
            <AdminConsole
                initialOrders={orders}
                initialRequests={requests}
                adminName={user.name}
                isInitialAdmin={initial}
            />
        );
    }

    const [orders, addresses, adminRequest] = await Promise.all([
        getUserOrders(user.id),
        getUserAddresses(user.id),
        findAdminRequestByUserId(user.id),
    ]);

    // ড্যাশবোর্ডের পরিসংখ্যান
    const delivered = orders.filter((order) => resolveOrderStatus(order) === 'delivered').length;
    const inProgress = orders.length - delivered;
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

    // সার্ভার থেকে ক্লায়েন্টে পাঠানোর আগে ডেটা সরলীকরণ
    const orderViews: OrderView[] = orders.map((order) => ({
        id: order.orderId,
        createdAt: order.createdAt.toISOString(),
        items: order.items,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        total: order.total,
        paymentMethod: order.paymentMethod,
        estimatedDelivery: order.estimatedDelivery,
        // অ্যাডমিন অনুমোদন ও লাইভ শিপমেন্ট ট্র্যাকিং
        status: resolveOrderStatus(order),
        tracking: order.tracking ?? [],
        approvedAt: order.approvedAt ? order.approvedAt.toISOString() : null,
        address: {
            name: order.address.name,
            phone: order.address.phone,
            area: order.address.area,
            thana: order.address.thana,
            district: order.address.district,
            division: order.address.division,
            landmark: order.address.landmark,
            notes: order.address.notes,
        },
    }));

    const addressViews: AddressView[] = addresses.map((item) => ({
        id: item._id?.toHexString() ?? '',
        label: item.label,
        isDefault: item.isDefault,
        createdAt: item.createdAt.toISOString(),
        address: {
            name: item.address.name,
            phone: item.address.phone,
            altPhone: item.address.altPhone,
            email: item.address.email,
            division: item.address.division,
            district: item.address.district,
            thana: item.address.thana,
            postCode: item.address.postCode,
            area: item.address.area,
            landmark: item.address.landmark,
            notes: item.address.notes,
        },
    }));

    // গ্রাহকের নিজের অ্যাডমিন আবেদনের অবস্থা — তারিখ ফরম্যাট করে ক্লায়েন্টে পাঠানো হয়
    // (নাম ও ইমেইলও এখান থেকেই যায়, রিকোয়েস্ট বডি থেকে নয়)
    const adminRequestView: AdminRequestState | null = adminRequest
        ? {
              status: adminRequest.status,
              requestedAt: new Date(adminRequest.requestedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              }),
              reviewedAt: adminRequest.reviewedAt
                  ? new Date(adminRequest.reviewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })
                  : null,
              note: adminRequest.note ?? null,
          }
        : null;

    return (
        <>
            <ProfileHeading />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* ===== বাম কলাম — প্রোফাইল, পরিসংখ্যান, সংরক্ষিত ঠিকানা ===== */}
                <div className="space-y-6 lg:col-span-1">
                    {/* প্রোফাইল কার্ড */}
                    <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60">
                        <div className="flex flex-col items-center gap-4 sm:flex-row">
                            <Avatar src={user.image} name={user.name} size="lg" />
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {user.name}
                                </h1>
                                <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-400">
                                    {user.email}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    <ProfileDashboardLabels
                                        label="profile.memberSince"
                                        values={{ date: user.createdAt.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }) }}
                                    />
                                </p>
                                <span
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                        user.emailVerified
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                                    }`}
                                >
                                    <ProfileDashboardLabels
                                        label={user.emailVerified ? 'profile.verified' : 'profile.unverified'}
                                    />
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* অ্যাডমিন রেজিস্ট্রেশন — গ্রাহক নিজের অ্যাকাউন্ট দিয়ে অ্যাডমিন আবেদন করতে পারে */}
                    <AdminRequestCard
                        name={user.name}
                        email={user.email}
                        isAdmin={user.role === 'admin'}
                        request={adminRequestView}
                    />

                    {/* পরিসংখ্যান */}
                    <section className="grid grid-cols-2 gap-3">
                        <StatCard label="profile.statOrders" value={String(orders.length)} icon="📦" />
                        <StatCard label="profile.statProgress" value={String(inProgress)} icon="⏳" />
                        <StatCard label="profile.statDelivered" value={String(delivered)} icon="✅" />
                        <StatCard label="profile.statSpent" value={formatPrice(totalSpent)} icon="💰" />
                    </section>

                    {/* সংরক্ষিত ঠিকানা */}
                    <AddressBook addresses={addressViews} />
                </div>

                {/* ===== ডান কলাম — অর্ডার ও অ্যাকাউন্ট ===== */}
                <div className="space-y-6 lg:col-span-2">
                    {/* অতীত অর্ডার */}
                    <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                            <ProfileDashboardLabels label="profile.ordersTitle" />
                        </h2>
                        <div className="mt-5">
                            <OrderHistory orders={orderViews} />
                        </div>
                    </section>

                    {/* অ্যাকাউন্টের তথ্য */}
                    <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60">
                        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                            <ProfileDashboardLabels label="profile.accountTitle" />
                        </h2>
                        <div className="mt-5">
                            <ProfileForm
                                user={{
                                    name: user.name,
                                    email: user.email,
                                    image: user.image ?? '',
                                }}
                            />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
};

// ছোট লেবেল কম্পোনেন্ট — ভাষা অনুযায়ী টেক্সট দেখায়
const StatCard = ({
    label,
    value,
    icon,
}: {
    label: TranslationKey;
    value: string;
    icon: string;
}) => (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 text-center shadow-sm backdrop-blur sm:p-4 dark:border-slate-700/70 dark:bg-slate-900/60">
        <span className="text-xl">{icon}</span>
        <p className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white">{value}</p>
        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <ProfileDashboardLabels label={label} />
        </p>
    </div>
);

// সাসপেন্স ফলব্যাক (ক্যাশ কম্পোনেন্টস বাধ্যতামূলক)
const ProfileFallback = () => (
    <>
        <div className="mb-8 text-center">
            <div className="mx-auto h-7 w-40 animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
            <div className="mx-auto mt-5 h-10 w-72 max-w-full animate-pulse rounded-full bg-slate-200/70 dark:bg-slate-700/60" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
                <div className="animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 p-6 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                            <div className="h-4 w-40 max-w-[70%] rounded bg-slate-200 dark:bg-slate-700" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((key) => (
                        <div
                            key={key}
                            className="h-24 animate-pulse rounded-2xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60"
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-6 lg:col-span-2">
                <div className="h-72 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
                <div className="h-96 animate-pulse rounded-3xl border border-slate-200/70 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60" />
            </div>
        </div>
    </>
);

const ProfilePage = () => {
    return (
        <div className="relative overflow-hidden">
            {/* ডেকোরেটিভ গ্রেডিয়েন্ট অর্ব */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full sm:-top-32 sm:h-96 sm:w-96 bg-gradient-to-r from-blue-400/25 via-indigo-400/25 to-purple-500/25 blur-3xl dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-600/20" />

            <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
                <Suspense fallback={<ProfileFallback />}>
                    <ProfileContent />
                </Suspense>

                <p className="mt-6 text-center">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                        <ProfileDashboardLabels label="cart.continueShopping" />
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;
