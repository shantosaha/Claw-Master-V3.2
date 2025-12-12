"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { machineService, auditService } from "@/services";
import { ArcadeMachine, AuditLog, UpcomingStockItem } from "@/types";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { Button } from "@/components/ui/button";
import { where, orderBy, limit } from "firebase/firestore";

import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SettingsPanel } from "@/components/machines/SettingsPanel";
import { HistoryList } from "@/components/machines/HistoryList";
import { InlineEditField } from "@/components/machines/InlineEditField";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StockDetailsPanel } from "@/components/machines/StockDetailsPanel";

// Constants for select field options
const STATUS_OPTIONS = [
    { label: "Online", value: "Online" },
    { label: "Offline", value: "Offline" },
    { label: "Maintenance", value: "Maintenance" },
    { label: "Error", value: "Error" },
];

const PHYSICAL_CONFIG_OPTIONS = [
    { label: "Single", value: "single" },
    { label: "4-Slot Multi", value: "multi_4_slot" },
    { label: "Dual Module", value: "dual_module" },
    { label: "Dual Stack", value: "multi_dual_stack" },
];

const PRIZE_SIZE_OPTIONS = [
    { label: "Extra-Small", value: "Extra-Small" },
    { label: "Small", value: "Small" },
    { label: "Medium", value: "Medium" },
    { label: "Large", value: "Large" },
    { label: "Big", value: "Big" },
];

const LOCATION_OPTIONS = [
    { label: "Arcade Floor", value: "Arcade Floor" },
    { label: "Storage", value: "Storage" },
    { label: "Warehouse", value: "Warehouse" },
    { label: "Repair Shop", value: "Repair Shop" },
];

