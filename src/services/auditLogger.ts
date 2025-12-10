import { auditService } from "./index";
import { AuditLog } from "@/types";

type DetailsType = string | Record<string, unknown> | undefined;

export const logAction = async (
    userId: string,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    details?: DetailsType,
    oldValue?: unknown,
    newValue?: unknown
): Promise<void> => {
    try {
        // Convert string details to object format for consistency
        const detailsObj: Record<string, unknown> | undefined = typeof details === 'string'
            ? { message: details }
            : details;

        await auditService.add({
            action,
            entityType,
            entityId,
            userId,
            timestamp: new Date(),
            details: detailsObj,
            oldValue,
            newValue
        } as Omit<AuditLog, 'id'>);
    } catch (error) {
        console.error("Failed to create audit log:", error);
        // We don't want to block the main action if logging fails, but we should know about it.
    }
};
