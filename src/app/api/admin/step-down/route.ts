import { NextResponse } from 'next/server';
import { ADMIN_ROLE, getSession, isInitialAdmin, setUserRole } from '@/lib/admin';
import { CUSTOMER_ROLE } from '@/lib/auth-constants';

// অ্যাডমিন নিজে থেকেই পদ ছাড়ে (রোল আবার 'user') — অনুমোদনের পর যারা অ্যাডমিন হয়েছেন
// তাঁদের জন্য। যেকোনো স্কোপের সেশন চলে (কাস্টমার প্যানেল বা অ্যাডমিন প্যানেল)।
//
// প্রাথমিক (ইনিশিয়াল) অ্যাডমিন পদ ছাড়তে পারেন না — তিনিই একমাত্র অনুমোদনদাতা;
// তাঁর ছাড়া অনুমোদনের শৃঙ্খল ভেঙে যায় এবং শূন্য অ্যাডমিন অবস্থায় যে কেউ
// সরাসরি অ্যাডমিন হয়ে যেতে পারে (ইনিশিয়াল অ্যাডমিনের বুটস্ট্র্যাপ নিয়ম)।
export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 });
    }

    if (session.user.role !== ADMIN_ROLE) {
        return NextResponse.json({ error: 'You are not an administrator.' }, { status: 409 });
    }

    if (await isInitialAdmin(session.user.id)) {
        return NextResponse.json(
            {
                error:
                    'The initial administrator cannot step down. Approve another administrator first.',
            },
            { status: 403 },
        );
    }

    const steppedDown = await setUserRole(session.user.id, CUSTOMER_ROLE);
    if (!steppedDown) {
        return NextResponse.json({ error: 'Could not update the account.' }, { status: 500 });
    }

    return NextResponse.json({ status: 'stepped-down' });
}
