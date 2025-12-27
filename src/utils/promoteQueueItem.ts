// Utility functions for automatic queue promotion

import { StockItem, MachineAssignment } from '@/types';
import { getMachineStockItems, migrateToMachineAssignments, updateAssignmentStatus, syncLegacyFieldsFromAssignments } from './machineAssignmentUtils';
import { stockService } from '@/services';

/**
 * Creates a history log entry for automatic promotion
 */
function createAutoPromotionLog(itemId: string, machineId: string, machineName: string, userId: string) {
    return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'AUTO_PROMOTED',
        entityType: 'StockItem' as const,
        entityId: itemId,
        userId,
        userRole: 'system',
        timestamp: new Date(),
        details: {
            machine: machineName,
            machineId,
            reason: 'Previous item removed - promoted from queue'
        }
    };
}

/**
 * Promotes the first item in the queue to "Using" status
 * Returns the promoted item or null if queue is empty
 */
export async function promoteFirstQueueItem(
    machineId: string,
    machineName: string,
    allItems: StockItem[],
    userId: string
): Promise<StockItem | null> {
    // Get queue items for this machine
    const { queueItems } = getMachineStockItems(machineId, allItems);

    if (queueItems.length === 0) {
        return null;
    }

    // Get the first queue item (oldest in queue)
    const itemToPromote = queueItems[0];

    // Update its assignment status from "Replacement" to "Using"
    const currentAssignments = migrateToMachineAssignments(itemToPromote);
    const updatedAssignments = updateAssignmentStatus(currentAssignments, machineId, 'Using');

    // Create history log
    const promotionLog = createAutoPromotionLog(itemToPromote.id, machineId, machineName, userId);
    const updatedHistory = [...(itemToPromote.history || []), promotionLog];

    // Update the item in database
    await stockService.update(itemToPromote.id, {
        machineAssignments: updatedAssignments,
        ...syncLegacyFieldsFromAssignments({ ...itemToPromote, machineAssignments: updatedAssignments }),
        history: updatedHistory,
        updatedAt: new Date()
    });

    return itemToPromote;
}

/**
 * Creates a history log entry for automatic unassignment
 */
export function createAutoUnassignLog(
    itemId: string,
    machineId: string,
    machineName: string,
    replacedByName: string,
    userId: string
) {
    return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'AUTO_UNASSIGNED',
        entityType: 'StockItem' as const,
        entityId: itemId,
        userId,
        userRole: 'system',
        timestamp: new Date(),
        details: {
            machine: machineName,
            machineId,
            replacedBy: replacedByName,
            reason: 'New item assigned as Using'
        }
    };
}
