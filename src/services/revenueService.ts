"use client";

import { createFirestoreService } from "./firestoreService";
import { RevenueEntry, AttributedRevenue, StockItem, AuditLog } from "@/types";
import { where, orderBy } from "firebase/firestore";
import { machineRevenueService } from "./machineRevenueService";

const firestoreRevenueService = createFirestoreService<RevenueEntry>("revenueEntries");
const auditLogService = createFirestoreService<AuditLog>("auditLogs");

export interface RevenueFilters {
    startDate?: Date | string | null;
    endDate?: Date | string | null;
    machineId?: string | null;
}

export const revenueService = {
    ...firestoreRevenueService,

    /**
     * Get all revenue entries for a specific item with filters
     */
    async getByItem(itemId: string, filters: RevenueFilters = {}): Promise<RevenueEntry[]> {
        const all = await firestoreRevenueService.getAll();
        let entries = all.filter(e => e.itemId === itemId);

        if (filters.machineId && filters.machineId !== "all") {
            entries = entries.filter(e => e.machineId === filters.machineId);
        }

        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            entries = entries.filter(e => new Date(e.date) >= start);
        }

        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            entries = entries.filter(e => new Date(e.date) <= end);
        }

        return entries;
    },

    /**
     * Get all revenue entries for a specific machine
     */
    async getByMachine(machineId: string): Promise<RevenueEntry[]> {
        const all = await firestoreRevenueService.getAll();
        return all.filter(e => e.machineId === machineId);
    },

    /**
     * Calculate aggregate revenue stats for an item with filters
     */
    async getAggregates(itemId: string, filters: RevenueFilters = {}): Promise<{ totalRevenue: number; totalPlays: number; entryCount: number }> {
        const entries = await this.getByItem(itemId, filters);
        return {
            totalRevenue: entries.reduce((sum, e) => sum + e.amount, 0),
            totalPlays: entries.reduce((sum, e) => sum + (e.playCount || 0), 0),
            entryCount: entries.length
        };
    },

    /**
     * Get revenue breakdown by machine for an item (supporting legacy manual entries)
     */
    async getMachineBreakdown(itemId: string): Promise<{ machineId: string; machineName: string; totalRevenue: number; totalPlays: number }[]> {
        const entries = await this.getByItem(itemId);
        // This is a simple aggregation of manual entries, we'll keep it simple or deprecate it in favor of calculateAttributedRevenue
        const byMachine = new Map<string, { machineId: string; machineName: string; totalRevenue: number; totalPlays: number }>();

        for (const entry of entries) {
            if (entry.machineId) {
                const existing = byMachine.get(entry.machineId);
                if (existing) {
                    existing.totalRevenue += entry.amount;
                    existing.totalPlays += entry.playCount || 0;
                } else {
                    byMachine.set(entry.machineId, {
                        machineId: entry.machineId,
                        machineName: entry.machineName || "Unknown",
                        totalRevenue: entry.amount,
                        totalPlays: entry.playCount || 0
                    });
                }
            }
        }

        return Array.from(byMachine.values());
    },

    /**
     * Calculate revenue based on historical machine assignments and API readings with filters
     */
    async calculateAttributedRevenue(item: StockItem, filters: RevenueFilters = {}): Promise<AttributedRevenue> {
        try {
            // 1. Fetch Audit Logs to reconstruct assignment history
            const logs = await auditLogService.query(
                where("entityId", "==", item.id),
                orderBy("timestamp", "asc")
            );

            // 2. Build Timeline of Assignments
            const assignments: { machineId: string; machineName: string; start: Date; end?: Date }[] = [];
            let currentMachine: { id: string; name: string; start: Date } | null = null;

            const addAssignment = (machine: { id: string; name: string; start: Date }, endDate: Date) => {
                assignments.push({
                    machineId: machine.id,
                    machineName: machine.name,
                    start: machine.start,
                    end: endDate
                });
            };

            logs.forEach(log => {
                const details = log.details as any || {};
                const action = log.action.toLowerCase();
                const timestamp = new Date(log.timestamp);

                if ((action.includes("assign") || action.includes("using")) && !action.includes("unassign") && (details.toMachineId || details.machineId)) {
                    // Assignment started
                    const newMachineId = details.toMachineId || details.machineId;
                    const newMachineName = details.toMachine || details.machineName || "Unknown";

                    if (currentMachine) {
                        if (currentMachine.id !== newMachineId) {
                            addAssignment(currentMachine, timestamp);
                            currentMachine = { id: newMachineId, name: newMachineName, start: timestamp };
                        }
                    } else {
                        currentMachine = { id: newMachineId, name: newMachineName, start: timestamp };
                    }
                } else if (action.includes("unassign") || action.includes("removed") || (action.includes("transfer") && details.fromMachineId === currentMachine?.id)) {
                    // Assignment ended
                    if (currentMachine) {
                        addAssignment(currentMachine, timestamp);
                        currentMachine = null;
                    }

                    if (action.includes("transfer") && details.toMachineId) {
                        currentMachine = {
                            id: details.toMachineId,
                            name: details.toMachine || "Unknown",
                            start: timestamp
                        };
                    }
                }
            });

            if (currentMachine) {
                addAssignment(currentMachine, new Date());
            } else if (assignments.length === 0 && item.assignedMachineId) {
                const startDate = item.createdAt ? new Date(item.createdAt) : new Date();
                startDate.setDate(startDate.getDate() - 30);

                assignments.push({
                    machineId: item.assignedMachineId,
                    machineName: item.assignedMachineName || "Unknown",
                    start: startDate,
                    end: new Date()
                });
            }

            // 3. Filter Assignments based on user filter
            let filteredAssignments = assignments;

            if (filters.machineId && filters.machineId !== "all") {
                filteredAssignments = filteredAssignments.filter(a => a.machineId === filters.machineId);
            }

            // Clip assignments to date range
            if (filters.startDate || filters.endDate) {
                const rangeStart = filters.startDate ? new Date(filters.startDate) : new Date(0);
                const rangeEnd = filters.endDate ? new Date(filters.endDate) : new Date();
                if (filters.endDate) rangeEnd.setHours(23, 59, 59, 999);

                filteredAssignments = filteredAssignments.map(a => {
                    let start = a.start;
                    let end = a.end || new Date();

                    if (start > rangeEnd || end < rangeStart) return null; // No overlap

                    if (start < rangeStart) start = rangeStart;
                    if (end > rangeEnd) end = rangeEnd;

                    return { ...a, start, end };
                }).filter(Boolean) as typeof assignments;
            }

            // 4. Fetch readings for each assignment
            const breakdown: AttributedRevenue['breakdown'] = [];
            let totalRevenue = 0;
            let totalPlays = 0;

            for (const assign of filteredAssignments) {
                const readings = await machineRevenueService.getReadings(
                    assign.machineId,
                    assign.start,
                    assign.end || new Date()
                );

                const periodRevenue = readings.reduce((sum, r) => sum + r.revenue, 0);
                const periodPlays = readings.reduce((sum, r) => sum + r.playCount, 0);

                if (periodRevenue > 0) {
                    breakdown.push({
                        machineId: assign.machineId,
                        machineName: assign.machineName,
                        periodStart: assign.start,
                        periodEnd: assign.end || new Date(),
                        revenue: periodRevenue,
                        plays: periodPlays,
                        days: readings.length
                    });
                    totalRevenue += periodRevenue;
                    totalPlays += periodPlays;
                }
            }

            return {
                itemId: item.id,
                totalRevenue,
                totalPlays,
                breakdown
            };

        } catch (error) {
            console.error("Error calculating attributed revenue:", error);
            return { itemId: item.id, totalRevenue: 0, totalPlays: 0, breakdown: [] };
        }
    }
};
