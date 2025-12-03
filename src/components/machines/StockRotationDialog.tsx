"use client";

import { useState, useEffect, useRef } from "react";
import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";
import { machineService, stockService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ArrowRight, Timer } from "lucide-react";

interface StockRotationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine: ArcadeMachine;
    slotId: string;
    onSuccess: () => void;
}

export function StockRotationDialog({ open, onOpenChange, machine, slotId, onSuccess }: StockRotationDialogProps) {
    const { user } = useAuth();
    const [countdown, setCountdown] = useState(10);
    const [isRotating, setIsRotating] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const slot = machine.slots.find(s => s.id === slotId);
    const nextItem = slot?.upcomingQueue?.[0];

    useEffect(() => {
        if (open && slot && nextItem) {
            setCountdown(10);
            timerRef.current = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        handleRotate(); // Auto-trigger
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [open, slot, nextItem]);

    const handleRotate = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!user || !slot || isRotating) return;

        setIsRotating(true);
        try {
            // 1. Prepare new slot state
            const newQueue = [...slot.upcomingQueue];
            const upcomingItem = newQueue.shift() || null; // Remove first item

            let fullStockItem: StockItem | null = null;
            if (upcomingItem) {
                fullStockItem = await stockService.getById(upcomingItem.itemId);
            }

            // 2. Update machine
            const updatedSlots = machine.slots.map(s => {
                if (s.id === slotId) {
                    return {
                        ...s,
                        currentItem: fullStockItem,
                        upcomingQueue: newQueue,
                        stockLevel: 'Full' as const
                    };
                }
                return s;
            });

            await machineService.update(machine.id, { slots: updatedSlots });

            // 3. Log action
            await logAction(
                user.uid,
                "update",
                "machine",
                machine.id,
                `Rotated stock for slot ${slot.name}. New item: ${fullStockItem?.name || "None"}`,
                { currentItem: slot.currentItem },
                { currentItem: fullStockItem }
            );

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to rotate stock:", error);
        } finally {
            setIsRotating(false);
        }
    };

    const handleCancel = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        onOpenChange(false);
    };

    if (!slot) return null;

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        Confirm Stock Rotation
                    </DialogTitle>
                    <DialogDescription>
                        This will archive the current item and promote the next item from the queue.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 p-4 border rounded-lg bg-muted/50 opacity-60">
                            <div className="text-xs font-medium text-muted-foreground mb-1">CURRENT</div>
                            <div className="font-bold truncate">{slot.currentItem?.name || "Empty"}</div>
                            <div className="text-xs text-muted-foreground">{slot.currentItem?.sku || "-"}</div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 p-4 border rounded-lg bg-blue-50 border-blue-100">
                            <div className="text-xs font-medium text-blue-600 mb-1">NEXT UP</div>
                            <div className="font-bold text-blue-900 truncate">{nextItem?.name || "Empty Queue"}</div>
                            <div className="text-xs text-blue-700">{nextItem?.sku || "-"}</div>
                        </div>
                    </div>

                    {nextItem ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 font-medium">
                                    <Timer className="h-4 w-4" />
                                    Auto-rotating in {countdown}s
                                </span>
                            </div>
                            <Progress value={(countdown / 10) * 100} className="h-2 transition-all duration-1000" />
                        </div>
                    ) : (
                        <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
                            Warning: The upcoming queue is empty. Rotating will leave the machine empty.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRotate}
                        disabled={isRotating}
                        variant={nextItem ? "default" : "destructive"}
                    >
                        {isRotating ? "Rotating..." : "Rotate Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
