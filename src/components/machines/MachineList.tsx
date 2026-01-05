"use client";

import { useEffect, useState } from "react";
import { machineService, apiService } from "@/services";
import { ArcadeMachine, ArcadeMachineSlot, MachineDisplayItem } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Edit, Trash2, RefreshCw, Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils/date";
import { format } from "date-fns";
import { AddMachineDialog } from "./AddMachineDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";


export function MachineList() {
    const [items, setItems] = useState<MachineDisplayItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<MachineDisplayItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<MachineDisplayItem | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        let unsubscribeMachines: (() => void) | undefined;

        // Subscribe to real-time machine updates
        if (typeof (machineService as any).subscribe === 'function') {
            unsubscribeMachines = (machineService as any).subscribe((data: ArcadeMachine[]) => {
                const flattenedData = flattenMachinesToSlots(data);
                setItems(flattenedData);
                setLoading(false);
            });
        }

        // Initial load
        loadItems();

        return () => {
            if (unsubscribeMachines) unsubscribeMachines();
        };
    }, []);

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
                // Fallback for machines with no slots (shouldn't happen based on data, but good for safety)
                flattened.push({
                    ...machine,
                    isSlot: false,
                    originalMachine: machine
                });
            }
        });

        return flattened;
    };

    const loadItems = async () => {
        setLoading(true);
        try {
            const data = await machineService.getAll();
            const flattenedData = flattenMachinesToSlots(data);
            setItems(flattenedData);
        } catch (error) {
            console.error("Failed to load machines:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            // Sync for the last 30 days by default
            const endDate = format(new Date(), "yyyy-MM-dd");
            const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
            await apiService.syncMachines(startDate, endDate);
            await loadItems();
        } catch (error) {
            console.error("Sync failed:", error);
        } finally {
            setSyncing(false);
        }
    };

    const handleAdd = () => {
        setItemToEdit(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (item: MachineDisplayItem) => {
        setItemToEdit(item);
        setIsDialogOpen(true);
    };

    const handleSuccess = () => {
        loadItems();
    };

    const handleDeleteClick = (item: MachineDisplayItem) => {
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete) {
            try {
                // Soft delete - archive instead of remove
                await machineService.update(itemToDelete.originalMachine.id, {
                    isArchived: true,
                    archivedAt: new Date(),
                    archivedBy: 'user'
                });
                toast.success("Machine Archived", { description: `${itemToDelete.name} has been archived.` });
                loadItems();
            } catch (error) {
                console.error("Failed to archive machine:", error);
                toast.error("Failed to archive machine");
            }
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const handleRestore = async (item: MachineDisplayItem) => {
        try {
            await machineService.update(item.originalMachine.id, {
                isArchived: false,
                archivedAt: undefined,
                archivedBy: undefined
            });
            toast.success("Machine Restored", { description: `${item.name} has been restored.` });
            loadItems();
        } catch (error) {
            console.error("Failed to restore machine:", error);
            toast.error("Failed to restore machine");
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArchive = showArchived || !item.originalMachine.isArchived;
        return matchesSearch && matchesArchive;
    });

    const getStatusColor = (status: string) => {
        // Handle both machine status (Capitalized) and slot status (lowercase)
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'online': return "default"; // Greenish usually
            case 'offline': return "secondary"; // Yellowish
            case 'error': return "destructive"; // Red
            case 'maintenance': return "outline";
            default: return "secondary";
        }
    };

    if (loading) {
        return <div>Loading machines...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, tag, or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSync} disabled={syncing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                        {syncing ? "Syncing..." : "Sync Data"}
                    </Button>
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Machine
                    </Button>
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
                    {items.filter(i => i.originalMachine.isArchived).length > 0 && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            {items.filter(i => i.originalMachine.isArchived).length}
                        </span>
                    )}
                </label>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Asset Tag</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Plays</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Last Synced</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    No machines found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item) => (
                                <TableRow key={item.slotId || item.id}>
                                    <TableCell className="font-medium">{item.assetTag}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.name}
                                            {item.originalMachine.isArchived && (
                                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-xs">
                                                    <Archive className="h-3 w-3 mr-1" />
                                                    Archived
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.location}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(item.slotStatus || item.status) as any}>
                                            {/* Display slot status if available, otherwise machine status */}
                                            {item.slotStatus ? (item.slotStatus.charAt(0).toUpperCase() + item.slotStatus.slice(1)) : item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.playCount?.toLocaleString() || "-"}</TableCell>
                                    <TableCell>{item.revenue ? `$${item.revenue.toFixed(2)}` : "-"}</TableCell>
                                    <TableCell>
                                        {formatDate(item.lastSyncedAt, "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <TooltipProvider delayDuration={300}>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top"><p>Edit</p></TooltipContent>
                                                </Tooltip>
                                                {item.originalMachine.isArchived ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={(e) => { e.stopPropagation(); handleRestore(item); }}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top"><p>Restore</p></TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top"><p>Archive</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AddMachineDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                machineToEdit={itemToEdit?.originalMachine || null}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Archive Machine"
                description={`Are you sure you want to archive "${itemToDelete?.name}"? Archived machines are hidden from the main list but can be restored later.`}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}
