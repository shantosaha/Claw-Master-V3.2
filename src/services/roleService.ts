"use client";

import { CustomRole, UserProfile, SYSTEM_ROLES } from "@/types";
import { createFirestoreService } from "./firestoreService";
import { isFirebaseInitialized } from "@/lib/firebase";

const firestoreRoleService = createFirestoreService<CustomRole>("roles");

// Default system roles with permissions
const DEFAULT_ROLES: CustomRole[] = [
    {
        id: "admin",
        name: "Admin",
        description: "Full system access with all permissions",
        icon: "Shield",
        color: "destructive",
        isSystem: true,
        sortOrder: 100,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: true,
            stockCheckSettings: true,
            viewInventory: true,
            editInventory: true,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: true,
            viewTeam: true,
            editTeam: true,
            editRoles: true,
            viewAnalytics: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "manager",
        name: "Manager",
        description: "Can approve operations and manage most features",
        icon: "UserCog",
        color: "default",
        isSystem: true,
        sortOrder: 90,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: true,
            stockCheckSettings: true,
            viewInventory: true,
            editInventory: true,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: true,
            viewTeam: true,
            editTeam: true,
            editRoles: false,
            viewAnalytics: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "supervisor",
        name: "Supervisor",
        description: "Can approve stock checks and oversee operations",
        icon: "Users",
        color: "default",
        isSystem: true,
        sortOrder: 80,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: true,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: true,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: true,
            viewTeam: true,
            editTeam: false,
            editRoles: false,
            viewAnalytics: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "tech",
        name: "Technician",
        description: "Machine maintenance and repair access",
        icon: "Wrench",
        color: "secondary",
        isSystem: true,
        sortOrder: 70,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: false,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: false,
            viewMachines: true,
            editMachines: true,
            viewMaintenance: true,
            editMaintenance: true,
            viewRevenue: false,
            viewTeam: false,
            editTeam: false,
            editRoles: false,
            viewAnalytics: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "claw_staff",
        name: "Claw Staff",
        description: "Stock and machine operations on the floor",
        icon: "Hand",
        color: "secondary",
        isSystem: true,
        sortOrder: 60,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: false,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: true,
            viewMachines: true,
            editMachines: false,
            viewMaintenance: true,
            editMaintenance: false,
            viewRevenue: false,
            viewTeam: false,
            editTeam: false,
            editRoles: false,
            viewAnalytics: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "crew",
        name: "Crew",
        description: "Basic floor staff with stock check access",
        icon: "User",
        color: "outline",
        isSystem: true,
        sortOrder: 50,
        permissions: {
            stockCheckSubmit: true,
            stockCheckApprove: false,
            stockCheckSettings: false,
            viewInventory: true,
            editInventory: false,
            viewMachines: true,
            editMachines: false,
            viewMaintenance: true,
            editMaintenance: false,
            viewRevenue: false,
            viewTeam: false,
            editTeam: false,
            editRoles: false,
            viewAnalytics: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

// Demo mode storage
let demoRoles: CustomRole[] = [...DEFAULT_ROLES];

/**
 * Normalize a name for comparison (lowercase, remove spaces/hyphens/underscores)
 */
function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[\s\-_]/g, "");
}

/**
 * Calculate Levenshtein distance between two strings
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

export const roleService = {
    /**
     * Get all roles sorted by sortOrder
     */
    getAll: async (): Promise<CustomRole[]> => {
        if (!isFirebaseInitialized) {
            return [...demoRoles].sort((a, b) => b.sortOrder - a.sortOrder);
        }

        const roles = await firestoreRoleService.getAll();

        // Seed defaults if empty
        if (roles.length === 0) {
            await roleService.seedDefaults();
            return [...DEFAULT_ROLES].sort((a, b) => b.sortOrder - a.sortOrder);
        }

        return roles.sort((a, b) => b.sortOrder - a.sortOrder);
    },

    /**
     * Get a single role by ID
     */
    getById: async (id: string): Promise<CustomRole | null> => {
        if (!isFirebaseInitialized) {
            return demoRoles.find(r => r.id === id) || null;
        }
        return firestoreRoleService.getById(id);
    },

    /**
     * Check if a role name is a duplicate or similar to existing
     * Returns: { isDuplicate: boolean, similar?: CustomRole }
     */
    checkDuplicate: async (name: string, excludeId?: string): Promise<{ isDuplicate: boolean; similar?: CustomRole }> => {
        const roles = await roleService.getAll();
        const normalized = normalizeName(name);

        for (const role of roles) {
            if (excludeId && role.id === excludeId) continue;

            const roleNormalized = normalizeName(role.name);

            // Exact match after normalization or very close (distance <= 2)
            if (roleNormalized === normalized) {
                return { isDuplicate: true, similar: role };
            }

            const distance = levenshteinDistance(normalized, roleNormalized);
            if (distance <= 2) {
                return { isDuplicate: true, similar: role };
            }
        }

        return { isDuplicate: false };
    },

    /**
     * Create a new custom role
     */
    create: async (role: Omit<CustomRole, "id" | "createdAt" | "updatedAt">): Promise<CustomRole> => {
        // Generate slug ID from name
        const id = role.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

        const newRole: CustomRole = {
            ...role,
            id,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Strict blocking: Check for duplicates before creating
        const duplicateCheck = await roleService.checkDuplicate(newRole.name);
        if (duplicateCheck.isDuplicate) {
            throw new Error(`Cannot create role: Name "${newRole.name}" is too similar to existing role "${duplicateCheck.similar?.name}"`);
        }

        if (!isFirebaseInitialized) {
            demoRoles.push(newRole);
            return newRole;
        }

        await firestoreRoleService.set(id, newRole);
        return newRole;
    },

    /**
     * Update an existing role
     */
    update: async (id: string, data: Partial<CustomRole>): Promise<void> => {
        if (!isFirebaseInitialized) {
            const index = demoRoles.findIndex(r => r.id === id);
            if (index !== -1) {
                demoRoles[index] = { ...demoRoles[index], ...data, updatedAt: new Date() };
            }
            return;
        }

        if (data.name) {
            const duplicateCheck = await roleService.checkDuplicate(data.name, id);
            if (duplicateCheck.isDuplicate) {
                throw new Error(`Cannot update role: Name "${data.name}" is too similar to existing role "${duplicateCheck.similar?.name}"`);
            }
        }

        if (data.name) {
            const duplicateCheck = await roleService.checkDuplicate(data.name, id);
            if (duplicateCheck.isDuplicate) {
                throw new Error(`Cannot update role: Name "${data.name}" is too similar to existing role "${duplicateCheck.similar?.name}"`);
            }
        }

        await firestoreRoleService.update(id, { ...data, updatedAt: new Date() });
    },

    /**
     * Delete a custom role (cannot delete system roles)
     */
    remove: async (id: string): Promise<{ success: boolean; error?: string }> => {
        const role = await roleService.getById(id);

        if (!role) {
            return { success: false, error: "Role not found" };
        }

        if (role.isSystem || SYSTEM_ROLES.includes(id as any)) {
            return { success: false, error: "Cannot delete system roles" };
        }

        if (!isFirebaseInitialized) {
            demoRoles = demoRoles.filter(r => r.id !== id);
            return { success: true };
        }

        await firestoreRoleService.remove(id);
        return { success: true };
    },

    /**
     * Seed default roles (run once on first load)
     */
    seedDefaults: async (): Promise<void> => {
        if (!isFirebaseInitialized) {
            demoRoles = [...DEFAULT_ROLES];
            return;
        }

        for (const role of DEFAULT_ROLES) {
            await firestoreRoleService.set(role.id, role);
        }
    },

    /**
     * Get permissions for a role ID
     */
    getPermissions: async (roleId: string): Promise<UserProfile["permissions"] | null> => {
        const role = await roleService.getById(roleId);
        return role?.permissions || null;
    },
};
