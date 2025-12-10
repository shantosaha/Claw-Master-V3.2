"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { machineService, apiService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, MachineDisplayItem } from "@/types";
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
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "sonner";

export default function MachinesPage() {
    const router = useRouter();
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [locationFilter, setLocationFilter] = useState<string>("all");

    // Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [machineToDelete, setMachineToDelete] = useState<MachineDisplayItem | null>(null);
    const [machineToEdit, setMachineToEdit] = useState<MachineDisplayItem | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        // Type for service with optional subscribe method
        type ServiceWithSubscribe<T> = {
            subscribe?: (callback: (data: T[]) => void) => () => void;
        };
        const machineSvc = machineService as unknown as ServiceWithSubscribe<ArcadeMachine>;

        // Subscribe to real-time machine updates
        if (typeof machineSvc.subscribe === 'function') {
            unsubscribe = machineSvc.subscribe((data: ArcadeMachine[]) => {
                setMachines(data);
                setLoading(false);
            });
        }

        // Initial load (for services without subscription support)
        loadMachines();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const loadMachines = async () => {
        setLoading(true);
        try {
            const data = await machineService.getAll();
            setMachines(data);
        } catch (error) {
            console.error("Failed to load machines:", error);
            toast.error("Failed to load machines");
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const endDate = format(new Date(), "yyyy-MM-dd");
            const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            await apiService.syncMachines(startDate, endDate);
            await loadMachines();
            toast.success("Machines synced successfully");
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Sync failed");
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
            loadMachines();
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

    const handleStockChange = async (machine: MachineDisplayItem, stockLevel: 'Full' | 'Good' | 'Low' | 'Empty') => {
        try {
            // If editing a specific slot
            if (machine.isSlot && machine.slotId) {
                const originalMachine = machine.originalMachine;
                const updatedSlots = originalMachine.slots.map(slot => {
                    if (slot.id === machine.slotId) {
                        return { ...slot, stockLevel };
                    }
                    return slot;
                });
                await machineService.update(originalMachine.id, { slots: updatedSlots });
            } else if (machine.slots.length > 0) {
                // Fallback for machine row - update first slot
                const updatedSlots = [...machine.slots];
                updatedSlots[0] = { ...updatedSlots[0], stockLevel };
                await machineService.update(machine.id, { slots: updatedSlots });
            }
            toast.success(`Stock level updated to ${stockLevel}`);
            loadMachines();
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
            loadMachines();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        }
    };

    // Flatten machines for list view
    const flattenMachinesToSlots = (machines: ArcadeMachine[]): MachineDisplayItem[] => {
        const flattened: MachineDisplayItem[] = [];

        machines.forEach(machine => {
            if (machine.slots && machine.slots.length > 0) {
                // Create an entry for each slot
                machine.slots.forEach(slot => {
                    flattened.push({
                        ...machine,
                        isSlot: true,
                        slotId: slot.id,
                        slotName: slot.name,
                        slotStatus: slot.status,
                        // Append slot name to machine name for display
                        name: `${machine.name} - ${slot.name}`,
                        originalMachine: machine
                    });
                });
            } else {
                // Fallback for machines with no slots
                flattened.push({
                    ...machine,
                    isSlot: false,
                    originalMachine: machine
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

    if (loading) return <div className="p-8 text-center">Loading machines...</div>;

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
                                setStatusFilter("all");
                                setTypeFilter("all");
                                setLocationFilter("all");
                                setSearchTerm("");
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
                />
            ) : (
                <div className={`grid gap-6 ${viewMode === 'compact' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {filteredMachines.map(machine => (
                        <MachineCard
                            key={machine.id}
                            machine={machine}
                            onManageStock={(m) => router.push(`/machines/${m.id}`)}
                            onStatusChange={(m, s) => handleStatusChange(m as any, s)}
                        />
                    ))}
                </div>
            )}

            {/* Dialog for Adding new machines */}
            <AddMachineDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSuccess={() => {
                    loadMachines();
                    toast.success("Machine created");
                }}
            />

            {/* Dialog for Editing existing machines/slots */}
            <MachineDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                itemToEdit={machineToEdit}
                onSuccess={() => {
                    loadMachines();
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
        </div>
    );
}
