"use client";

import { createFirestoreService } from "./firestoreService";
import { Snapshot, StockItem, ArcadeMachine } from "@/types";
import { generateId } from "@/lib/utils";

const firestoreSnapshotService = createFirestoreService<Snapshot>("snapshots");

export const snapshotService = {
    ...firestoreSnapshotService,

    /**
     * Create a new snapshot for a stock item
     */
    async createForStockItem(item: StockItem, userId: string, label?: string): Promise<string> {
        const existingSnapshots = await this.getByEntity("stockItem", item.id);
        const version = existingSnapshots.length + 1;

        const snapshot: Omit<Snapshot, "id"> = {
            entityType: "stockItem",
            entityId: item.id,
            entityName: item.name,
            version,
            label,
            data: { ...item } as Record<string, unknown>,
            createdBy: userId,
            createdAt: new Date()
        };

        const id = generateId();
        await firestoreSnapshotService.set(id, snapshot);
        return id;
    },

    /**
     * Create a new snapshot for a machine
     */
    async createForMachine(machine: ArcadeMachine, userId: string, label?: string): Promise<string> {
        const existingSnapshots = await this.getByEntity("machine", machine.id);
        const version = existingSnapshots.length + 1;

        const snapshot: Omit<Snapshot, "id"> = {
            entityType: "machine",
            entityId: machine.id,
            entityName: machine.name,
            version,
            label,
            data: { ...machine } as Record<string, unknown>,
            createdBy: userId,
            createdAt: new Date()
        };

        const id = generateId();
        await firestoreSnapshotService.set(id, snapshot);
        return id;
    },

    /**
     * Get all snapshots for a specific entity
     */
    async getByEntity(entityType: "stockItem" | "machine", entityId: string): Promise<Snapshot[]> {
        const all = await firestoreSnapshotService.getAll();
        return all
            .filter(s => s.entityType === entityType && s.entityId === entityId)
            .sort((a, b) => b.version - a.version); // Newest first
    },

    /**
     * Compare two snapshots and return differences
     */
    diff(oldSnapshot: Snapshot, newSnapshot: Snapshot): { field: string; oldValue: unknown; newValue: unknown }[] {
        const differences: { field: string; oldValue: unknown; newValue: unknown }[] = [];
        const oldData = oldSnapshot.data;
        const newData = newSnapshot.data;

        // Fields to ignore in diff
        const ignoreFields = ["id", "updatedAt", "createdAt", "history"];

        const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

        allKeys.forEach(key => {
            if (ignoreFields.includes(key)) return;

            const oldVal = oldData[key];
            const newVal = newData[key];

            // Simple JSON stringify comparison (handles objects/arrays)
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                differences.push({
                    field: key,
                    oldValue: oldVal,
                    newValue: newVal
                });
            }
        });

        return differences;
    },

    /**
     * Get the latest snapshot for an entity
     */
    async getLatest(entityType: "stockItem" | "machine", entityId: string): Promise<Snapshot | null> {
        const snapshots = await this.getByEntity(entityType, entityId);
        return snapshots.length > 0 ? snapshots[0] : null;
    }
};
