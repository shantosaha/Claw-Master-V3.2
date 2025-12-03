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
import { Search, Plus, MoreHorizontal, Edit, Trash2, RefreshCw } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/date";
import { format } from "date-fns";
import { MachineDialog } from "./MachineDialog";
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

    useEffect(() => {
        loadItems();
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
                // Always delete the parent machine
                await machineService.remove(itemToDelete.originalMachine.id);
                loadItems();
            } catch (error) {
                console.error("Failed to delete machine:", error);
            }
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                    <TableCell>{item.name}</TableCell>
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => handleDeleteClick(item)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Machine
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <MachineDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                itemToEdit={itemToEdit}
                onSuccess={handleSuccess}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Machine"
                description={`Are you sure you want to delete "${itemToDelete?.name}"? This will delete the entire machine and all its slots. This action cannot be undone.`}
                onConfirm={handleConfirmDelete}
                destructive
            />
        </div>
    );
}
