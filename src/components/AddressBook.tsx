'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from '@/components/LanguageProvider';
import { divisions, getDistricts } from '@/lib/bangladesh';

// প্রোফাইলে সংরক্ষিত ঠিকানার তালিকা ও নতুন ঠিকানা যোগ করার ফর্ম
export type AddressView = {
    id: string;
    label: string;
    isDefault: boolean;
    createdAt: string;
    address: {
        name: string;
        phone: string;
        altPhone?: string;
        email: string;
        division: string;
        district: string;
        thana: string;
        postCode?: string;
        area: string;
        landmark?: string;
        notes?: string;
    };
};

const inputClass =
    'mt-2 w-full rounded-xl border border-slate-300/70 bg-white/80 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500';

const AddressBook = ({ addresses }: { addresses: AddressView[] }) => {
    const t = useTranslations();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [division, setDivision] = useState('Dhaka');
    const [district, setDistrict] = useState('Dhaka');

    const districts = getDistricts(division);

    const handleDelete = async (id: string) => {
        const response = await fetch(`/api/addresses/${id}`, { method: 'DELETE' }).catch(() => null);

        if (!response?.ok) {
            toast.error(t('profile.error'));
            return;
        }

        toast.success(t('profile.addressDeleted'));
        router.refresh();
    };

    const handleSetDefault = async (id: string) => {
        const response = await fetch(`/api/addresses/${id}`, { method: 'PATCH' }).catch(() => null);

        if (!response?.ok) {
            toast.error(t('profile.error'));
            return;
        }

        toast.success(t('profile.addressUpdated'));
        router.refresh();
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);

        const form = new FormData(event.currentTarget);
        const address = {
            name: String(form.get('name') ?? '').trim(),
            phone: String(form.get('phone') ?? '').trim(),
            altPhone: String(form.get('altPhone') ?? '').trim(),
            email: String(form.get('email') ?? '').trim(),
            division: String(form.get('division') ?? ''),
            district: String(form.get('district') ?? ''),
            thana: String(form.get('thana') ?? '').trim(),
            postCode: String(form.get('postCode') ?? '').trim(),
            area: String(form.get('area') ?? '').trim(),
            landmark: String(form.get('landmark') ?? '').trim(),
            notes: String(form.get('notes') ?? '').trim(),
        };

        const response = await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: String(form.get('label') ?? 'Home'), address }),
        }).catch(() => null);

        setSaving(false);

        if (!response?.ok) {
            toast.error(t('profile.error'));
            return;
        }

        toast.success(t('profile.addressSaved'));
        setIsAdding(false);
        router.refresh();
    };

    return (
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700/70 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {t('profile.addressesTitle')}
                </h3>
                <button
                    type="button"
                    onClick={() => setIsAdding((current) => !current)}
                    className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-indigo-600 transition-colors duration-300 hover:border-indigo-400 hover:text-indigo-700 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-300"
                >
                    {isAdding ? t('profile.closeForm') : t('profile.addAddress')}
                </button>
            </div>

            {/* সংরক্ষিত ঠিকানা */}
            {addresses.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-300/80 p-5 text-center text-sm text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
                    {t('profile.addressesEmpty')}
                </p>
            ) : (
                <ul className="mt-5 space-y-3">
                    {addresses.map((item) => (
                        <li
                            key={item.id}
                            className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700/70 dark:bg-slate-900/40"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
                                        {item.label}
                                        {item.isDefault && (
                                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                                                {t('profile.defaultBadge')}
                                            </span>
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                                        {item.address.name} · {item.address.phone}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                        {item.address.area}, {item.address.thana}, {item.address.district},
                                        {item.address.division}
                                    </p>
                                    {item.address.landmark && (
                                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                            {item.address.landmark}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {!item.isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetDefault(item.id)}
                                        className="rounded-lg border border-slate-300/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 transition-colors duration-300 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
                                    >
                                        {t('profile.setDefault')}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(item.id)}
                                    className="rounded-lg border border-rose-200/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-rose-600 transition-colors duration-300 hover:border-rose-400 hover:text-rose-700 dark:border-rose-900/70 dark:text-rose-300"
                                >
                                    {t('profile.deleteAddress')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {/* নতুন ঠিকানার ফর্ম */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="mt-6 border-t border-slate-200/60 pt-6 dark:border-slate-700/60">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('profile.addressLabel')}
                            </span>
                            <input
                                type="text"
                                name="label"
                                defaultValue={t('profile.homeLabel')}
                                className={inputClass}
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.fullName')}
                            </span>
                            <input type="text" name="name" required className={inputClass} />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.phone')}
                            </span>
                            <input type="tel" name="phone" required inputMode="numeric" placeholder="01712345678" className={inputClass} />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.email')}
                            </span>
                            <input type="email" name="email" required className={inputClass} />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.division')}
                            </span>
                            <select
                                name="division"
                                value={division}
                                onChange={(event) => {
                                    setDivision(event.target.value);
                                    setDistrict(getDistricts(event.target.value)[0] ?? '');
                                }}
                                className={inputClass}
                            >
                                {divisions.map((item) => (
                                    <option key={item.name} value={item.name}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.district')}
                            </span>
                            <select
                                name="district"
                                value={district}
                                onChange={(event) => setDistrict(event.target.value)}
                                className={inputClass}
                            >
                                {districts.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.thana')}
                            </span>
                            <input type="text" name="thana" required className={inputClass} />
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.postCode')}
                            </span>
                            <input type="text" name="postCode" inputMode="numeric" className={inputClass} />
                        </label>

                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.address')}
                            </span>
                            <input type="text" name="area" required className={inputClass} />
                        </label>

                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.landmark')}
                            </span>
                            <input type="text" name="landmark" className={inputClass} />
                        </label>

                        <label className="block sm:col-span-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {t('checkout.notes')}
                            </span>
                            <textarea name="notes" rows={2} className={`${inputClass} resize-y`} />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-500/30 transition-all duration-500 hover:bg-right active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? t('profile.saving') : t('profile.saveAddress')}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddressBook;
