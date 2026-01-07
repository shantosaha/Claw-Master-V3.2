import { StockItem, MachineAssignment } from '@/types';

/**
 * Migrates legacy assignment fields to new machineAssignments array
 * Non-destructive: only populates if machineAssignments is empty/undefined
 */
export function migrateToMachineAssignments(item: StockItem): MachineAssignment[] {
    // If it explicitly has an array (even empty), trust it as source of truth
    if (Array.isArray(item.machineAssignments)) {
        // De-duplicate by machineId to prevent React key errors
        const seen = new Set<string>();
        return item.machineAssignments.filter(a => {
            if (seen.has(a.machineId)) return false;
            seen.add(a.machineId);
            return true;
        });
    }

    const assignments: MachineAssignment[] = [];

    // Migrate primary assignment
    if (item.assignedMachineId && item.assignedMachineName) {
        assignments.push({
            machineId: item.assignedMachineId,
            machineName: item.assignedMachineName,
            status: item.assignedStatus === 'Assigned for Replacement' ? 'Replacement' : 'Using',
            assignedAt: item.updatedAt || new Date(),
        });
    }

    // Migrate replacement machines
    if (item.replacementMachines && item.replacementMachines.length > 0) {
        item.replacementMachines.forEach(rm => {
            // Avoid duplicates
            if (!assignments.some(a => a.machineId === rm.id)) {
                assignments.push({
                    machineId: rm.id,
                    machineName: rm.name,
                    status: 'Replacement',
                    assignedAt: item.updatedAt || new Date(),
                });
            }
        });
    }

    return assignments;
}

/**
 * Get the primary (Using) assignment
 */
export function getPrimaryAssignment(item: StockItem): MachineAssignment | null {
    const assignments = migrateToMachineAssignments(item);
    return assignments.find(a => a.status === 'Using') || null;
}

/**
 * Get all replacement assignments
 */
export function getReplacementAssignments(item: StockItem): MachineAssignment[] {
    const assignments = migrateToMachineAssignments(item);
    return assignments.filter(a => a.status === 'Replacement');
}

/**
 * Get total assignment count
 */
export function getAssignmentCount(item: StockItem): number {
    return migrateToMachineAssignments(item).length;
}

/**
 * Check if item is assigned to a specific machine
 */
export function isAssignedToMachine(item: StockItem, machineId: string): boolean {
    const assignments = migrateToMachineAssignments(item);
    return assignments.some(a => a.machineId === machineId);
}

/**
 * Get the assignment for a specific machine
 */
export function getAssignmentForMachine(item: StockItem, machineId: string): MachineAssignment | null {
    const assignments = migrateToMachineAssignments(item);
    return assignments.find(a => a.machineId === machineId) || null;
}

/**
 * Get computed assigned status based on assignments
 */
export function getComputedAssignedStatus(item: StockItem): 'Not Assigned' | 'Assigned' | 'Assigned for Replacement' {
    const assignments = migrateToMachineAssignments(item);
    if (assignments.length === 0) return 'Not Assigned';
    if (assignments.some(a => a.status === 'Using')) return 'Assigned';
    return 'Assigned for Replacement';
}

/**
 * Add a new machine assignment
 */
export function addMachineAssignment(
    currentAssignments: MachineAssignment[],
    newAssignment: Omit<MachineAssignment, 'assignedAt'>
): MachineAssignment[] {
    // Check if already assigned to this machine
    if (currentAssignments.some(a => a.machineId === newAssignment.machineId)) {
        // Update existing assignment status instead
        return currentAssignments.map(a =>
            a.machineId === newAssignment.machineId
                ? { ...a, ...newAssignment, assignedAt: new Date() }
                : a
        );
    }

    return [
        ...currentAssignments,
        { ...newAssignment, assignedAt: new Date() }
    ];
}

/**
 * Remove a machine assignment
 */
export function removeMachineAssignment(
    currentAssignments: MachineAssignment[],
    machineId: string
): MachineAssignment[] {
    return currentAssignments.filter(a => a.machineId !== machineId);
}

/**
 * Update assignment status for a machine
 */
export function updateAssignmentStatus(
    currentAssignments: MachineAssignment[],
    machineId: string,
    newStatus: 'Using' | 'Replacement'
): MachineAssignment[] {
    return currentAssignments.map(a =>
        a.machineId === machineId
            ? { ...a, status: newStatus }
            : a
    );
}

/**
 * Get display text for assignments (for table view)
 */
export function getAssignmentDisplayText(item: StockItem): { text: string; count: number } {
    const assignments = migrateToMachineAssignments(item);
    const count = assignments.length;

    if (count === 0) {
        return { text: '-', count: 0 };
    }

    if (count === 1) {
        return { text: assignments[0].machineName, count: 1 };
    }

    // Get primary machine name for display
    const primary = assignments.find(a => a.status === 'Using');
    const displayName = primary?.machineName || assignments[0].machineName;
    return { text: `${displayName} +${count - 1}`, count };
}

/**
 * Sync legacy fields from machineAssignments array
 * Call this when saving to ensure backward compatibility
 */
export function syncLegacyFieldsFromAssignments(item: StockItem): Partial<StockItem> {
    const assignments = migrateToMachineAssignments(item);
    const primary = assignments.find(a => a.status === 'Using');
    const firstAssignment = primary || assignments[0];
    const replacements = assignments.filter(a => a.status === 'Replacement');

    return {
        assignedMachineId: firstAssignment?.machineId || null,
        assignedMachineName: firstAssignment?.machineName || null,
        assignedStatus: getComputedAssignedStatus(item),
        replacementMachines: replacements.map(a => ({ id: a.machineId, name: a.machineName })),
    };
}

/**
 * Get all stock items assigned to a specific machine
 * This is the SOURCE OF TRUTH - derives from stock items' machineAssignments
 */
export function getMachineStockItems(
    machineId: string,
    allItems: StockItem[],
    slotId?: string
): { currentItems: StockItem[], queueItems: StockItem[] } {
    const currentItems: StockItem[] = [];
    const queueItems: StockItem[] = [];

    for (const item of allItems) {
        const assignments = migrateToMachineAssignments(item);
        const matchingAssignment = assignments.find(a => a.machineId === machineId);

        if (matchingAssignment) {
            if (matchingAssignment.status === 'Using') {
                currentItems.push(item);
            } else if (matchingAssignment.status === 'Replacement') {
                queueItems.push(item);
            }
        }
    }

    return { currentItems, queueItems };
}
