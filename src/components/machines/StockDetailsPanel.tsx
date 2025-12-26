"use client";

import { useState } from "react";
import { ArcadeMachine, StockItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManageStockModal } from "./ManageStockModal";
import { Trash2, Package, AlertTriangle } from "lucide-react";
import { machineService, stockService } from "@/services";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import {
    migrateToMachineAssignments,
    removeMachineAssignment,
    syncLegacyFieldsFromAssignments,
    getAssignmentCount,
    getMachineStockItems
} from "@/utils/machineAssignmentUtils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StockDetailsPanelProps {
    machine: ArcadeMachine;
    slotId?: string;
}

export function StockDetailsPanel({ machine, slotId }: StockDetailsPanelProps) {
    const { user } = useAuth();
    const { items, refreshMachines, refreshItems } = useData();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // Confirmation dialog states
    const [confirmClear, setConfirmClear] = useState(false);
    const [confirmRemoveQueue, setConfirmRemoveQueue] = useState<{ index: number; item: any } | null>(null);


    // Identify target slot
    const targetSlot = slotId
        ? machine.slots.find(s => s.id === slotId)
        : (machine.slots.length === 1 ? machine.slots[0] : machine.slots[0]);

    if (!targetSlot) return <div className="p-4 border rounded-md">No slot configuration found.</div>;

    // DERIVE current item and queue from stock data (SOURCE OF TRUTH)
    const { currentItems, queueItems } = getMachineStockItems(machine.id, items);
    const fullCurrentItem = currentItems[0] || null;
    const totalQty = fullCurrentItem?.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0;

    const stockInfo = calculateStockLevel(totalQty, fullCurrentItem?.stockStatus);

    // Check for other machine assignments
    const currentItemAssignments = fullCurrentItem ? migrateToMachineAssignments(fullCurrentItem) : [];
    const otherMachineAssignments = currentItemAssignments.filter(a => a.machineId !== machine.id);
    const otherMachinesCount = otherMachineAssignments.length;

    // Use derived queue from stock data (source of truth)
    const queue = queueItems.map(item => ({
        itemId: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        addedBy: 'system',
        addedAt: new Date()
    }));

    const handleRemoveFromQueue = async (queueIndex: number, queueItem: any) => {
        if (!user) return;
        try {
            // Remove from machine queue array
            const newQueue = [...queue];
            newQueue.splice(queueIndex, 1);

            const updatedSlots = machine.slots.map(s => {
                if (s.id === targetSlot.id) {
                    return { ...s, upcomingQueue: newQueue };
                }
                return s;
            });

            await machineService.update(machine.id, { slots: updatedSlots });

            // Find the full item to update
            const fullQueueItem = items.find(i => i.id === queueItem.itemId);
            if (fullQueueItem) {
                // Remove assignment from machineAssignments array
                const currentAssignments = migrateToMachineAssignments(fullQueueItem);
                const updatedAssignments = removeMachineAssignment(currentAssignments, machine.id);

                // CRITICAL: Explicitly clear ALL assignment fields to prevent 
                // migrateToMachineAssignments from recreating assignments from stale legacy fields
                const itemUpdate: Partial<StockItem> = {
                    machineAssignments: updatedAssignments,
                };

                // If no assignments remain, explicitly clear all legacy fields
                if (updatedAssignments.length === 0) {
                    itemUpdate.assignedMachineId = null;
                    itemUpdate.assignedMachineName = null;
                    itemUpdate.assignedStatus = 'Not Assigned';
                    itemUpdate.replacementMachines = [];
                } else {
                    // Sync legacy fields from remaining assignments
                    Object.assign(itemUpdate, syncLegacyFieldsFromAssignments({
                        ...fullQueueItem,
                        machineAssignments: updatedAssignments
                    }));
                }

                await stockService.update(queueItem.itemId, itemUpdate);
            }

            toast.success("Removed from queue");
            refreshMachines();
            refreshItems();
        } catch (e) {
            console.error(e);
            toast.error("Failed to remove from queue");
        }
    };

    const handleClearCurrent = async () => {
        if (!user || !fullCurrentItem) return;
        try {
            const updatedSlots = machine.slots.map(s => {
                if (s.id === targetSlot.id) {
                    return { ...s, currentItem: null };
                }
                return s;
            });

            await machineService.update(machine.id, { slots: updatedSlots });

            // The item to update is already fullCurrentItem
            if (fullCurrentItem) {
                // Remove assignment from machineAssignments array
                const localCurrentAssignments = migrateToMachineAssignments(fullCurrentItem);
                const updatedAssignments = removeMachineAssignment(localCurrentAssignments, machine.id);

                // CRITICAL: Explicitly clear ALL assignment fields to prevent 
                // migrateToMachineAssignments from recreating assignments from stale legacy fields
                const itemUpdate: Partial<StockItem> = {
                    machineAssignments: updatedAssignments,
                };

                // If no assignments remain, explicitly clear all legacy fields
                if (updatedAssignments.length === 0) {
                    itemUpdate.assignedMachineId = null;
                    itemUpdate.assignedMachineName = null;
                    itemUpdate.assignedStatus = 'Not Assigned';
                    itemUpdate.replacementMachines = [];
                } else {
                    // Sync legacy fields from remaining assignments
                    Object.assign(itemUpdate, syncLegacyFieldsFromAssignments({
                        ...fullCurrentItem,
                        machineAssignments: updatedAssignments
                    }));
                }

                await stockService.update(fullCurrentItem.id, itemUpdate);
            }

            toast.success("Cleared current item");
            refreshMachines();
            refreshItems();
        } catch (e) {
            console.error(e);
            toast.error("Failed to clear current item");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Stock Details</h2>
                    <p className="text-sm text-muted-foreground">Current and upcoming items in this machine.</p>
                </div>
                <Button onClick={() => setIsManageModalOpen(true)} className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm">
                    Manage Stock
                </Button>
            </div>

            {/* Current Item */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Current Item</h3>
                <div className="border rounded-xl p-5 flex items-center justify-between bg-card shadow-sm hover:shadow-md transition-shadow">
                    {fullCurrentItem ? (
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                {fullCurrentItem.imageUrl ? (
                                    <img src={fullCurrentItem.imageUrl} alt={fullCurrentItem.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                                        <Package className="h-8 w-8 opacity-40" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-foreground tracking-tight">{fullCurrentItem.name}</h4>
                                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{fullCurrentItem.id}</div>
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <div className="text-sm text-muted-foreground">Location: {fullCurrentItem.locations?.[0]?.name || "Level 1"}</div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className={`text-xs font-semibold px-2 py-0.5 rounded-md w-fit ${stockInfo.colorClass}`}>
                                            {totalQty} Units • {stockInfo.label}
                                        </div>
                                        {otherMachinesCount > 0 && (
                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                                                +{otherMachinesCount} other machine{otherMachinesCount > 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-5 text-muted-foreground">
                            <div className="h-20 w-20 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-border">
                                <Package className="h-8 w-8 opacity-30" />
                            </div>
                            <div className="text-sm font-medium">No current item assigned</div>
                        </div>
                    )}

                    {fullCurrentItem ? (
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => setConfirmClear(true)}>
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Badge variant="secondary" className="px-3 py-1 text-xs">Empty</Badge>
                    )}
                </div>
            </div>

            {/* Upcoming Stock Queue */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming Stock Queue</h3>
                <div className="space-y-4">
                    {queue.length === 0 ? (
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-10 text-center">
                            <p className="text-muted-foreground mb-4">No upcoming stock assigned.</p>
                            <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary text-secondary-foreground" onClick={() => setIsManageModalOpen(true)}>
                                Assign Upcoming Stock
                            </Button>
                        </div>
                    ) : (
                        queue.map((queueItem, index) => {
                            // Find full item details from context to get Category and Size
                            const fullItem = items.find(i => i.id === queueItem.itemId);

                            return (
                                <div key={index} className="border rounded-xl p-4 flex items-center gap-6 bg-card shadow-sm hover:translate-x-1 transition-all duration-200">
                                    <div className="text-xl font-bold text-muted-foreground/40 w-8 text-center select-none">#{index + 1}</div>

                                    <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                        {queueItem.imageUrl ? (
                                            <img src={queueItem.imageUrl} alt={queueItem.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-secondary/30">IMG</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <div className="font-semibold text-foreground text-lg">{queueItem.name}</div>
                                        <div className="text-[10px] font-mono text-muted-foreground">{queueItem.itemId}</div>
                                        <div className="text-sm text-muted-foreground">Status: <span className="text-foreground/80">Request</span></div>
                                    </div>

                                    <div className="hidden sm:flex flex-col items-center px-4 border-l border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Category</span>
                                        <span className="text-sm font-medium">{fullItem?.category || "-"}</span>
                                    </div>

                                    <div className="hidden sm:flex flex-col items-center px-4 border-l border-border/50">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Size</span>
                                        <span className="text-sm font-medium">{fullItem?.size || "Small"}</span>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full ml-2"
                                        onClick={() => setConfirmRemoveQueue({ index, item: queueItem })}
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <ManageStockModal
                open={isManageModalOpen}
                onOpenChange={setIsManageModalOpen}
                machine={machine}
                slotId={targetSlot.id}
            />

            {/* Clear Current Item Confirmation */}
            <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Remove Current Item
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Are you sure you want to remove <strong>{fullCurrentItem?.name}</strong> from <strong>{machine.name}</strong>?
                                </p>
                                {queue.length > 0 ? (
                                    <p className="text-sm text-blue-600">
                                        The first item in the replacement queue will become available for activation.
                                    </p>
                                ) : (
                                    <p className="text-sm text-amber-600">
                                        ⚠️ This machine has no replacement items queued. It will be empty after removal.
                                    </p>
                                )}
                                {fullCurrentItem && (
                                    <p className="text-xs text-muted-foreground">
                                        Item stock: {totalQty} units ({stockInfo.label})
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleClearCurrent}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Remove Item
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove from Queue Confirmation */}
            <AlertDialog open={!!confirmRemoveQueue} onOpenChange={(open) => !open && setConfirmRemoveQueue(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Remove from Queue
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Are you sure you want to remove <strong>{confirmRemoveQueue?.item?.name}</strong> from the replacement queue?
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    This item will be unassigned from <strong>{machine.name}</strong> and can be assigned elsewhere.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (confirmRemoveQueue) {
                                    handleRemoveFromQueue(confirmRemoveQueue.index, confirmRemoveQueue.item);
                                    setConfirmRemoveQueue(null);
                                }
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Remove from Queue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
