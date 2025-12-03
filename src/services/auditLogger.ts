import { auditService } from "./index";
import { AuditLog } from "@/types";

export const logAction = async (
    userId: string,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details?: any,
    oldValue?: any,
    newValue?: any
) => {
    try {
        await auditService.add({
            action,
            entityType,
            entityId,
            userId,
            timestamp: new Date(), // Firestore will convert this, or we can use serverTimestamp in the service
            details,
            oldValue,
            newValue
        } as any); // Type assertion needed because 'id' is omitted
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We don't want to block the main action if logging fails, but we should know about it.
    }
};
