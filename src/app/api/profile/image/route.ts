import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Binary } from 'mongodb';
import { auth } from '@/lib/auth';
import { db } from '@/lib/mongodb';
import {
    MAX_IMAGE_BYTES,
    PROFILE_IMAGE_COLLECTION,
    isAllowedImageType,
    profileImageUrl,
    type ProfileImageDoc,
} from '@/lib/profile-image';

// প্রোফাইল ছবি আপলোড (POST) ও মুছে ফেলা (DELETE) — লগইন ছাড়া চলে না
// ছবি মঙ্গোডিবি (Atlas)-এ বাইনারি হিসেবে সংরক্ষিত হয়
const images = () => db.collection<ProfileImageDoc>(PROFILE_IMAGE_COLLECTION);

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'You must be logged in to upload a photo.' }, { status: 401 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No image file received.' }, { status: 400 });
    }
    if (!isAllowedImageType(file.type)) {
        return NextResponse.json(
            { error: 'Unsupported format. Use JPG, PNG, WebP, AVIF or GIF.' },
            { status: 415 },
        );
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Image is too large (max 2 MB).' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
        return NextResponse.json({ error: 'The image file is empty.' }, { status: 400 });
    }

    // একই ইউজারের পুরনো ছবি প্রতিস্থাপন করা হয় (upsert)
    const now = new Date();
    await images().updateOne(
        { _id: session.user.id },
        {
            $set: {
                data: new Binary(buffer),
                contentType: file.type,
                size: buffer.length,
                updatedAt: now,
            },
        },
        { upsert: true },
    );

    return NextResponse.json({ image: profileImageUrl(session.user.id, now.getTime()) });
}

export async function DELETE() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    await images().deleteOne({ _id: session.user.id });

    return NextResponse.json({ image: null });
}
