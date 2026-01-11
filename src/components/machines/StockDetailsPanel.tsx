"use client";

import { useState, useEffect } from "react";
import { ArcadeMachine, StockItem, ItemMachineSettings } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManageStockModal } from "./ManageStockModal";
import { Trash2, Package, AlertTriangle, Settings2 } from "lucide-react";
import { machineService, stockService, itemMachineSettingsService } from "@/services";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { promoteFirstQueueItem } from "@/utils/promoteQueueItem";
import Link from "next/link";
import { StockItemDetailsDialog } from "../inventory/StockItemDetailsDialog";
import { ClawSettingsDialog } from "../inventory/ClawSettingsDialog";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
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
    const [clawSettings, setClawSettings] = useState<ItemMachineSettings | null>(null);

    // Confirmation dialog states
    const [confirmClear, setConfirmClear] = useState(false);
    const [confirmRemoveQueue, setConfirmRemoveQueue] = useState<{ index: number; item: any } | null>(null);
    const [selectedItemForDetail, setSelectedItemForDetail] = useState<StockItem | null>(null);
    const [isClawSettingsOpen, setIsClawSettingsOpen] = useState(false);


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

    // Load claw settings for current item
    useEffect(() => {
        if (fullCurrentItem?.id) {
            loadClawSettings();
        } else {
            setClawSettings(null);
        }
    }, [fullCurrentItem?.id, machine.updatedAt, machine.id]);

    const loadClawSettings = async () => {
        try {
            const allSettings = await itemMachineSettingsService.getAll();
            const settings = allSettings.find(
                s => s.itemId === fullCurrentItem?.id && s.machineId === machine.id
            );
            setClawSettings(settings || null);
        } catch (error) {
            console.error("Failed to load claw settings:", error);
        }
    };

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

            // Auto-promote first queue item if available
            const promotedItem = await promoteFirstQueueItem(
                machine.id,
                machine.name,
                items,
                user?.email || 'system'
            );

            if (promotedItem) {
                // Update slot with new current item
                const promotedSlots = machine.slots.map(s => {
                    if (s.id === targetSlot.id) {
                        return {
                            ...s,
                            currentItem: promotedItem,
                            upcomingQueue: (s.upcomingQueue || []).filter(q => q.itemId !== promotedItem.id)
                        };
                    }
                    return s;
                });
                await machineService.update(machine.id, { slots: promotedSlots });

                toast.info("Queue Item Promoted", {
                    description: `${promotedItem.name} is now the current item`
                });
            }

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
                <div
                    className="border rounded-xl p-5 flex items-center justify-between bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer group/card"
                    onClick={() => setSelectedItemForDetail(fullCurrentItem)}
                >
                    {fullCurrentItem ? (
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                {fullCurrentItem.imageUrl ? (
                                    <img src={getThumbnailUrl(fullCurrentItem.imageUrl, 80)} alt={fullCurrentItem.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                                        <Package className="h-8 w-8 opacity-40" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <Link
                                    href={`/inventory/${fullCurrentItem.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="block group/link"
                                >
                                    <h4 className="font-bold text-lg text-foreground tracking-tight group-hover/link:text-purple-600 transition-colors">{fullCurrentItem.name}</h4>
                                </Link>
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
                                    {/* Synced Claw Settings */}
                                    {fullCurrentItem && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {clawSettings ? (
                                                <>
                                                    <Settings2 className="h-3.5 w-3.5 text-purple-600" />
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span title="Stage 1 Grip">C1:{clawSettings.c1}</span>
                                                        <span title="Stage 2 Grip">C2:{clawSettings.c2}</span>
                                                        <span title="Stage 3 Grip">C3:{clawSettings.c3}</span>
                                                        <span title="Stage 4 (Win)">C4:{clawSettings.c4}</span>
                                                        <span className="text-foreground font-semibold ml-1">Payout: 1 in {clawSettings.playPerWin}</span>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] h-5 bg-purple-50 text-purple-700 border-purple-100 border cursor-pointer hover:bg-purple-100 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsClawSettingsOpen(true);
                                                        }}
                                                    >
                                                        Synced
                                                    </Badge>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-amber-300 bg-amber-50 text-[10px] text-amber-700">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Claw Settings Not Configured
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-[10px] text-purple-700 font-bold"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsClawSettingsOpen(true);
                                                        }}
                                                    >
                                                        Sync Now
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmClear(true);
                            }}
                        >
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
                                <div
                                    key={index}
                                    className="border rounded-xl p-4 flex items-center gap-6 bg-card shadow-sm hover:translate-x-1 hover:shadow-md transition-all duration-200 cursor-pointer group/card"
                                    onClick={() => setSelectedItemForDetail(fullItem || null)}
                                >
                                    <div className="text-xl font-bold text-muted-foreground/40 w-8 text-center select-none">#{index + 1}</div>

                                    <div className="h-16 w-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                        {queueItem.imageUrl ? (
                                            <img src={getThumbnailUrl(queueItem.imageUrl, 64)} alt={queueItem.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground bg-secondary/30">IMG</div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                        <Link
                                            href={`/inventory/${queueItem.itemId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="block group/link"
                                        >
                                            <div className="font-semibold text-foreground text-lg group-hover/link:text-purple-600 transition-colors">{queueItem.name}</div>
                                        </Link>
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmRemoveQueue({ index, item: queueItem });
                                        }}
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

            {/* Item Details Pop-up */}
            <StockItemDetailsDialog
                isOpen={!!selectedItemForDetail}
                onOpenChange={(open) => !open && setSelectedItemForDetail(null)}
                item={selectedItemForDetail}
                onEdit={() => { }} // Placeholder as parent doesn't handle edits for this context
                onDelete={() => { }} // Placeholder
                canPerformWriteActions={false}
                canDelete={false}
            />
            {/* Claw Settings Dialog */}
            {fullCurrentItem && (
                <ClawSettingsDialog
                    open={isClawSettingsOpen}
                    onOpenChange={setIsClawSettingsOpen}
                    item={fullCurrentItem}
                    machine={machine}
                    slotId={targetSlot.id}
                    onSaved={() => loadClawSettings()}
                />
            )}
        </div>
    );
}
