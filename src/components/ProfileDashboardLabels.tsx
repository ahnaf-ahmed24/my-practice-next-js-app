'use client';

import { useTranslations } from '@/components/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n';

// সার্ভার কম্পোনেন্ট থেকে ভাষা-ভিত্তিক লেবেল দেখানোর ছোট ক্লায়েন্ট কম্পোনেন্ট
const ProfileDashboardLabels = ({
    label,
    values,
}: {
    label: TranslationKey;
    values?: Record<string, string | number>;
}) => {
    const t = useTranslations();

    return <>{t(label, values)}</>;
};

export default ProfileDashboardLabels;
