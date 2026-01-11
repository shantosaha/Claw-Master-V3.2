"use client";

import { PermissionDef } from "@/types";
import { createFirestoreService } from "./firestoreService";
import { isFirebaseInitialized } from "@/lib/firebase";

const firestorePermissionService = createFirestoreService<PermissionDef>("permissions");

// Default system permissions
// These match the keys currently used in UserProfile['permissions']
const DEFAULT_PERMISSIONS: PermissionDef[] = [
    // Stock Check
    { id: "stockCheckSubmit", name: "Submit Stock Checks", description: "Can submit new stock check reports", isSystem: true, targetEntity: "stockCheck", actionType: "create", createdAt: new Date(), updatedAt: new Date() },
    { id: "stockCheckApprove", name: "Approve Stock Checks", description: "Can approve or reject pending stock checks", isSystem: true, targetEntity: "stockCheck", actionType: "approve", createdAt: new Date(), updatedAt: new Date() },
    { id: "stockCheckSettings", name: "Configure Stock Check Settings", description: "Can modify stock check configuration", isSystem: true, targetEntity: "stockCheck", actionType: "configure", createdAt: new Date(), updatedAt: new Date() },

    // Inventory
    { id: "viewInventory", name: "View Inventory", description: "Can view stock items and levels", isSystem: true, targetEntity: "inventory", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "editInventory", name: "Edit Inventory", description: "Can add, edit, or remove stock items", isSystem: true, targetEntity: "inventory", actionType: "update", createdAt: new Date(), updatedAt: new Date() },

    // Machines
    { id: "viewMachines", name: "View Machines", description: "Can view machine details and status", isSystem: true, targetEntity: "machine", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "editMachines", name: "Edit Machines", description: "Can modify machine details and settings", isSystem: true, targetEntity: "machine", actionType: "update", createdAt: new Date(), updatedAt: new Date() },
    { id: "viewMaintenance", name: "View Maintenance", description: "Can view maintenance logs", isSystem: true, targetEntity: "maintenance", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "editMaintenance", name: "Edit Maintenance", description: "Can create and update maintenance records", isSystem: true, targetEntity: "maintenance", actionType: "update", createdAt: new Date(), updatedAt: new Date() },

    // Admin / Team
    { id: "viewRevenue", name: "View Revenue", description: "Can view financial data and reports", isSystem: true, targetEntity: "revenue", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "viewAnalytics", name: "View Analytics", description: "Can view system analytics dashboard", isSystem: true, targetEntity: "settings", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "viewTeam", name: "View Team", description: "Can view team member list", isSystem: true, targetEntity: "user", actionType: "read", createdAt: new Date(), updatedAt: new Date() },
    { id: "editTeam", name: "Edit Team", description: "Can manage team members and invites", isSystem: true, targetEntity: "user", actionType: "update", createdAt: new Date(), updatedAt: new Date() },
    { id: "editRoles", name: "Manage Roles", description: "Can create and edit custom roles", isSystem: true, targetEntity: "settings", actionType: "configure", createdAt: new Date(), updatedAt: new Date() },
];

let demoPermissions: PermissionDef[] = [...DEFAULT_PERMISSIONS];

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[\s\-_]/g, "");
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

export const permissionService = {
    getAll: async (): Promise<PermissionDef[]> => {
        if (!isFirebaseInitialized) {
            return [...demoPermissions];
        }
        const perms = await firestorePermissionService.getAll();
        if (perms.length === 0) {
            await permissionService.seedDefaults();
            return [...DEFAULT_PERMISSIONS];
        }
        return perms;
    },

    checkDuplicate: async (
        name: string,
        excludeId?: string,
        targetEntity?: string,
        actionType?: string
    ): Promise<{
        isDuplicate: boolean;
        isWarning: boolean;
        similar?: PermissionDef;
        reason?: string;
    }> => {
        const perms = await permissionService.getAll();
        const normalized = normalizeName(name);

        for (const p of perms) {
            if (excludeId && p.id === excludeId) continue;

            const pNormalized = normalizeName(p.name);
            const distance = levenshteinDistance(normalized, pNormalized);

            // BLOCK: Exact match or very close (distance <= 2)
            if (distance <= 2) {
                return {
                    isDuplicate: true,
                    isWarning: false,
                    similar: p,
                    reason: `Name "${name}" is too similar to existing permission "${p.name}"`
                };
            }

            // WARNING: Same entity + action combination
            if (targetEntity && actionType && p.targetEntity === targetEntity && p.actionType === actionType) {
                return {
                    isDuplicate: false,
                    isWarning: true,
                    similar: p,
                    reason: `Similar permission exists: "${p.name}" (same ${targetEntity} ${actionType} action)`
                };
            }

            // WARNING: Moderate similarity (distance 3-5)
            if (distance <= 5) {
                return {
                    isDuplicate: false,
                    isWarning: true,
                    similar: p,
                    reason: `Name may be too similar to "${p.name}". Consider using a more distinct name.`
                };
            }
        }
        return { isDuplicate: false, isWarning: false };
    },

    create: async (
        perm: Omit<PermissionDef, "id" | "createdAt" | "updatedAt">,
        skipWarning?: boolean
    ): Promise<PermissionDef> => {
        // Check for duplicates before creating
        const duplicateCheck = await permissionService.checkDuplicate(
            perm.name,
            undefined,
            perm.targetEntity,
            perm.actionType
        );

        // Block on exact/near-exact duplicates
        if (duplicateCheck.isDuplicate) {
            throw new Error(duplicateCheck.reason || `Cannot create: Name is too similar to existing permission`);
        }

        // Warning can be skipped by user
        if (duplicateCheck.isWarning && !skipWarning) {
            throw new Error(`WARNING:${duplicateCheck.reason}`);
        }

        // Generate ID from name (e.g. "Edit Machine Name" -> "edit_machine_name")
        const id = perm.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

        const newPerm: PermissionDef = {
            ...perm,
            id,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (!isFirebaseInitialized) {
            demoPermissions.push(newPerm);
            return newPerm;
        }

        await firestorePermissionService.set(id, newPerm);
        return newPerm;
    },

    remove: async (id: string): Promise<{ success: boolean; error?: string }> => {
        const perm = await firestorePermissionService.getById(id) || demoPermissions.find(p => p.id === id);

        if (!perm) return { success: false, error: "Permission not found" };
        if (perm.isSystem) return { success: false, error: "Cannot delete system permissions" };

        if (!isFirebaseInitialized) {
            demoPermissions = demoPermissions.filter(p => p.id !== id);
            return { success: true };
        }

        await firestorePermissionService.remove(id);
        return { success: true };
    },

    seedDefaults: async (): Promise<void> => {
        if (isFirebaseInitialized) {
            for (const p of DEFAULT_PERMISSIONS) {
                await firestorePermissionService.set(p.id, p);
            }
        }
    }
};
