"use client";

import { useState } from "react";
import { ArcadeMachine, StockItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManageStockModal } from "./ManageStockModal";
import { Trash2, Package } from "lucide-react";
import { machineService, stockService } from "@/services";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { calculateStockLevel } from "@/utils/inventoryUtils";

interface StockDetailsPanelProps {
    machine: ArcadeMachine;
    slotId?: string;
}

export function StockDetailsPanel({ machine, slotId }: StockDetailsPanelProps) {
    const { user } = useAuth();
    const { items, refreshMachines, refreshItems } = useData();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    // Identify target slot
    const targetSlot = slotId
        ? machine.slots.find(s => s.id === slotId)
        : (machine.slots.length === 1 ? machine.slots[0] : machine.slots[0]);

    if (!targetSlot) return <div className="p-4 border rounded-md">No slot configuration found.</div>;

    const currentItem = targetSlot.currentItem;

    // Get real-time stock data
    const fullCurrentItem = currentItem ? items.find(i => i.id === currentItem.id) : null;
    const totalQty = fullCurrentItem?.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0;

    const stockInfo = calculateStockLevel(totalQty, fullCurrentItem?.stockStatus);

    const queue = targetSlot.upcomingQueue || [];

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

            // Update item status back to unassigned
            await stockService.update(queueItem.itemId, {
                assignedMachineId: null as any,
                assignedMachineName: null as any,
                assignedStatus: 'Not Assigned',
                assignedSlotId: null as any
            });

            toast.success("Removed from queue");
            refreshMachines();
            refreshItems();
        } catch (e) {
            console.error(e);
            toast.error("Failed to remove from queue");
        }
    };

    const handleClearCurrent = async () => {
        if (!user || !currentItem) return;
        try {
            const updatedSlots = machine.slots.map(s => {
                if (s.id === targetSlot.id) {
                    return { ...s, currentItem: null };
                }
                return s;
            });

            await machineService.update(machine.id, { slots: updatedSlots });

            await stockService.update(currentItem.id, {
                assignedMachineId: null as any,
                assignedMachineName: null as any,
                assignedStatus: 'Not Assigned',
                assignedSlotId: null as any
            });

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
                    {currentItem ? (
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                {currentItem.imageUrl ? (
                                    <img src={currentItem.imageUrl} alt={currentItem.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                                        <Package className="h-8 w-8 opacity-40" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-foreground tracking-tight">{currentItem.name}</h4>
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <div className="text-sm text-muted-foreground">Location: {currentItem.locations?.[0]?.name || "Level 1"}</div>
                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-md w-fit ${stockInfo.colorClass}`}>
                                        {totalQty} Units • {stockInfo.label}
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

                    {currentItem ? (
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={handleClearCurrent}>
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
                                        onClick={() => handleRemoveFromQueue(index, queueItem)}
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
        </div>
    );
}
