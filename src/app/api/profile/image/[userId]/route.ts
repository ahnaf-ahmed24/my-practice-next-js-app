import { connection } from 'next/server';
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/mongodb';
import { PROFILE_IMAGE_COLLECTION, type ProfileImageDoc } from '@/lib/profile-image';

// সংরক্ষিত প্রোফাইল ছবি সার্ভ করে — user.image ফিল্ডে রাখা URL এখান থেকে আসে
// URL-এ ?v= থাকে (ভার্সন), তাই ছবি বদলালে ব্রাউজার ক্যাশ আটকে থাকে না

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> },
) {
    // ক্যাশ-কম্পোনেন্টস চালু থাকায় প্রি-রেন্ডার এখানেই থামে — প্রতি রিকোয়েস্টে ডাটাবেজ থেকে পড়া হয়
    await connection();

    const { userId } = await context.params;

    // ইউজার আইডি ভ্যালিডেশন — শুধু মঙ্গোডিবি ObjectId আকারের আইডিই গ্রহণযোগ্য
    if (!/^[a-f\d]{24}$/i.test(userId)) {
        return new NextResponse(null, { status: 404 });
    }

    const doc = await db
        .collection<ProfileImageDoc>(PROFILE_IMAGE_COLLECTION)
        .findOne({ _id: userId });
    const bytes = doc?.data?.buffer;

    if (!doc || !bytes) {
        return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(new Uint8Array(bytes), {
        headers: {
            'Content-Type': doc.contentType ?? 'image/jpeg',
            // ভার্সন-যুক্ত URL তাই দীর্ঘ ক্যাশ নিরাপদ; ছবি আপডেট হলে নতুন URL বসে
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
