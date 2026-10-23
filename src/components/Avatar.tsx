'use client';

import { useState } from 'react';

// ডিফল্ট অ্যাভাটার — public/ ফোল্ডারে থাকে, ছবি আপলোড না থাকলে এটিই দেখানো হয়
const DEFAULT_AVATAR = '/avatars/default-avatar.svg';

type AvatarProps = {
    // ইউজারের নিজের ছবি — না থাকলে (বা লোড না হলে) ডিফল্ট অ্যাভাটার
    src?: string | null;
    name: string;
    size?: 'sm' | 'lg';
};

// প্রোফাইল অ্যাভাটার — ছবি → ডিফল্ট অ্যাভাটার → ইনিশিয়াল (শেষ ফলব্যাক)
const Avatar = ({ src, name, size = 'sm' }: AvatarProps) => {
    const [photoFailed, setPhotoFailed] = useState(false);
    const [defaultFailed, setDefaultFailed] = useState(false);

    const initials = name.trim().charAt(0).toUpperCase() || 'U';
    const dimensions =
        size === 'lg' ? 'h-20 w-20 text-3xl ring-4 ring-white shadow-lg dark:ring-slate-800' : 'h-7 w-7 text-xs';

    // ১. ইউজারের আপলোড করা ছবি
    if (src && !photoFailed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src}
                alt={`${name}'s profile photo`}
                onError={() => setPhotoFailed(true)}
                className={`${dimensions} shrink-0 rounded-full object-cover`}
            />
        );
    }

    // ২. ডিফল্ট অ্যাভাটার (ছবি আপলোড করা হয়নি)
    if (!defaultFailed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={DEFAULT_AVATAR}
                alt="Default avatar"
                onError={() => setDefaultFailed(true)} // ফাইলটি না থাকলে ইনিশিয়াল দেখাবে
                className={`${dimensions} shrink-0 rounded-full object-cover`}
            />
        );
    }

    // ৩. শেষ ফলব্যাক — নামের প্রথম অক্ষর
    return (
        <span
            aria-hidden
            className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 font-extrabold text-white shadow-md shadow-indigo-500/30 ${dimensions}`}
        >
            {initials}
        </span>
    );
};

export default Avatar;
