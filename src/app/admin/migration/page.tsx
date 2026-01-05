"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    stockService,
    machineService,
    auditService,
    assignmentHistoryService,
    itemMachineSettingsService
} from "@/services";
import { AuditLog, StockItem, MachineAssignment, ItemAssignmentHistory, ItemMachineSettings } from "@/types";
import { Loader2, CheckCircle2, AlertCircle, Play, Database } from "lucide-react";

export default function MigrationPage() {
    const [status, setStatus] = useState("Ready");
    const [progress, setProgress] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // New migration state
    const [dryRun, setDryRun] = useState(true);
    const [migrationLog, setMigrationLog] = useState<string[]>([]);
    const [stats, setStats] = useState({
        itemsProcessed: 0,
        assignmentsMigrated: 0,
        historyCreated: 0,
        settingsCreated: 0,
        skipped: 0
    });

    const addLog = (message: string) => {
        setMigrationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // =========================================================================
    // Legacy Migration: Embedded History to Global Collection
    // =========================================================================
    const runLegacyMigration = async () => {
        setStatus("Fetching items and machines...");
        setIsRunning(true);
        try {
            const items = await stockService.getAll();
            const machines = await machineService.getAll();

            let total = 0;
            let current = 0;

            const itemLogs = items.flatMap(i => (i as any).history || []);
            const machineLogs = machines.flatMap(m => (m as any).history || []);
            total = itemLogs.length + machineLogs.length;

            setStatus(`Found ${total} logs to migrate. Starting...`);

            if (total === 0) {
                setStatus("No history logs found to migrate.");
                setIsRunning(false);
                return;
            }

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
                        await auditService.set(log.id, data as any);
                        current++;
                        setProgress(Math.round((current / total) * 100));
                    }
                    await stockService.update(item.id, { history: [] } as any);
                }
            }

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
                    await machineService.update(machine.id, { history: [] } as any);
                }
            }

            setStatus("Legacy Migration Complete!");
        } catch (error) {
            console.error(error);
            setStatus("Error: " + (error as any).message);
        } finally {
            setIsRunning(false);
        }
    };

    // =========================================================================
    // NEW: Data Architecture Migration
    // =========================================================================
    const runDataArchitectureMigration = async () => {
        setIsRunning(true);
        setMigrationLog([]);
        setStats({ itemsProcessed: 0, assignmentsMigrated: 0, historyCreated: 0, settingsCreated: 0, skipped: 0 });

        addLog(`Starting migration in ${dryRun ? 'DRY RUN' : 'LIVE'} mode...`);

        try {
            // Fetch all data
            addLog("Fetching stock items...");
            const items = await stockService.getAll();
            addLog(`Found ${items.length} items`);

            let newStats = { ...stats };

            for (const item of items) {
                addLog(`Processing: ${item.name} (${item.sku})`);
                newStats.itemsProcessed++;

                // Step 1: Migrate to machineAssignments array
                if (!item.machineAssignments || item.machineAssignments.length === 0) {
                    const assignments: MachineAssignment[] = [];

                    // Migrate primary assignment
                    if (item.assignedMachineId && item.assignedMachineName) {
                        assignments.push({
                            machineId: item.assignedMachineId,
                            machineName: item.assignedMachineName,
                            status: item.assignmentType || (item.assignedStatus === 'Assigned for Replacement' ? 'Replacement' : 'Using'),
                            queuePosition: 1,
                            assignedAt: item.updatedAt || new Date().toISOString(),
                        });
                    }

                    // Migrate replacement machines
                    if (item.replacementMachines && item.replacementMachines.length > 0) {
                        let position = 2;
                        for (const rm of item.replacementMachines) {
                            if (!assignments.some(a => a.machineId === rm.id)) {
                                assignments.push({
                                    machineId: rm.id,
                                    machineName: rm.name,
                                    status: 'Replacement',
                                    queuePosition: position++,
                                    assignedAt: item.updatedAt || new Date().toISOString(),
                                });
                            }
                        }
                    }

                    if (assignments.length > 0) {
                        addLog(`  → Migrating ${assignments.length} assignments`);
                        if (!dryRun) {
                            await stockService.update(item.id, { machineAssignments: assignments });
                        }
                        newStats.assignmentsMigrated += assignments.length;

                        // Step 2: Create assignment history records
                        for (const assignment of assignments) {
                            const historyRecord: Omit<ItemAssignmentHistory, 'id'> = {
                                itemId: item.id,
                                itemName: item.name,
                                machineId: assignment.machineId,
                                machineName: assignment.machineName,
                                slotId: assignment.slotId,
                                assignedAt: assignment.assignedAt,
                                status: assignment.status,
                                queuePosition: assignment.queuePosition || 1,
                                assignedBy: 'migration',
                            };

                            if (!dryRun) {
                                await assignmentHistoryService.add(historyRecord as ItemAssignmentHistory);
                            }
                            addLog(`  → Created history: ${item.name} → ${assignment.machineName}`);
                            newStats.historyCreated++;
                        }

                        // Step 3: Create default claw settings
                        const existingSettings = await itemMachineSettingsService.getAll();

                        for (const assignment of assignments) {
                            const hasSettings = existingSettings.some(
                                s => s.itemId === item.id && s.machineId === assignment.machineId
                            );

                            if (!hasSettings) {
                                const defaultSettings: Omit<ItemMachineSettings, 'id'> = {
                                    itemId: item.id,
                                    itemName: item.name,
                                    machineId: assignment.machineId,
                                    machineName: assignment.machineName,
                                    c1: 20,
                                    c2: 15,
                                    c3: 10,
                                    c4: 24,
                                    playPrice: 1.80,
                                    playPerWin: 10,
                                    expectedRevenue: 18.0,
                                    lastUpdatedBy: 'migration',
                                    lastUpdatedAt: new Date().toISOString(),
                                    createdAt: new Date().toISOString(),
                                };

                                if (!dryRun) {
                                    await itemMachineSettingsService.add(defaultSettings as ItemMachineSettings);
                                }
                                addLog(`  → Created claw settings: ${item.name} → ${assignment.machineName}`);
                                newStats.settingsCreated++;
                            }
                        }
                    } else {
                        addLog(`  → No assignments to migrate`);
                        newStats.skipped++;
                    }
                } else {
                    addLog(`  → Already has machineAssignments, skipping`);
                    newStats.skipped++;
                }

                setStats({ ...newStats });
            }

            addLog("========================================");
            addLog("Migration Summary:");
            addLog(`  Items processed: ${newStats.itemsProcessed}`);
            addLog(`  Assignments migrated: ${newStats.assignmentsMigrated}`);
            addLog(`  History records created: ${newStats.historyCreated}`);
            addLog(`  Claw settings created: ${newStats.settingsCreated}`);
            addLog(`  Skipped: ${newStats.skipped}`);
            addLog("========================================");

            if (dryRun) {
                addLog("⚠️ DRY RUN - No changes were made");
            } else {
                addLog("✅ Migration complete!");
            }

        } catch (error) {
            console.error(error);
            addLog(`❌ Error: ${(error as any).message}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Migration Tools</h1>

            {/* Legacy Migration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Legacy: Embedded History Migration
                    </CardTitle>
                    <CardDescription>
                        Move history arrays from Stock Items and Machines to global auditLogs collection
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="font-mono bg-muted p-4 rounded text-sm">
                        Status: {status} {progress > 0 && `(${progress}%)`}
                    </div>
                    <Button onClick={runLegacyMigration} disabled={isRunning}>
                        {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Start Legacy Migration
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            {/* New Data Architecture Migration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        NEW: Data Architecture Migration
                    </CardTitle>
                    <CardDescription>
                        Migrate to new schema: machineAssignments[], assignment history, and claw settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Dry Run Toggle */}
                    <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <Switch
                            id="dryRun"
                            checked={dryRun}
                            onCheckedChange={setDryRun}
                        />
                        <div>
                            <Label htmlFor="dryRun" className="font-medium">Dry Run Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                {dryRun ? "Preview changes without modifying data" : "⚠️ LIVE MODE - Changes will be saved!"}
                            </p>
                        </div>
                        <Badge variant={dryRun ? "secondary" : "destructive"} className="ml-auto">
                            {dryRun ? "Safe" : "Live"}
                        </Badge>
                    </div>

                    {/* Stats */}
                    {stats.itemsProcessed > 0 && (
                        <div className="grid grid-cols-5 gap-2 text-center">
                            <div className="bg-muted rounded p-2">
                                <div className="text-lg font-bold">{stats.itemsProcessed}</div>
                                <div className="text-xs text-muted-foreground">Processed</div>
                            </div>
                            <div className="bg-muted rounded p-2">
                                <div className="text-lg font-bold">{stats.assignmentsMigrated}</div>
                                <div className="text-xs text-muted-foreground">Assignments</div>
                            </div>
                            <div className="bg-muted rounded p-2">
                                <div className="text-lg font-bold">{stats.historyCreated}</div>
                                <div className="text-xs text-muted-foreground">History</div>
                            </div>
                            <div className="bg-muted rounded p-2">
                                <div className="text-lg font-bold">{stats.settingsCreated}</div>
                                <div className="text-xs text-muted-foreground">Settings</div>
                            </div>
                            <div className="bg-muted rounded p-2">
                                <div className="text-lg font-bold">{stats.skipped}</div>
                                <div className="text-xs text-muted-foreground">Skipped</div>
                            </div>
                        </div>
                    )}

                    {/* Log Output */}
                    {migrationLog.length > 0 && (
                        <div className="font-mono bg-black text-green-400 p-4 rounded text-xs max-h-64 overflow-y-auto">
                            {migrationLog.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}
                        </div>
                    )}

                    <Button onClick={runDataArchitectureMigration} disabled={isRunning}>
                        {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        {dryRun ? "Preview Migration" : "Run Migration"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
