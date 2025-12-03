import { format } from "date-fns";

export const formatDate = (date: any, formatStr: string = "MMM d, yyyy") => {
    if (!date) return "-";

    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
        return format(date.toDate(), formatStr);
    }

    // Handle JS Date or string
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";

    return format(d, formatStr);
};
