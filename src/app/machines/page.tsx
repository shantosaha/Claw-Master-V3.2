"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { machineService, apiService, auditService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, MachineDisplayItem, StockItem, AuditLog } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { generateId } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, RefreshCw, Search, Archive } from "lucide-react";
import { format } from "date-fns";
import { MachineCard } from "@/components/machines/MachineCard";
import { MachineTable } from "@/components/machines/MachineTable";
import { MachinePricingTable } from "@/components/machines/MachinePricingTable";
import { ViewSwitcher, ViewMode } from "@/components/machines/ViewSwitcher";
import { AddMachineDialog } from "@/components/machines/AddMachineDialog";
import { ManageStockModal } from "@/components/machines/ManageStockModal";
import { StockLevelChangeDialog } from "@/components/machines/StockLevelChangeDialog";
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
    prizeSizeFilter: string;
    stockLevelFilter: string;
    assignmentFilter: string;
    categoryFilter: string;
    subCategoryFilter: string;
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
            prizeSizeFilter: 'all',
            stockLevelFilter: 'all',
            assignmentFilter: 'all',
            categoryFilter: 'all',
            subCategoryFilter: 'all',
        },
        persistScroll: true,
        isReady: !loading,
        scrollSelector: '#main-content'
    });

    // Destructure for easier access
    const { viewMode, searchTerm, statusFilter, typeFilter, locationFilter, prizeSizeFilter, stockLevelFilter, assignmentFilter, categoryFilter, subCategoryFilter } = pageState;

    // State update helpers
    const setViewMode = (value: ViewMode) => updateState('viewMode', value);
    const setSearchTerm = (value: string) => updateState('searchTerm', value);
    const setStatusFilter = (value: string) => updateState('statusFilter', value);
    const setTypeFilter = (value: string) => updateState('typeFilter', value);
    const setLocationFilter = (value: string) => updateState('locationFilter', value);
    const setPrizeSizeFilter = (value: string) => updateState('prizeSizeFilter', value);
    const setStockLevelFilter = (value: string) => updateState('stockLevelFilter', value);
    const setAssignmentFilter = (value: string) => updateState('assignmentFilter', value);
    const setCategoryFilter = (value: string) => {
        updateState('categoryFilter', value);
        // Reset sub-category when category changes
        updateState('subCategoryFilter', 'all');
    };
    const setSubCategoryFilter = (value: string) => updateState('subCategoryFilter', value);

    // Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [machineToDelete, setMachineToDelete] = useState<MachineDisplayItem | null>(null);
    const [machineToEdit, setMachineToEdit] = useState<MachineDisplayItem | null>(null);
    const [assignTarget, setAssignTarget] = useState<{ machine: ArcadeMachine, slotId?: string } | null>(null);

    // Stock Level Change Dialog State
    const [stockLevelDialogOpen, setStockLevelDialogOpen] = useState(false);
    const [pendingStockItem, setPendingStockItem] = useState<StockItem | null>(null);
    const [pendingStockLevel, setPendingStockLevel] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    const handleSync = useCallback(async () => {
        setSyncing(true);
        try {
            const endDate = format(new Date(), "yyyy-MM-dd");
            const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            await apiService.syncMachines(startDate, endDate);
            await Promise.all([refreshMachines(), refreshItems()]);
            lastSyncRef.current = Date.now();
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setSyncing(false);
        }
    }, [refreshMachines, refreshItems]);

    // Track last sync time to avoid over-polling
    const lastSyncRef = useRef<number>(0);
    const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

    // Auto-sync on page load
    useEffect(() => {
        // Only sync if we haven't synced recently (within 5 minutes)
        const timeSinceLastSync = Date.now() - lastSyncRef.current;
        if (timeSinceLastSync >= SYNC_INTERVAL_MS) {
            handleSync();
        }
    }, []); // Run once on mount

    // Auto-sync every 5 minutes while page is open
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Only sync if not already syncing
            if (!syncing) {
                handleSync();
            }
        }, SYNC_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [syncing, handleSync]);

    // Sync when tab becomes visible (after being hidden)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeSinceLastSync = Date.now() - lastSyncRef.current;
                // Only sync if more than 5 minutes since last sync
                if (timeSinceLastSync >= SYNC_INTERVAL_MS && !syncing) {
                    handleSync();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [syncing, handleSync]);

    const handleDelete = async () => {
        if (!machineToDelete) return;
        try {
            // Prioritize Archive over Delete Slot unless explicitly needed for multi-slot machines
            // For now, based on user feedback, we default to Archive Machine behavior

            // Create log entry
            const logEntry: AuditLog = {
                id: generateId(),
                action: "ARCHIVE_MACHINE",
                entityType: "Machine",
                entityId: machineToDelete.originalMachine.id,
                userId: "user",
                userRole: "user",
                timestamp: new Date(),
                details: {
                    name: machineToDelete.name,
                    assetTag: machineToDelete.assetTag
                }
            };

            // Log archive action to global history
            await auditService.add(logEntry);

            // Archive the machine instead of delete, and append to history
            await machineService.update(machineToDelete.originalMachine.id, {
                isArchived: true,
                archivedAt: new Date(),
                archivedBy: 'user',
            });
            toast.success("Machine archived", { description: "You can restore it from the archived list." });

            refreshMachines();
        } catch (error) {
            console.error("Failed to archive:", error);
            toast.error("Failed to archive");
        } finally {
            setIsDeleteDialogOpen(false);
            setMachineToDelete(null);
        }
    };

    const handleRestore = async (machine: MachineDisplayItem) => {
        try {
            // Create log entry
            const logEntry: AuditLog = {
                id: generateId(),
                action: "RESTORE_MACHINE",
                entityType: "Machine",
                entityId: machine.originalMachine.id,
                userId: "user",
                userRole: "user",
                timestamp: new Date(),
                details: {
                    name: machine.name,
                    assetTag: machine.assetTag
                }
            };

            // Log restore action to global history
            await auditService.add(logEntry);

            await machineService.update(machine.originalMachine.id, {
                isArchived: false,
                archivedAt: undefined,
                archivedBy: undefined,
            });
            toast.success("Machine restored");
            refreshMachines();
        } catch (error) {
            console.error("Failed to restore:", error);
            toast.error("Failed to restore");
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

    const handleStockLevelChange = (item: StockItem, newLevel: string) => {
        setPendingStockItem(item);
        setPendingStockLevel(newLevel);
        setStockLevelDialogOpen(true);
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
            const logEntry: AuditLog = {
                id: generateId(),
                action: "STATUS_CHANGE",
                entityType: "Machine",
                entityId: machine.originalMachine.id,
                userId: "user",
                userRole: "user",
                timestamp: new Date(),
                details: {
                    machineName: machine.name,
                    slotId: machine.slotId, // Optional if specific slot
                    oldStatus: machine.isSlot ? machine.slotStatus : machine.status,
                    newStatus: status
                }
            };

            // Log to global history
            await auditService.add(logEntry);

            if (machine.isSlot && machine.slotId) {
                const originalMachine = machine.originalMachine;
                const updatedSlots = originalMachine.slots.map(slot => {
                    if (slot.id === machine.slotId) {
                        return { ...slot, status: status as ArcadeMachineSlot['status'] };
                    }
                    return slot;
                });

                await machineService.update(originalMachine.id, {
                    slots: updatedSlots,
                });
            } else {
                await machineService.update(machine.id, {
                    status: status as ArcadeMachine['status'],
                });
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
                    const assignedItem = slot.currentItem;

                    // Calculate Stock Level
                    let derivedStockLevel: ArcadeMachineSlot['stockLevel'] = 'Out of Stock';
                    if (assignedItem) {
                        const locationsSum = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0);
                        const totalQty = locationsSum !== undefined ? locationsSum : (assignedItem.totalQuantity ?? 0);
                        derivedStockLevel = calculateStockLevel(totalQty, assignedItem.stockStatus).status as ArcadeMachineSlot['stockLevel'];
                    } else if (slot.stockLevel) {
                        derivedStockLevel = slot.stockLevel; // Use value from slot if no item, or 'Out of Stock'
                    }

                    // Use queue directly from slot
                    const upcomingQueue = slot.upcomingQueue || [];

                    // Create a slot object with the currentItem populated
                    const enrichedSlot = {
                        ...slot,
                        currentItem: assignedItem,
                        upcomingQueue: upcomingQueue,
                        stockLevel: derivedStockLevel
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
                    item.assignedStatus === 'Assigned'
                );

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
                    const locationsSum = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0);
                    const totalQty = locationsSum !== undefined ? locationsSum : (assignedItem.totalQuantity ?? 0);
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
    const uniqueTypes = Array.from(new Set(machines.map(m => m.type).filter(type => type && type.trim() !== "")));
    // Sort categories: Group 1-11 numerically, then others alphabetically, "Not Assigned" last
    const uniqueCategories = Array.from(new Set(machines.map(m => m.group).filter(g => g && g.trim() !== ""))).sort((a, b) => {
        // Extract group numbers for comparison
        const matchA = a?.match(/Group\s+(\d+)/);
        const matchB = b?.match(/Group\s+(\d+)/);
        const numA = matchA ? parseInt(matchA[1]) : Infinity;
        const numB = matchB ? parseInt(matchB[1]) : Infinity;

        // "Not Assigned" or similar should go last
        if (a?.toLowerCase().includes('not assigned')) return 1;
        if (b?.toLowerCase().includes('not assigned')) return -1;

        // Compare by group number
        if (numA !== numB) return numA - numB;

        // Fallback to alphabetical
        return (a || '').localeCompare(b || '');
    });
    // Sub-categories are filtered based on selected category
    const uniqueSubCategories = Array.from(new Set(
        machines
            .filter(m => categoryFilter === 'all' || m.group === categoryFilter)
            .map(m => m.subGroup)
            .filter(sg => sg && sg.trim() !== "")
    )).sort();
    const uniqueLocations = Array.from(new Set(machines.map(m => m.location).filter(loc => loc && loc.trim() !== "")));

    // Normalize prize sizes to eliminate duplicates (e.g., "Extra Small" vs "Extra-Small" vs "extra small")
    const normalizePrizeSize = (size: string): string => {
        return size.trim().toLowerCase().replace(/-/g, ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };
    const uniquePrizeSizes = Array.from(new Set(
        machines.map(m => m.prizeSize).filter(size => size && size.trim() !== "").map(size => normalizePrizeSize(size as string))
    ));

    // Helper to get machine's stock level from its slots
    const getMachineStockLevel = (machine: ArcadeMachine): string | null => {
        if (machine.slots?.length > 0) {
            // Find first slot with an item to determine level, or aggregate
            const slotWithItem = machine.slots.find(s => s.currentItem);
            if (slotWithItem && slotWithItem.currentItem) {
                const item = slotWithItem.currentItem;
                const locationsSum = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0);
                const totalQty = locationsSum !== undefined ? locationsSum : (item.totalQuantity ?? 0);
                return calculateStockLevel(totalQty, item.stockStatus).status;
            }
        }
        return null;
    };

    // Helper to check if machine has stock assigned
    // Helper to check if machine has stock assigned
    const machineHasAssignment = (machine: ArcadeMachine): boolean => {
        return machine.slots?.some(s => !!s.currentItem) || false;
    };

    const filteredMachines = machines.filter(machine => {
        const matchesSearch =
            machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            machine.assetTag.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || machine.status === statusFilter;
        const matchesType = typeFilter === "all" || machine.type === typeFilter;
        const matchesLocation = locationFilter === "all" || machine.location === locationFilter;
        const matchesPrizeSize = prizeSizeFilter === "all" || (machine.prizeSize && normalizePrizeSize(machine.prizeSize) === prizeSizeFilter);
        const matchesCategory = categoryFilter === "all" || machine.group === categoryFilter;
        const matchesSubCategory = subCategoryFilter === "all" || machine.subGroup === subCategoryFilter;

        // Stock level filter
        let matchesStockLevel = true;
        if (stockLevelFilter !== "all") {
            const machineStockLevel = getMachineStockLevel(machine);
            matchesStockLevel = machineStockLevel === stockLevelFilter;
        }

        // Assignment filter
        let matchesAssignment = true;
        if (assignmentFilter === "assigned") {
            matchesAssignment = machineHasAssignment(machine);
        } else if (assignmentFilter === "unassigned") {
            matchesAssignment = !machineHasAssignment(machine);
        }
        // Archive filter
        const matchesArchive = showArchived || !machine.isArchived;

        return matchesSearch && matchesStatus && matchesType && matchesLocation && matchesPrizeSize && matchesStockLevel && matchesAssignment && matchesArchive && matchesCategory && matchesSubCategory;
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
                    {/* Sync indicator - replaces manual button */}
                    {syncing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Syncing...</span>
                        </div>
                    )}
                    <Button onClick={() => {
                        setIsAddDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Machine
                    </Button>
                </div>
            </div>

            {/* Mobile-friendly filter layout */}
            <div className="space-y-3 p-3 bg-muted/20 rounded-md">
                {/* Row 1: Search (full width on mobile) */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search machines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>

                {/* Row 2: Filters (grid on mobile, flex on larger screens) */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[110px]">
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

                    {/* Location Filter */}
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[100px]">
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {uniqueLocations.map(loc => (
                                <SelectItem key={loc} value={loc as string}>{loc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Assignment Filter */}
                    <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[100px]">
                            <SelectValue placeholder="Assigned" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Category (Group) Filter */}
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[130px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {uniqueCategories.map(cat => (
                                <SelectItem key={cat} value={cat as string}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sub Category Filter */}
                    <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-auto sm:min-w-[120px]">
                            <SelectValue placeholder="Sub Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sub Categories</SelectItem>
                            {uniqueSubCategories.map(sub => (
                                <SelectItem key={sub} value={sub as string}>{sub}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Type Filter - Only for Group 4-Cranes (after Sub Category) */}
                    {categoryFilter === 'Group 4-Cranes' && (
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-auto sm:min-w-[100px]">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                {uniqueTypes.map(type => (
                                    <SelectItem key={type} value={type as string}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Prize Size Filter - Only for Group 4-Cranes */}
                    {categoryFilter === 'Group 4-Cranes' && (
                        <Select value={prizeSizeFilter} onValueChange={setPrizeSizeFilter}>
                            <SelectTrigger className="w-full sm:w-auto sm:min-w-[100px]">
                                <SelectValue placeholder="Size" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sizes</SelectItem>
                                {uniquePrizeSizes.map(size => (
                                    <SelectItem key={size} value={size as string}>{size}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Stock Level Filter - Only for Group 4-Cranes */}
                    {categoryFilter === 'Group 4-Cranes' && (
                        <Select value={stockLevelFilter} onValueChange={setStockLevelFilter}>
                            <SelectTrigger className="w-full sm:w-auto sm:min-w-[110px]">
                                <SelectValue placeholder="Stock" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stock</SelectItem>
                                <SelectItem value="In Stock">In Stock</SelectItem>
                                <SelectItem value="Limited Stock">Limited</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Row 3: View Style + Reset (always visible) */}
                <div className="flex items-center justify-between gap-2">
                    {/* Reset Button */}
                    {(statusFilter !== "all" || typeFilter !== "all" || locationFilter !== "all" || prizeSizeFilter !== "all" || stockLevelFilter !== "all" || assignmentFilter !== "all" || categoryFilter !== "all" || subCategoryFilter !== "all" || searchTerm) ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                updateMultiple({
                                    statusFilter: "all",
                                    typeFilter: "all",
                                    locationFilter: "all",
                                    prizeSizeFilter: "all",
                                    stockLevelFilter: "all",
                                    assignmentFilter: "all",
                                    categoryFilter: "all",
                                    subCategoryFilter: "all",
                                    searchTerm: ""
                                });
                            }}
                        >
                            <span className="hidden sm:inline">Reset</span>
                            <span className="sm:hidden">×</span>
                        </Button>
                    ) : (
                        <div /> // Spacer when no active filters
                    )}

                    {/* View Switcher */}
                    <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
                </div>
            </div>

            {/* Show Archived Toggle */}
            <div className="flex items-center gap-2 mb-4 px-1">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                        type="checkbox"
                        checked={showArchived}
                        onChange={(e) => setShowArchived(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <Archive className="h-4 w-4" />
                    Show Archived Machines
                    {machines.filter(m => m.isArchived).length > 0 && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            {machines.filter(m => m.isArchived).length}
                        </span>
                    )}
                </label>
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
                    onAssignStock={handleAssignStock}
                    onStockLevelChange={handleStockLevelChange}
                    onRestore={handleRestore}
                />
            ) : viewMode === 'pricing' ? (
                <MachinePricingTable machines={flattenedFilteredMachines} />
            ) : (
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {/* For card view, we need to inject the items into the machines similar to flattened view logic but preserving machine structure */}
                    {filteredMachines.map(machine => {
                        // Enrich machine slots with items for the card view
                        const enrichedSlots = machine.slots.map(slot => {
                            const assignedItem = slot.currentItem;

                            // Calculate Stock Level for Card View
                            let derivedStockLevel: ArcadeMachineSlot['stockLevel'] = 'Out of Stock';
                            if (assignedItem) {
                                const locationsSum = assignedItem.locations?.reduce((sum, loc) => sum + loc.quantity, 0);
                                const totalQty = locationsSum !== undefined ? locationsSum : (assignedItem.totalQuantity ?? 0);
                                derivedStockLevel = calculateStockLevel(totalQty, assignedItem.stockStatus).status as ArcadeMachineSlot['stockLevel'];
                            } else if (slot.stockLevel) {
                                derivedStockLevel = slot.stockLevel;
                            }

                            const upcomingQueue = slot.upcomingQueue || [];

                            return {
                                ...slot,
                                currentItem: assignedItem,
                                upcomingQueue: upcomingQueue,
                                stockLevel: derivedStockLevel // Update stock level
                            };
                        });
                        const enrichedMachine = { ...machine, slots: enrichedSlots };

                        return (
                            <MachineCard
                                key={machine.id}
                                machine={enrichedMachine}
                                onManageStock={(m) => router.push(`/machines/${m.id}`)}
                                onStatusChange={(m, s) => handleStatusChange(m as any, s)}
                                onEdit={(m) => handleEdit({ ...m, originalMachine: m } as any)}
                                onDelete={(m) => {
                                    setMachineToDelete({ ...m, originalMachine: m } as any);
                                    setIsDeleteDialogOpen(true);
                                }}
                                onAssignStock={handleAssignStock}
                                onStockLevelChange={handleStockLevelChange}
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
            <AddMachineDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                machineToEdit={machineToEdit?.originalMachine || null}
                onSuccess={() => {
                    refreshMachines();
                    toast.success("Machine updated");
                }}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title={machineToDelete?.isSlot && machineToDelete.slotId ? "Archive Slot" : "Archive Machine"}
                description={
                    machineToDelete?.isSlot && machineToDelete.slotId
                        ? `Are you sure you want to archive slot "${machineToDelete.slotName || machineToDelete.name}"? This will hide the slot from active views.`
                        : `Are you sure you want to archive "${machineToDelete?.name}"? This will hide the machine and all its slots from active views.`
                }
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

            {/* Stock Level Change Dialog */}
            <StockLevelChangeDialog
                open={stockLevelDialogOpen}
                onOpenChange={setStockLevelDialogOpen}
                item={pendingStockItem}
                newLevel={pendingStockLevel}
            />
        </div>
    );
}
