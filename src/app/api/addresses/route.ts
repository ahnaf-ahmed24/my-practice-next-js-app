import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/admin';
import { getDistricts } from '@/lib/bangladesh';
import {
    createAddress,
    getUserAddresses,
    upsertAddress,
    type ShippingAddress,
} from '@/lib/shop';

// লগইন করা ইউজারের সংরক্ষিত ঠিকানা — তালিকা (GET) ও নতুন ঠিকানা (POST)
export async function GET() {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const addresses = await getUserAddresses(session.user.id);

    return NextResponse.json({
        addresses: addresses.map((item) => ({
            id: item._id?.toHexString() ?? '',
            label: item.label,
            address: item.address,
            isDefault: item.isDefault,
            createdAt: item.createdAt.toISOString(),
        })),
    });
}

// নতুন ঠিকানা যোগ করে (প্রোফাইলের ফর্ম)
export async function POST(request: Request) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const body = await request.json().catch(() => null);
    if (!body?.address) {
        return NextResponse.json({ error: 'Address details are required.' }, { status: 400 });
    }

    const address = body.address as ShippingAddress;
    const label = String(body.label ?? 'Home').slice(0, 30) || 'Home';

    // জেলা যেন নির্বাচিত বিভাগের মধ্যেই থাকে
    const validDistricts = getDistricts(address.division);
    if (!validDistricts.includes(address.district)) {
        return NextResponse.json({ error: 'Invalid district for the selected division.' }, { status: 400 });
    }

    if (!address.name || !address.phone || !address.area || !address.thana) {
        return NextResponse.json({ error: 'Name, phone, area and thana are required.' }, { status: 400 });
    }

    const saved = await createAddress(session.user.id, address, label);

    return NextResponse.json(
        { id: saved._id?.toHexString() ?? '', label: saved.label, isDefault: saved.isDefault },
        { status: 201 },
    );
}

// অর্ডারের সময় ঠিকানা সংরক্ষণ করে (PUT) — আগে থেকে একই ঠিকানা থাকলে
// সেটিই আপডেট হয়, নতুন এন্ট্রি বানানো হয় না
export async function PUT(request: Request) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const session = guard.session;

    const body = await request.json().catch(() => null);
    if (!body?.address) {
        return NextResponse.json({ error: 'Address details are required.' }, { status: 400 });
    }

    const address = body.address as ShippingAddress;
    const label = String(body.label ?? 'Home').slice(0, 30) || 'Home';

    const validDistricts = getDistricts(address.division);
    if (!validDistricts.includes(address.district)) {
        return NextResponse.json({ error: 'Invalid district for the selected division.' }, { status: 400 });
    }

    if (!address.name || !address.phone || !address.area || !address.thana) {
        return NextResponse.json({ error: 'Name, phone, area and thana are required.' }, { status: 400 });
    }

    const saved = await upsertAddress(session.user.id, address, label);

    return NextResponse.json({
        id: saved._id?.toHexString() ?? '',
        label: saved.label,
        isDefault: saved.isDefault,
        // true = আগের এন্ট্রি আপডেট হয়েছে, false = নতুন এন্ট্রি তৈরি হয়েছে
        updated: Boolean(saved.updated),
    });
}
