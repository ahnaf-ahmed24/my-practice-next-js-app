import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/admin';
import { deleteAddress, setDefaultAddress } from '@/lib/shop';

type RouteContext = { params: Promise<{ id: string }> };

// সংরক্ষিত ঠিকানা মুছে ফেলা (DELETE) ও ডিফল্ট করা (PATCH)
// শুধু কাস্টমার প্যানেল দিয়ে লগইন করা সেশনের জন্য
export async function DELETE(_request: Request, { params }: RouteContext) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;
    const deleted = await deleteAddress(guard.session.user.id, id);

    if (!deleted) {
        return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
}

export async function PATCH(_request: Request, { params }: RouteContext) {
    const guard = await requireCustomer();
    if (!guard.ok) {
        return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const { id } = await params;
    const updated = await setDefaultAddress(guard.session.user.id, id);

    if (!updated) {
        return NextResponse.json({ error: 'Address not found.' }, { status: 404 });
    }

    return NextResponse.json({ isDefault: true });
}
