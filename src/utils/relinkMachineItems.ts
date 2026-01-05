import { StockItem, ArcadeMachine, ArcadeMachineSlot, UpcomingStockItem } from '@/types';
import { migrateToMachineAssignments } from './machineAssignmentUtils';

/**
 * Rebuilds machine slot assignments from stock item machineAssignments.
 * Stock items are the source of truth for assignments.
 * 
 * This function:
 * 1. Clears all machine slots' currentItem and upcomingQueue
 * 2. For each stock item with machineAssignments:
 *    - 'Using' status → sets as slot's currentItem
 *    - 'Replacement' status → adds to slot's upcomingQueue
 */
export function relinkMachineItems(
    machines: ArcadeMachine[],
    stockItems: StockItem[]
): ArcadeMachine[] {
    // Create a deep copy to avoid mutating the input
    const updatedMachines = machines.map(machine => ({
        ...machine,
        slots: machine.slots.map(slot => ({
            ...slot,
            currentItem: null as StockItem | null,
            upcomingQueue: [] as UpcomingStockItem[]
        }))
    }));

    // Build a map for quick machine lookup
    const machineMap = new Map<string, ArcadeMachine>();
    updatedMachines.forEach(m => machineMap.set(m.id, m));

    // Process each stock item's assignments
    for (const item of stockItems) {
        // Skip archived items
        if (item.isArchived) continue;

        const assignments = migrateToMachineAssignments(item);

        for (const assignment of assignments) {
            const machine = machineMap.get(assignment.machineId);
            if (!machine) continue;

            // For single-slot machines, use the first slot
            // For multi-slot machines, we use the first slot as well
            // (slot matching logic can be enhanced later if needed)
            const slot = machine.slots[0];
            if (!slot) continue;

            if (assignment.status === 'Using') {
                // Set as current item (only one item can be "Using" per slot)
                slot.currentItem = item;
            } else if (assignment.status === 'Replacement') {
                // Add to upcoming queue
                const upcomingItem: UpcomingStockItem = {
                    itemId: item.id,
                    name: item.name,
                    sku: item.sku,
                    imageUrl: item.imageUrl,
                    addedBy: 'system',
                    addedAt: new Date(assignment.assignedAt)
                };
                slot.upcomingQueue.push(upcomingItem);
            }
        }
    }

    // Update stock levels based on currentItem presence
    updatedMachines.forEach(machine => {
        machine.slots.forEach(slot => {
            if (slot.currentItem) {
                const qty = slot.currentItem.totalQuantity || 0;
                if (qty === 0) {
                    slot.stockLevel = 'Empty';
                } else if (qty < (slot.currentItem.lowStockThreshold || 10)) {
                    slot.stockLevel = 'Low';
                } else {
                    slot.stockLevel = 'Good';
                }
            } else {
                slot.stockLevel = 'Empty';
            }
        });
    });

    return updatedMachines;
}

/**
 * Clears all machine-stock linkages from machines.
 * Returns machines with empty currentItem and upcomingQueue in all slots.
 */
export function clearMachineSlotAssignments(machines: ArcadeMachine[]): ArcadeMachine[] {
    return machines.map(machine => ({
        ...machine,
        slots: machine.slots.map(slot => ({
            ...slot,
            currentItem: null,
            upcomingQueue: []
        }))
    }));
}
