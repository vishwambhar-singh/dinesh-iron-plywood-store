export const formatToDDMMYY = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return '-';

    if (typeof dateStr === 'string') {
        const trimmed = dateStr.trim();
        // Exact YYYY-MM-DD (e.g. "2026-06-04")
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const [year, month, day] = trimmed.split('-');
            return `${day}/${month}/${year}`;
        }
        // If it includes timezone or timestamp (e.g. 2026-06-03T18:30:00.000Z)
        if (trimmed.includes('T') || trimmed.includes('Z') || trimmed.includes('+')) {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = String(d.getFullYear());
                return `${day}/${month}/${year}`;
            }
        }
        const cleanStr = trimmed.split('T')[0];
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
};

export const formatToYYYYMMDD = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return '';

    if (typeof dateStr === 'string') {
        const trimmed = dateStr.trim();
        // Exact YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }
        // If it has timezone or timestamp, convert to local browser calendar date
        if (trimmed.includes('T') || trimmed.includes('Z') || trimmed.includes('+')) {
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            }
        }
        return trimmed.split('T')[0];
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const getLocalDateString = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};
