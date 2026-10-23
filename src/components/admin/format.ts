// অ্যাডমিন প্যানেলের ছোট ফরম্যাট হেল্পার

// আবশ্যিক সময় — "2 min ago" / "3 hours ago"
export const formatRelativeTime = (iso: string, now: number = Date.now()) => {
    const diff = now - new Date(iso).getTime();
    const minutes = Math.round(diff / 60_000);

    if (Math.abs(minutes) < 1) return 'just now';
    if (Math.abs(minutes) < 60) return `${minutes} min ago`;

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return `${hours} hour${Math.abs(hours) === 1 ? '' : 's'} ago`;

    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) return `${days} day${Math.abs(days) === 1 ? '' : 's'} ago`;

    return formatDateTime(iso);
};

// পূর্ণ তারিখ ও সময়
export const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
