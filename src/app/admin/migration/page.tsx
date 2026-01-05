"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { stockService, machineService, auditService } from "@/services";
import { AuditLog } from "@/types";

export default function MigrationPage() {
    const [status, setStatus] = useState("Ready");
    const [progress, setProgress] = useState(0);

    const runMigration = async () => {
        setStatus("Fetching items and machines...");
        try {
            const items = await stockService.getAll();
            const machines = await machineService.getAll();

            let total = 0;
            let current = 0;

            // Calculate total logs (using type assertion for legacy data)
            const itemLogs = items.flatMap(i => (i as any).history || []);
            const machineLogs = machines.flatMap(m => (m as any).history || []);
            total = itemLogs.length + machineLogs.length;

            setStatus(`Found ${total} logs to migrate. Starting...`);

            if (total === 0) {
                setStatus("No history logs found to migrate.");
                return;
            }

            // Migrate Item Logs
            for (const item of items) {
                const itemHistory = (item as any).history as AuditLog[] | undefined;
                if (itemHistory && itemHistory.length > 0) {
                    for (const log of itemHistory) {
                        const { id, ...logData } = log;
                        const data = {
                            ...logData,
                            timestamp: new Date(log.timestamp),
                            entityType: log.entityType || 'StockItem',
                            entityId: log.entityId || item.id
                        };
                        // Use set to preserve the original log ID
                        await auditService.set(log.id, data as any);
                        current++;
                        setProgress(Math.round((current / total) * 100));
                    }
                    // Clear history from item (legacy field cleanup)
                    await stockService.update(item.id, { history: [] } as any);
                }
            }

            // Migrate Machine Logs
            for (const machine of machines) {
                const machineHistory = (machine as any).history as AuditLog[] | undefined;
                if (machineHistory && machineHistory.length > 0) {
                    for (const log of machineHistory) {
                        const { id, ...logData } = log;
                        const data = {
                            ...logData,
                            timestamp: new Date(log.timestamp),
                            entityType: log.entityType || 'Machine',
                            entityId: log.entityId || machine.id
                        };
                        await auditService.set(log.id, data as any);
                        current++;
                        setProgress(Math.round((current / total) * 100));
                    }
                    // Clear history from machine (legacy field cleanup)
                    await machineService.update(machine.id, { history: [] } as any);
                }
            }

            setStatus("Migration Complete!");
        } catch (error) {
            console.error(error);
            setStatus("Error: " + (error as any).message);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Migration Tool: Embedded History to Global Collection</h1>
            <p className="mb-4">This tool will move all <code>history</code> arrays from Stock Items and Machines to the global <code>auditLogs</code> collection.</p>
            <div className="mb-4 font-mono bg-muted p-4 rounded">
                Status: {status} {progress > 0 && `(${progress}%)`}
            </div>
            <Button onClick={runMigration} disabled={status.includes("Starting") || status.includes("Fetching")}>Start Migration</Button>
        </div>
    );
}
