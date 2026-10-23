'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import Avatar from '@/components/Avatar';
import { useTranslations } from '@/components/LanguageProvider';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, isAllowedImageType } from '@/lib/profile-image';
import { resizeProfileImage } from '@/lib/resize-image';

type ProfileFormProps = {
    user: {
        name: string;
        email: string;
        image: string;
    };
};

// প্রোফাইল সম্পাদনা ফর্ম — নাম ও ছবি (ডিভাইস থেকে আপলোড, Atlas-এ সংরক্ষিত), ইমেইল পরিবর্তন করা যায় না
const ProfileForm = ({ user }: ProfileFormProps) => {
    const router = useRouter();
    const t = useTranslations();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState(user.name);
    const [image, setImage] = useState(user.image);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const isDirty = name !== user.name;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isDirty) return;

        setLoading(true);

        try {
            // Better Auth updateUser — শুধু name, ইমেইল নয়
            const result = await authClient.updateUser({ name });

            if (result.error) {
                toast.error(result.error.message ?? t('profile.updateFailed'));
                return;
            }

            toast.success(t('profile.profileUpdated'));
            router.refresh(); // নেভবারে নাম আপডেট হয়ে যায়
        } catch {
            toast.error(t('profile.networkError'));
        } finally {
            setLoading(false);
        }
    };

    // ডিভাইস থেকে ছবি বেছে নিলে — রিসাইজ → Atlas-এ সংরক্ষিত
    const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // একই ছবি আবার বাছলে ইভেন্ট আসবে

        if (!file) return;

        if (!isAllowedImageType(file.type)) {
            toast.error(t('profile.invalidImage'));
            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            toast.error(t('profile.imageTooLarge'));
            return;
        }

        setUploading(true);

        try {
            const { blob } = await resizeProfileImage(file);

            const body = new FormData();
            body.append('file', new File([blob], 'profile.jpg', { type: blob.type }));

            const response = await fetch('/api/profile/image', { method: 'POST', body });
            const data = (await response.json().catch(() => null)) as
                | { image?: string; error?: string }
                | null;

            if (!response.ok) {
                toast.error(data?.error ?? t('profile.photoSaveFailed'));
                return;
            }

            // Better Auth-এর user.image আপডেট — নেভবার ও প্রোফাইল দুটোই এখান থেকেই আপডেট হয়
            const result = await authClient.updateUser({ image: data?.image ?? '' });

            if (result.error) {
                toast.error(result.error.message ?? t('profile.photoSaveFailed'));
                return;
            }

            setImage(data?.image ?? '');
            toast.success(t('profile.photoSaved'));
            router.refresh();
        } catch {
            toast.error(t('profile.networkError'));
        } finally {
            // বাটন যেন আটকে না থাকে — রিকোয়েস্ট ব্যর্থ হলেও আবার ক্লিকযোগ্য হবে
            setUploading(false);
        }
    };

    // ছবি মুছে ফেলা — Atlas থেকে ডিলিট, তারপর অ্যাভাটার ফিরে আসে
    const handleRemovePhoto = async () => {
        if (uploading) return;
        setUploading(true);

        try {
            const response = await fetch('/api/profile/image', { method: 'DELETE' });

            if (!response.ok) {
                toast.error(t('profile.photoSaveFailed'));
                return;
            }

            // Better Auth-এর user.image আপডেট — নেভবার ও প্রোফাইল দুটোই এখান থেকেই আপডেট হয়
            const result = await authClient.updateUser({ image: null });

            if (result.error) {
                toast.error(result.error.message ?? t('profile.photoSaveFailed'));
                return;
            }

            setImage('');
            toast.success(t('profile.photoRemoved'));
            router.refresh();
        } catch {
            toast.error(t('profile.networkError'));
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);

        try {
            const { error } = await authClient.signOut();

            if (error) {
                toast.error(error.message ?? t('profile.networkError'));
                return;
            }

            toast.success(t('profile.profileUpdated'));
            router.replace('/');
            router.refresh();
        } catch {
            toast.error(t('profile.networkError'));
        } finally {
            // বাটন যেন আটকে না থাকে — রিকোয়েস্ট ব্যর্থ হলেও আবার ক্লিকযোগ্য হবে
            setSigningOut(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label className="block">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t('profile.name')}</span>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={user.name}
                    className="mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                />
            </label>

            <label className="mt-5 block">
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t('checkout.email')}</span>
                <input
                    type="email"
                    value={user.email}
                    readOnly
                    disabled
                    aria-readonly
                    className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200/70 bg-slate-100/70 px-3.5 py-3 text-sm text-slate-500 select-none dark:border-slate-700/70 dark:bg-slate-800/50 dark:text-slate-400"
                />
                <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
                    {t('profile.emailLocked')}
                </span>
            </label>

            {/* প্রোফাইল ছবি — ডিভাইস থেকে আপলোড, Atlas-এ সংরক্ষিত */}
            <div className="mt-5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('profile.profilePhoto')}
                </span>

                <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-700/70 dark:bg-slate-800/40">
                    <Avatar src={image} name={name} size="lg" />

                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="rounded-xl border border-slate-300/70 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
                        >
                            {uploading
                                ? t('profile.uploading')
                                : image
                                  ? t('profile.changePhoto')
                                  : t('profile.uploadPhoto')}
                        </button>

                        {image && (
                            <button
                                type="button"
                                onClick={handleRemovePhoto}
                                disabled={uploading}
                                className="rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500 transition-colors hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-rose-400"
                            >
                                {t('profile.removePhoto')}
                            </button>
                        )}
                    </div>
                </div>

                <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">
                    {t('profile.photoHint')}
                </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                    type="submit"
                    disabled={loading || !isDirty}
                    className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? t('profile.savingChanges') : t('profile.saveChanges')}
                </button>

                <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="rounded-2xl border border-slate-300/70 bg-white/70 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-slate-700 backdrop-blur transition-all duration-300 hover:border-rose-300 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-rose-700 dark:hover:text-rose-400"
                >
                    {signingOut ? t('profile.signingOut') : t('profile.signOut')}
                </button>
            </div>
        </form>
    );
};

export default ProfileForm;
