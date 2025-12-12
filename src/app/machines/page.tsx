"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { machineService, apiService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, MachineDisplayItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { MachineCard } from "@/components/machines/MachineCard";
import { MachineTable } from "@/components/machines/MachineTable";
import { ViewSwitcher, ViewMode } from "@/components/machines/ViewSwitcher";
import { AddMachineDialog } from "@/components/machines/AddMachineDialog";
import { MachineDialog } from "@/components/machines/MachineDialog";
import { ManageStockModal } from "@/components/machines/ManageStockModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "sonner";
import { usePageState } from "@/hooks/usePageState";
import { useData } from "@/context/DataProvider";

// Define the state shape for persistence
interface MachinesPageState {
    viewMode: ViewMode;
    searchTerm: string;
    statusFilter: string;
    typeFilter: string;
    locationFilter: string;
}

export default function MachinesPage() {
    const router = useRouter();
    // Use global data context which handles subscriptions
    const { machines, items, machinesLoading, itemsLoading, refreshMachines, refreshItems } = useData();
    const loading = machinesLoading || itemsLoading;
    const [syncing, setSyncing] = useState(false);

    // Persistent page state (view mode, filters, scroll position)
    const { state: pageState, updateState, updateMultiple } = usePageState<MachinesPageState>({
        key: 'machines-page',
        initialState: {
            viewMode: 'list',
            searchTerm: '',
            statusFilter: 'all',
            typeFilter: 'all',
            locationFilter: 'all',
        },
        persistScroll: true,
        isReady: !loading,
        scrollSelector: '#main-content'
    });

    // Destructure for easier access
    const { viewMode, searchTerm, statusFilter, typeFilter, locationFilter } = pageState;

    // State update helpers
    const setViewMode = (value: ViewMode) => updateState('viewMode', value);
    const setSearchTerm = (value: string) => updateState('searchTerm', value);
    const setStatusFilter = (value: string) => updateState('statusFilter', value);
    const setTypeFilter = (value: string) => updateState('typeFilter', value);
    const setLocationFilter = (value: string) => updateState('locationFilter', value);

    // Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [machineToDelete, setMachineToDelete] = useState<MachineDisplayItem | null>(null);
    const [machineToEdit, setMachineToEdit] = useState<MachineDisplayItem | null>(null);
    const [assignTarget, setAssignTarget] = useState<{ machine: ArcadeMachine, slotId?: string } | null>(null);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const endDate = format(new Date(), "yyyy-MM-dd");
            const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            await apiService.syncMachines(startDate, endDate);
            await Promise.all([refreshMachines(), refreshItems()]);
            toast.success("Machines synced successfully");
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (!machineToDelete) return;
        try {
            // Always delete the original machine
            await machineService.remove(machineToDelete.originalMachine.id);
            toast.success("Machine deleted");
            refreshMachines();
        } catch (error) {
            console.error("Failed to delete machine:", error);
            toast.error("Failed to delete machine");
        } finally {
            setIsDeleteDialogOpen(false);
            setMachineToDelete(null);
        }
    };

    const handleEdit = (machine: MachineDisplayItem) => {
        setMachineToEdit(machine);
        setIsEditDialogOpen(true);
    };

    const handleAssignStock = (machine: ArcadeMachine, slotId?: string) => {
        setAssignTarget({ machine, slotId });
        setIsAssignModalOpen(true);
    };

    // Note: This function handles manual stock updates. 
    // Since we now auto-calculate stock levels, this might be redundant or needs to be repurposed.
    // For now we keep it compatible with the previous manual overrides if needed, or disable it.
    const handleStockChange = async (machine: MachineDisplayItem, stockLevel: 'Full' | 'Good' | 'Low' | 'Empty') => {
        try {
            // If editing a specific slot
            if (machine.isSlot && machine.slotId) {
                const originalMachine = machine.originalMachine;
                const updatedSlots = originalMachine.slots.map(slot => {
                    if (slot.id === machine.slotId) {
                        return { ...slot, stockLevel: stockLevel as any };
                    }
                    return slot;
                });
                await machineService.update(originalMachine.id, { slots: updatedSlots });
            } else if (machine.slots.length > 0) {
                // Fallback for machine row - update first slot
                const updatedSlots = [...machine.slots];
                updatedSlots[0] = { ...updatedSlots[0], stockLevel: stockLevel as any };
                await machineService.update(machine.id, { slots: updatedSlots });
            }
            toast.success(`Stock level updated to ${stockLevel}`);
            refreshMachines();
        } catch (error) {
            console.error("Failed to update stock level:", error);
            toast.error("Failed to update stock level");
        }
    };

    const handleStatusChange = async (machine: MachineDisplayItem, status: string) => {
        try {
            if (machine.isSlot && machine.slotId) {
                const originalMachine = machine.originalMachine;
                const updatedSlots = originalMachine.slots.map(slot => {
                    if (slot.id === machine.slotId) {
                        return { ...slot, status: status as ArcadeMachineSlot['status'] };
                    }
                    return slot;
                });
                await machineService.update(originalMachine.id, { slots: updatedSlots });
            } else {
                await machineService.update(machine.id, { status: status as ArcadeMachine['status'] });
            }
            toast.success(`Status updated to ${status}`);
            refreshMachines();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        }
    };

    // Flatten machines for list view and merge with stock items
    const flattenMachinesToSlots = (machines: ArcadeMachine[]): MachineDisplayItem[] => {
        const flattened: MachineDisplayItem[] = [];

        machines.forEach(machine => {
            // Filter all items relevant to this machine
            const machineItems = items.filter(item => item.assignedMachineId === machine.id);

            if (machine.slots && machine.slots.length > 0) {
                // Create an entry for each slot
                machine.slots.forEach(slot => {
                    // 1. Find Active Item
                    // Strategy 1: Exact Slot ID Match (Prioritize "Assigned")
                    let assignedItem = machineItems.find(item =>
                        item.assignedSlotId === slot.id && item.assignedStatus === 'Assigned'
                    );

                    // Strategy 2: Fallback - if no item found, check for items with no slot ID
                    if (!assignedItem) {
                        assignedItem = machineItems.find(item =>
                            !item.assignedSlotId && item.assignedStatus === 'Assigned'
                        );
                    }

                    // Calculate Stock Level
                    let derivedStockLevel: ArcadeMachineSlot['stockLevel'] = 'Out of Stock';
                    if (assignedItem) {
                        const totalQty = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || assignedItem.totalQuantity || 0;
                        derivedStockLevel = calculateStockLevel(totalQty, assignedItem.stockStatus).status as ArcadeMachineSlot['stockLevel'];
                    } else if (slot.stockLevel) {
                        // Fallback to manual level if no item assigned, preserving legacy behavior or defaulting
                        derivedStockLevel = 'Out of Stock';
                    }

                    // 2. Find Upcoming Queue
                    const replacementItems = machineItems.filter(item =>
                        item.assignedStatus === 'Assigned for Replacement' &&
                        (item.assignedSlotId === slot.id || (!item.assignedSlotId && slot.id === machine.slots[0].id))
                    );

                    const upcomingQueue = replacementItems.map(item => ({
                        itemId: item.id,
                        name: item.name,
                        sku: item.sku || '',
                        imageUrl: item.imageUrl,
                        addedBy: 'system', // TODO: Fetch info if available
                        addedAt: new Date(item.updatedAt || new Date())
                    }));

                    // Create a slot object with the currentItem populated
                    const enrichedSlot = {
                        ...slot,
                        currentItem: assignedItem || null,
                        upcomingQueue: upcomingQueue,
                        stockLevel: derivedStockLevel // Use derived level
                    };

                    flattened.push({
                        ...machine,
                        isSlot: true,
                        slotId: slot.id,
                        slotName: slot.name,
                        slotStatus: slot.status,
                        // Append slot name to machine name for display unless it's "Main"
                        name: (slot.name === 'Main' || slot.name === 'main') ? machine.name : `${machine.name} - ${slot.name}`,
                        originalMachine: machine,
                        slots: machine.slots.map(s => s.id === slot.id ? enrichedSlot : s), // Update the specific slot in the array
                    });
                });
            } else {
                // Fallback for machines with no slots
                const assignedItem = machineItems.find(item =>
                    (!item.assignedSlotId && item.assignedStatus === 'Assigned')
                ) || machineItems.find(item => item.assignedStatus === 'Assigned');

                // Find queue for machine-level assignment
                const replacementItems = machineItems.filter(item =>
                    item.assignedStatus === 'Assigned for Replacement'
                );

                const upcomingQueue = replacementItems.map(item => ({
                    itemId: item.id,
                    name: item.name,
                    sku: item.sku || '',
                    imageUrl: item.imageUrl,
                    addedBy: 'system',
                    addedAt: new Date(item.updatedAt || new Date())
                }));

                // Calculate Stock Level (Fallback)
                let derivedStockLevel: ArcadeMachineSlot['stockLevel'] = 'Out of Stock';
                if (assignedItem) {
                    const totalQty = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || assignedItem.totalQuantity || 0;
                    derivedStockLevel = calculateStockLevel(totalQty, assignedItem.stockStatus).status as ArcadeMachineSlot['stockLevel'];
                }

                flattened.push({
                    ...machine,
                    isSlot: false,
                    originalMachine: machine,
                    slots: assignedItem ? [{
                        id: 'default',
                        name: 'Default',
                        gameType: machine.type || 'Unknown',
                        status: machine.status === 'Online' ? 'online' : 'offline',
                        currentItem: assignedItem,
                        upcomingQueue: upcomingQueue,
                        stockLevel: derivedStockLevel
                    }] : machine.slots // Copy existing (empty) slots
                });
            }
        });

        return flattened;
    };

    // Get unique values for filters
    const uniqueTypes = Array.from(new Set(machines.map(m => m.type).filter(Boolean)));
    const uniqueLocations = Array.from(new Set(machines.map(m => m.location).filter(Boolean)));

    const filteredMachines = machines.filter(machine => {
        const matchesSearch =
            machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.assetTag.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || machine.status === statusFilter;
        const matchesType = typeFilter === "all" || machine.type === typeFilter;
        const matchesLocation = locationFilter === "all" || machine.location === locationFilter;

        return matchesSearch && matchesStatus && matchesType && matchesLocation;
    });

    const flattenedFilteredMachines = flattenMachinesToSlots(filteredMachines);

    if (loading) return <div className="p-8 text-center flex flex-col items-center justify-center h-64"><RefreshCw className="h-8 w-8 animate-spin mb-4" />Loading machines and inventory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Machines</h1>
                    <p className="text-muted-foreground">
                        Manage your arcade fleet, monitor status, and track inventory.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Syncing..." : "Sync Data"}
                    </Button>
                    <Button onClick={() => {
                        setIsAddDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Machine
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or asset tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Offline">Offline</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Error">Error</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {uniqueTypes.map(type => (
                                <SelectItem key={type} value={type as string}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {uniqueLocations.map(loc => (
                                <SelectItem key={loc} value={loc as string}>{loc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {(statusFilter !== "all" || typeFilter !== "all" || locationFilter !== "all" || searchTerm) && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                updateMultiple({
                                    statusFilter: "all",
                                    typeFilter: "all",
                                    locationFilter: "all",
                                    searchTerm: ""
                                });
                            }}
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            {viewMode === 'list' ? (
                <MachineTable
                    machines={flattenedFilteredMachines}
                    onEdit={handleEdit}
                    onDelete={(m) => {
                        setMachineToDelete(m);
                        setIsDeleteDialogOpen(true);
                    }}
                    onStatusUpdate={handleStatusChange}
                    onStockUpdate={handleStockChange}
                    onAssignStock={handleAssignStock}
                />
            ) : (
                <div className={`grid gap-6 ${viewMode === 'compact' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {/* For card view, we need to inject the items into the machines similar to flattened view logic but preserving machine structure */}
                    {filteredMachines.map(machine => {
                        // Enrich machine slots with items for the card view
                        const enrichedSlots = machine.slots.map(slot => {
                            const machineItems = items.filter(item => item.assignedMachineId === machine.id);

                            // Find assigned item with relaxed logic
                            let assignedItem = machineItems.find(item =>
                                item.assignedSlotId === slot.id &&
                                item.assignedStatus === 'Assigned'
                            );

                            // Fallback
                            if (!assignedItem) {
                                assignedItem = machineItems.find(item =>
                                    !item.assignedSlotId &&
                                    item.assignedStatus === 'Assigned'
                                );
                            }

                            // Calculate Stock Level for Card View
                            let derivedStockLevel: ArcadeMachineSlot['stockLevel'] = 'Out of Stock';
                            if (assignedItem) {
                                const totalQty = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || assignedItem.totalQuantity || 0;
                                derivedStockLevel = calculateStockLevel(totalQty, assignedItem.stockStatus).status as ArcadeMachineSlot['stockLevel'];
                            }

                            // Find Upcoming Queue
                            const replacementItems = machineItems.filter(item =>
                                item.assignedStatus === 'Assigned for Replacement' &&
                                (item.assignedSlotId === slot.id || (!item.assignedSlotId && slot.id === machine.slots[0].id))
                            );

                            const upcomingQueue = replacementItems.map(item => ({
                                itemId: item.id,
                                name: item.name,
                                sku: item.sku || '',
                                imageUrl: item.imageUrl,
                                addedBy: 'system',
                                addedAt: new Date(item.updatedAt || new Date())
                            }));

                            return {
                                ...slot,
                                currentItem: assignedItem || null,
                                upcomingQueue: upcomingQueue,
                                stockLevel: derivedStockLevel // Update stock level
                            };
                        });
                        const enrichedMachine = { ...machine, slots: enrichedSlots };

                        return (
                            <MachineCard
                                key={machine.id}
                                machine={enrichedMachine} // Pass enriched machine
                                onManageStock={(m) => router.push(`/machines/${m.id}`)}
                                onStatusChange={(m, s) => handleStatusChange(m as any, s)}
                            />
                        );
                    })}
                </div>
            )}

            {/* Dialog for Adding new machines */}
            <AddMachineDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                    refreshMachines();
                    toast.success("Machine created");
                }}
            />

            {/* Dialog for Editing existing machines/slots */}
            <MachineDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                itemToEdit={machineToEdit}
                onSuccess={() => {
                    refreshMachines();
                    toast.success("Machine updated");
                }}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Machine"
                description={`Are you sure you want to delete "${machineToDelete?.name}"? This will delete the entire machine and all its slots.`}
                onConfirm={handleDelete}
                destructive
            />

            {/* Manage Stock Modal for Quick Assignment */}
            {assignTarget && (
                <ManageStockModal
                    open={isAssignModalOpen}
                    onOpenChange={setIsAssignModalOpen}
                    machine={assignTarget.machine}
                    slotId={assignTarget.slotId}
                />
            )}
        </div>
    );
}
