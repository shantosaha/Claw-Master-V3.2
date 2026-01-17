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
import { StockAssignmentHistory } from "@/components/machines/StockAssignmentHistory";
import { SnapshotHistory } from "@/components/common/SnapshotHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MachineComparisonTable } from "@/components/machines/MachineComparisonTable";
import { ServiceReportForm } from "@/components/machines/ServiceReportForm";
import { ServiceHistoryTable } from "@/components/machines/ServiceHistoryTable";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { isCraneMachine, GROUP_CATEGORIES, CLAW_MACHINE_GROUP, MACHINE_GROUPS, GROUP_SUBGROUPS } from "@/utils/machineTypeUtils";

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
    { label: "Ground", value: "Ground" },
    { label: "Basement", value: "Basement" },
    { label: "Level-1", value: "Level-1" },
];

export default function MachineDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, hasPermission } = useAuth();
    const id = params.id as string;
    const slotId = searchParams.get('slotId');

    // POC: Custom Permission Check
    const canEditMachineName = hasPermission("edit_machine_name") || hasPermission("editMachines");

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
            // Since each machine now has only one slot, just find items by machine assignment status
            const assignedItem = machineItems.find(item =>
                item.assignedStatus === 'Assigned'
            );

            // Find Upcoming Queue - replacement items for this machine
            const replacementItems = machineItems.filter(item =>
                item.assignedStatus === 'Assigned for Replacement'
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

    // Calculate assigned stock based on context items
    // Since each machine has only one slot, just filter by machine ID
    const assignedStock = machine ? items.filter(item => {
        const isAssignedToMachine = item.assignedMachineId === machine.id;
        if (isAssignedToMachine) return true;

        // Otherwise show all items for the machine (by name match)
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

            // Note: History is now handled globally via logAction below

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
    const displayTitle = currentSlot && currentSlot.name !== "Main" ? `${enrichedMachine.name} - ${currentSlot.name}` : enrichedMachine.name;
    const displayStatus = currentSlot ? currentSlot.status : enrichedMachine.status;
    const isCrane = isCraneMachine(enrichedMachine);

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
                        <div className="flex items-center flex-wrap gap-2 text-muted-foreground mt-1">
                            <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded-sm border border-border/50 select-all" title="Machine ID">
                                ID: {enrichedMachine.id}
                            </span>
                            <span>•</span>
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


            <Tabs defaultValue={searchParams.get("tab") || "overview"} className="w-full">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="comparison">Comparison Analytics</TabsTrigger>
                    {isCraneMachine(enrichedMachine) && (
                        <TabsTrigger value="service">Service Reports</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="overview" className="mt-6">
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
                                        disabled={!isEditMode || !canEditMachineName}
                                        onSave={(val) => handleFieldUpdate("name", "Machine Name", val, enrichedMachine.name)}
                                    />
                                    <InlineEditField
                                        type="text"
                                        label="Asset Tag"
                                        value={enrichedMachine.assetTag}
                                        disabled={!isEditMode}
                                        onSave={(val) => handleFieldUpdate("assetTag", "Asset Tag", val, enrichedMachine.assetTag)}
                                    />
                                    <div className="flex flex-col gap-1.5 p-2 rounded-md bg-muted/30 border border-transparent">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Machine ID</span>
                                        <span className="text-sm font-mono break-all select-all">{enrichedMachine.id}</span>
                                    </div>
                                    <InlineEditField
                                        type="text"
                                        label="API Tag"
                                        value={enrichedMachine.tag || ""}
                                        disabled={!isEditMode}
                                        onSave={(val) => handleFieldUpdate("tag", "API Tag", val, enrichedMachine.tag)}
                                    />
                                    <InlineEditField
                                        type="text"
                                        label="Store Location"
                                        value={enrichedMachine.storeLocation || ""}
                                        disabled={!isEditMode}
                                        onSave={(val) => handleFieldUpdate("storeLocation", "Store Location", val, enrichedMachine.storeLocation)}
                                    />
                                    <div className="flex flex-col gap-1.5 p-2 rounded-md bg-purple-50/50 border border-purple-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">MAC ID</span>
                                        <span className="text-sm font-mono break-all">{enrichedMachine.advancedSettings?.macId || "Not assigned"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5 p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Card Play Price</span>
                                        <span className="text-sm font-semibold">${
                                            (enrichedMachine.advancedSettings?.cardCashPlayPrice && !isNaN(enrichedMachine.advancedSettings.cardCashPlayPrice))
                                                ? enrichedMachine.advancedSettings.cardCashPlayPrice.toFixed(2)
                                                : "1.80"
                                        }</span>
                                    </div>
                                    <InlineEditField
                                        type="select"
                                        label="Location"
                                        value={enrichedMachine.location}
                                        disabled={!isEditMode}
                                        options={[
                                            ...LOCATION_OPTIONS,
                                            // Add current location if not in options
                                            ...(enrichedMachine.location && !LOCATION_OPTIONS.some(o => o.value === enrichedMachine.location)
                                                ? [{ label: enrichedMachine.location, value: enrichedMachine.location }]
                                                : []),
                                            { label: "Custom...", value: "__custom__" }
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
                                    {/* Machine Type (Category) - Only for Crane Machines */}
                                    {isCraneMachine(enrichedMachine) && (
                                        <InlineEditField
                                            type="select"
                                            label="Machine Type"
                                            value={enrichedMachine.category || "__none__"}
                                            disabled={!isEditMode}
                                            options={[
                                                { label: "Not Set", value: "__none__" },
                                                ...(GROUP_CATEGORIES[CLAW_MACHINE_GROUP]?.map(cat => ({ label: cat, value: cat })) || []),
                                                // Include current value if it's custom
                                                ...(enrichedMachine.category &&
                                                    !GROUP_CATEGORIES[CLAW_MACHINE_GROUP]?.includes(enrichedMachine.category) &&
                                                    enrichedMachine.category !== "Custom"
                                                    ? [{ label: enrichedMachine.category, value: enrichedMachine.category }]
                                                    : []),
                                                { label: "Custom...", value: "__custom__" }
                                            ]}
                                            onSave={(val) => handleFieldUpdate("category", "Machine Type", val === "__none__" ? "" : val, enrichedMachine.category)}
                                        />
                                    )}
                                    {/* Physical Config - Only for Crane Machines */}
                                    {isCraneMachine(enrichedMachine) && (
                                        <InlineEditField
                                            type="select"
                                            label="Physical Config"
                                            value={enrichedMachine.physicalConfig}
                                            disabled={!isEditMode}
                                            options={PHYSICAL_CONFIG_OPTIONS}
                                            onSave={(val) => handleFieldUpdate("physicalConfig", "Physical Config", val, enrichedMachine.physicalConfig)}
                                        />
                                    )}
                                    {/* Prize Size - Only for Crane Machines */}
                                    {isCraneMachine(enrichedMachine) && (
                                        <InlineEditField
                                            type="select"
                                            label="Prize Size"
                                            value={enrichedMachine.prizeSize || "__none__"}
                                            disabled={!isEditMode}
                                            options={[{ label: "Not Set", value: "__none__" }, ...PRIZE_SIZE_OPTIONS]}
                                            onSave={(val) => handleFieldUpdate("prizeSize", "Prize Size", val === "__none__" ? "" : val, enrichedMachine.prizeSize)}
                                        />
                                    )}
                                    <InlineEditField
                                        type="select"
                                        label="Group"
                                        value={enrichedMachine.group || "__none__"}
                                        disabled={!isEditMode}
                                        options={[
                                            { label: "Not Set", value: "__none__" },
                                            ...MACHINE_GROUPS.map(g => ({ label: g.replace("Group ", "").replace("-", " - "), value: g })),
                                            // Include current value if it's custom
                                            ...(enrichedMachine.group &&
                                                !MACHINE_GROUPS.includes(enrichedMachine.group as any)
                                                ? [{ label: enrichedMachine.group, value: enrichedMachine.group }]
                                                : []),
                                            { label: "Custom...", value: "__custom__" }
                                        ]}
                                        onSave={(val) => handleFieldUpdate("group", "Group", val === "__none__" ? "" : val, enrichedMachine.group)}
                                    />
                                    <InlineEditField
                                        type="select"
                                        label="Sub-Group"
                                        value={enrichedMachine.subGroup || "__none__"}
                                        disabled={!isEditMode}
                                        options={[
                                            { label: "Not Set", value: "__none__" },
                                            ...(enrichedMachine.group && GROUP_SUBGROUPS[enrichedMachine.group]
                                                ? GROUP_SUBGROUPS[enrichedMachine.group].map(sg => ({ label: sg, value: sg }))
                                                : []),
                                            // Include current value if it's custom
                                            ...(enrichedMachine.subGroup &&
                                                enrichedMachine.group &&
                                                GROUP_SUBGROUPS[enrichedMachine.group] &&
                                                !GROUP_SUBGROUPS[enrichedMachine.group].includes(enrichedMachine.subGroup)
                                                ? [{ label: enrichedMachine.subGroup, value: enrichedMachine.subGroup }]
                                                : []),
                                            { label: "Custom...", value: "__custom__" }
                                        ]}
                                        onSave={(val) => handleFieldUpdate("subGroup", "Sub-Group", val === "__none__" ? "" : val, enrichedMachine.subGroup)}
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
                                        value={typeof enrichedMachine.playCount === 'number' && !isNaN(enrichedMachine.playCount) ? enrichedMachine.playCount : 0}
                                        disabled={!isEditMode}
                                        onSave={(val) => handleFieldUpdate("playCount", "Play Count", val, enrichedMachine.playCount)}
                                    />
                                    <InlineEditField
                                        type="number"
                                        label="Revenue"
                                        value={typeof enrichedMachine.revenue === 'number' && !isNaN(enrichedMachine.revenue) ? enrichedMachine.revenue : 0}
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

                            {/* Stock Details - Only for Crane Machines */}
                            {isCrane && (
                                <div className="rounded-lg border p-4">
                                    <StockDetailsPanel
                                        machine={enrichedMachine}
                                        slotId={slotId || undefined}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Right Column - Settings, History, Image */}
                        <div className="space-y-6">
                            {/* Machine Image */}
                            <div className="rounded-lg border p-4">
                                <h2 className="text-lg font-semibold mb-4">Machine Image</h2>
                                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                                    {enrichedMachine.imageUrl ? (
                                        <img
                                            src={getThumbnailUrl(enrichedMachine.imageUrl, 400)}
                                            alt={enrichedMachine.name}
                                            loading="lazy"
                                            decoding="async"
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


                            {/* Stock Assignment History - Only for Crane Machines */}
                            {isCrane && (
                                <div className="rounded-lg border p-4">
                                    <StockAssignmentHistory
                                        machine={enrichedMachine}
                                        logs={activityLogs}
                                    />
                                </div>
                            )}

                            {/* Version History */}
                            <SnapshotHistory
                                entity={enrichedMachine}
                                entityType="machine"
                                userId={user?.uid}
                            />

                            {/* History & Logs */}
                            <div className="rounded-lg border p-4">
                                <h2 className="text-lg font-semibold mb-4">History & Activity Log</h2>
                                <HistoryList history={activityLogs} />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Settings Tab - Available for all machines */}
                <TabsContent value="settings" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <SettingsPanel
                                machineId={enrichedMachine.id}
                                machineName={enrichedMachine.name}
                                assetTag={enrichedMachine.assetTag}
                                activeStockItem={assignedStock.find(i => i.assignedStatus === 'Assigned') || assignedStock[0] || null}
                                supervisorOverride={supervisorOverride}
                                isCraneMachine={isCrane}
                            />
                        </div>
                        <div className="space-y-6">
                            <div className="rounded-lg border p-4">
                                <h2 className="text-lg font-semibold mb-2">Configuration Guide</h2>
                                <p className="text-sm text-muted-foreground">
                                    {isCrane
                                        ? "Adjust claw strength stages (C1-C4) and payout rates to optimize machine performance. Settings are automatically synced to the active stock item."
                                        : "Configure advanced machine settings including pricing and identification."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>



                <TabsContent value="comparison" className="mt-6">
                    <MachineComparisonTable machines={[enrichedMachine as any]} initialMachineId={enrichedMachine.id} />
                </TabsContent>

                {isCraneMachine(enrichedMachine) && (
                    <TabsContent value="service" className="mt-6">
                        <Tabs defaultValue="history" className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="history">History</TabsTrigger>
                                    <TabsTrigger value="new">New Report</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="history">
                                <ServiceHistoryTable machineId={enrichedMachine.id} assetTag={enrichedMachine.tag} />
                            </TabsContent>

                            <TabsContent value="new">
                                <ServiceReportForm machine={enrichedMachine} />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                )}
            </Tabs>
        </div >
    );
}