export default function MachineDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const id = params.id as string;
    const slotId = searchParams.get('slotId');

    // Use global data context
    const { machines, items, machinesLoading, itemsLoading, refreshMachines } = useData();
    const loading = machinesLoading || itemsLoading;

    // Derive state from context
    const machine = machines.find(m => m.id === id) || null;

    // Enriched Machine Logic (Memoized to prevent render loops if object identity changes)
    const enrichedMachine = useMemo(() => {
        if (!machine) return null;

        const machineItems = items.filter(item => item.assignedMachineId === machine.id);

        const enrichedSlots = machine.slots.map(slot => {
            // 1. Find Active Item
            // Strategy 1: Exact Slot ID Match
            let assignedItem = machineItems.find(item =>
                item.assignedSlotId === slot.id && item.assignedStatus === 'Assigned'
            );

            // Strategy 2: Fallback - if no item found, check for items with no slot ID
            // Logic: If there is an item assigned to the machine but with no slot ID, assume it's for this slot 
            // if it's the only slot or the first slot.
            if (!assignedItem) {
                assignedItem = machineItems.find(item =>
                    !item.assignedSlotId && item.assignedStatus === 'Assigned'
                );
            }

            // 2. Find Upcoming Queue
            const replacementItems = machineItems.filter(item =>
                item.assignedStatus === 'Assigned for Replacement' &&
                (item.assignedSlotId === slot.id || (!item.assignedSlotId && slot.id === machine.slots[0].id))
            );

            const upcomingQueue: UpcomingStockItem[] = replacementItems.map(item => ({
                itemId: item.id,
                name: item.name,
                sku: item.sku || '',
                imageUrl: item.imageUrl,
                addedBy: 'system', // TODO: Fetch info if available
                addedAt: new Date(item.updatedAt || new Date())
            }));

            return {
                ...slot,
                currentItem: assignedItem || null,
                upcomingQueue: upcomingQueue
            };
        });

        return { ...machine, slots: enrichedSlots };
    }, [machine, items]);

    // Calculate assigned stock based on context items (for legacy reasons or specific sidebar list)
    // We can just use the machineItems logic again or rely on enrichedMachine
    const assignedStock = machine ? items.filter(item => {
        const isAssignedToMachine = item.assignedMachineId === machine.id;

        if (isAssignedToMachine) {
            // If viewing a specific slot, allow match if slot ID is exact OR if item has no slot ID
            if (slotId) {
                return item.assignedSlotId === slotId || !item.assignedSlotId;
            }
            return true;
        }

        // Otherwise show all items for the machine (by name match or assignedMachineId)
        return item.locations?.some(loc => loc.name && machine.name && loc.name.toLowerCase().includes(machine.name.toLowerCase()));
    }) : [];

    const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
    const [supervisorOverride, setSupervisorOverride] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Fetch activity logs when machine is available
    useEffect(() => {
        if (enrichedMachine) {
            fetchActivityLogs();
        }
    }, [enrichedMachine?.id, enrichedMachine?.name]);

    const fetchActivityLogs = async () => {
        if (!enrichedMachine) return;

        try {
            // 1. Logs where this machine is the entity
            const machineLogs = await auditService.query(
                where("entityId", "==", enrichedMachine.id),
                orderBy("timestamp", "desc"),
                limit(50)
            );

            // 2. Logs where this machine is referenced in details (e.g. stock assignment)
            const stockLogsById = await auditService.query(
                where("details.machineId", "==", enrichedMachine.id),
                orderBy("timestamp", "desc"),
                limit(50)
            );

            // 3. Legacy: Logs by machine name (for older records)
            const stockLogsByName = await auditService.query(
                where("details.machine", "==", enrichedMachine.name),
                orderBy("timestamp", "desc"),
                limit(50)
            );

            // Merge and deduplicate
            const allLogs = [...machineLogs, ...stockLogsById, ...stockLogsByName];
            const uniqueLogs = Array.from(new Map(allLogs.map(log => [log.id, log])).values());

            // Sort combined logs
            uniqueLogs.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            setActivityLogs(uniqueLogs);
        } catch (error) {
            console.error("Failed to fetch activity logs:", error);
            // Fallback to embedded history if fetch fails
            if (enrichedMachine.history) {
                setActivityLogs(enrichedMachine.history);
            }
        }
    };

    // Create a history log entry for the machine
    const createHistoryLog = useCallback((action: string, details: Record<string, unknown>): AuditLog => ({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        entityType: "machine",
        entityId: enrichedMachine?.id || "",
        userId: user?.uid || "system",
        userRole: (user as any)?.role || "system",
        timestamp: new Date(),
        details
    }), [enrichedMachine?.id, user?.uid]);

    // Handle inline field updates with activity logging
    const handleFieldUpdate = async (
        fieldName: string,
        fieldLabel: string,
        newValue: string,
        oldValue: unknown
    ) => {
        if (!enrichedMachine || !user) return;

        try {
            // Create update object with proper typing
            const updateData: Partial<ArcadeMachine> = {};

            // Handle nested fields and type conversions
            switch (fieldName) {
                case "name":
                case "assetTag":
                case "location":
                case "type":
                case "prizeSize":
                case "notes":
                case "tag":
                case "group":
                case "subGroup":
                    (updateData as any)[fieldName] = newValue;
                    break;
                case "status":
                    updateData.status = newValue as ArcadeMachine["status"];
                    break;
                case "physicalConfig":
                    updateData.physicalConfig = newValue as ArcadeMachine["physicalConfig"];
                    break;
                case "playCount":
                case "revenue":
                    (updateData as any)[fieldName] = Number(newValue) || 0;
                    break;
                default:
                    (updateData as any)[fieldName] = newValue;
            }

            // Add updated timestamp
            updateData.updatedAt = new Date();

            // Create history log entry
            const historyLog = createHistoryLog("FIELD_UPDATE", {
                field: fieldLabel,
                fieldName,
                oldValue: oldValue ?? "Not set",
                newValue: newValue || "Not set",
                message: `Changed ${fieldLabel} from "${oldValue ?? 'Not set'}" to "${newValue || 'Not set'}"`
            });

            // Update machine's embedded history
            const updatedHistory = [...(enrichedMachine.history || []), historyLog];
            updateData.history = updatedHistory;

            // Update the machine
            await machineService.update(enrichedMachine.id, updateData);

            // Also log to the global audit service
            await logAction(
                user.uid,
                "update",
                "machine",
                enrichedMachine.id,
                {
                    field: fieldLabel,
                    fieldName,
                    oldValue: oldValue ?? "Not set",
                    newValue: newValue || "Not set"
                },
                { [fieldName]: oldValue },
                { [fieldName]: newValue }
            );

            toast.success(`Updated ${fieldLabel}`, {
                description: `Changed from "${oldValue ?? 'Not set'}" to "${newValue || 'Not set'}"`
            });

            // Reload machines to get fresh data
            await refreshMachines();
        } catch (error) {
            console.error(`Failed to update ${fieldName}:`, error);
            toast.error(`Failed to update ${fieldLabel}`);
        }
    };

    if (loading) return <div>Loading details...</div>;
    if (!enrichedMachine) return <div>Machine not found</div>;

    const currentSlot = slotId ? enrichedMachine.slots.find(s => s.id === slotId) : null;
    const displayTitle = currentSlot ? `${enrichedMachine.name} - ${currentSlot.name}` : enrichedMachine.name;
    const displayStatus = currentSlot ? currentSlot.status : enrichedMachine.status;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{displayTitle}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">
                                {enrichedMachine.assetTag}
                            </Badge>
                            <span>•</span>
                            <span className="font-medium text-foreground">{enrichedMachine.type || "Unknown Type"}</span>
                            <span>•</span>
                            <span>{enrichedMachine.location}</span>
                            <span>•</span>
                            <Badge variant={
                                (String(displayStatus).toLowerCase() === 'online') ? 'default' :
                                    (String(displayStatus).toLowerCase() === 'maintenance') ? 'secondary' :
                                        'destructive'
                            }>
                                {String(displayStatus).toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <Switch
                            id="edit-mode"
                            checked={isEditMode}
                            onCheckedChange={setIsEditMode}
                        />
                        <Label htmlFor="edit-mode">{isEditMode ? 'Edit Mode' : 'View Mode'}</Label>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                        <Switch
                            id="supervisor-mode"
                            checked={supervisorOverride}
                            onCheckedChange={setSupervisorOverride}
                        />
                        <Label htmlFor="supervisor-mode">Supervisor Override</Label>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Machine Details (Editable) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Machine Information</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <InlineEditField
                                type="text"
                                label="Machine Name"
                                value={enrichedMachine.name}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("name", "Machine Name", val, enrichedMachine.name)}
                            />
                            <InlineEditField
                                type="text"
                                label="Asset Tag"
                                value={enrichedMachine.assetTag}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("assetTag", "Asset Tag", val, enrichedMachine.assetTag)}
                            />
                            <InlineEditField
                                type="text"
                                label="API Tag"
                                value={enrichedMachine.tag || ""}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("tag", "API Tag", val, enrichedMachine.tag)}
                            />
                            <InlineEditField
                                type="select"
                                label="Location"
                                value={enrichedMachine.location}
                                disabled={!isEditMode}
                                options={[
                                    ...LOCATION_OPTIONS,
                                    // Add current location if not in options
                                    ...(LOCATION_OPTIONS.some(o => o.value === enrichedMachine.location)
                                        ? []
                                        : [{ label: enrichedMachine.location, value: enrichedMachine.location }])
                                ]}
                                onSave={(val) => handleFieldUpdate("location", "Location", val, enrichedMachine.location)}
                            />
                            <InlineEditField
                                type="select"
                                label="Status"
                                value={enrichedMachine.status}
                                disabled={!isEditMode}
                                options={STATUS_OPTIONS}
                                onSave={(val) => handleFieldUpdate("status", "Status", val, enrichedMachine.status)}
                            />
                            <InlineEditField
                                type="text"
                                label="Machine Type"
                                value={enrichedMachine.type || ""}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("type", "Machine Type", val, enrichedMachine.type)}
                            />
                            <InlineEditField
                                type="select"
                                label="Physical Config"
                                value={enrichedMachine.physicalConfig}
                                disabled={!isEditMode}
                                options={PHYSICAL_CONFIG_OPTIONS}
                                onSave={(val) => handleFieldUpdate("physicalConfig", "Physical Config", val, enrichedMachine.physicalConfig)}
                            />
                            <InlineEditField
                                type="select"
                                label="Prize Size"
                                value={enrichedMachine.prizeSize || ""}
                                disabled={!isEditMode}
                                options={[{ label: "Not Set", value: "" }, ...PRIZE_SIZE_OPTIONS]}
                                onSave={(val) => handleFieldUpdate("prizeSize", "Prize Size", val, enrichedMachine.prizeSize)}
                            />
                            <InlineEditField
                                type="text"
                                label="Group"
                                value={enrichedMachine.group || ""}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("group", "Group", val, enrichedMachine.group)}
                            />
                            <InlineEditField
                                type="text"
                                label="Sub-Group"
                                value={enrichedMachine.subGroup || ""}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("subGroup", "Sub-Group", val, enrichedMachine.subGroup)}
                            />
                        </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Performance & Stats</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <InlineEditField
                                type="number"
                                label="Play Count"
                                value={enrichedMachine.playCount ?? 0}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("playCount", "Play Count", val, enrichedMachine.playCount)}
                            />
                            <InlineEditField
                                type="number"
                                label="Revenue"
                                value={enrichedMachine.revenue ?? 0}
                                disabled={!isEditMode}
                                onSave={(val) => handleFieldUpdate("revenue", "Revenue", val, enrichedMachine.revenue)}
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Last Synced</span>
                                <span className="text-sm text-foreground">
                                    {enrichedMachine.lastSyncedAt
                                        ? new Date(enrichedMachine.lastSyncedAt).toLocaleString()
                                        : "Never"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Created At</span>
                                <span className="text-sm text-foreground">
                                    {enrichedMachine.createdAt
                                        ? new Date(enrichedMachine.createdAt).toLocaleString()
                                        : "-"}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Updated At</span>
                                <span className="text-sm text-foreground">
                                    {enrichedMachine.updatedAt
                                        ? new Date(enrichedMachine.updatedAt).toLocaleString()
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Notes</h2>
                        <InlineEditField
                            type="textarea"
                            label="Machine Notes"
                            value={enrichedMachine.notes || ""}
                            disabled={!isEditMode}
                            onSave={(val) => handleFieldUpdate("notes", "Notes", val, enrichedMachine.notes)}
                            className="w-full"
                        />
                    </div>

                    {/* Stock Details */}
                    <div className="rounded-lg border p-4">
                        <StockDetailsPanel
                            machine={enrichedMachine}
                            slotId={slotId || undefined}
                        />
                    </div>
                </div>

                {/* Right Column - Settings, History, Image */}
                <div className="space-y-6">
                    {/* Machine Image */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Machine Image</h2>
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                            {enrichedMachine.imageUrl ? (
                                <img
                                    src={enrichedMachine.imageUrl}
                                    alt={enrichedMachine.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Camera className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm">
                                    <ImagePlus className="h-4 w-4 mr-2" />
                                    {enrichedMachine.imageUrl ? "Change Image" : "Add Image"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Playfield Settings */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">Playfield Settings</h2>
                        <SettingsPanel
                            machineId={enrichedMachine.id}
                            activeStockItem={assignedStock.find(i => i.assignedStatus === 'Assigned') || assignedStock[0] || null}
                        />
                    </div>

                    {/* History & Logs */}
                    <div className="rounded-lg border p-4">
                        <h2 className="text-lg font-semibold mb-4">History & Activity Log</h2>
                        <HistoryList history={activityLogs} />
                    </div>
                </div>
            </div>
        </div>
    );
}
