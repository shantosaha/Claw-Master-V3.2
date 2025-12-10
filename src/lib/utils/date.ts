import { format } from "date-fns";

// Firestore Timestamp interface
interface FirestoreTimestamp {
    toDate: () => Date;
}

export const formatDate = (date: Date | string | FirestoreTimestamp | null | undefined, formatStr: string = "MMM d, yyyy") => {
    if (!date) return "-";

    // Handle Firestore Timestamp
    if (date && typeof (date as FirestoreTimestamp).toDate === 'function') {
        return format((date as FirestoreTimestamp).toDate(), formatStr);
    }

    // Handle JS Date or string
    const d = new Date(date as Date | string);
    if (isNaN(d.getTime())) return "-";

    return format(d, formatStr);
};
