"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StockItem, ArcadeMachine, MachineAssignment } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Gamepad2, Trash2, Plus, AlertTriangle, ShieldAlert, Package } from "lucide-react";
import { stockService, machineService, auditService } from "@/services";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataProvider";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import {
    migrateToMachineAssignments,
    removeMachineAssignment,
    updateAssignmentStatus,
    syncLegacyFieldsFromAssignments,
    getComputedAssignedStatus
} from "@/utils/machineAssignmentUtils";

interface MachineAssignmentManagerProps {
    item: StockItem;
    machines: ArcadeMachine[];
    onUpdate: () => void;
    onAddMachine?: () => void;
}

export function MachineAssignmentManager({
    item,
    machines,
    onUpdate,
    onAddMachine
}: MachineAssignmentManagerProps) {
    const { user, hasRole } = useAuth();
    const { items } = useData();

    // Dialog states
    const [confirmRemove, setConfirmRemove] = useState<MachineAssignment | null>(null);
    const [confirmStatusChange, setConfirmStatusChange] = useState<{
        assignment: MachineAssignment;
        newStatus: 'Using' | 'Replacement';
    } | null>(null);
    const [stockWarning, setStockWarning] = useState<{
        assignment: MachineAssignment;
        newStatus: 'Using' | 'Replacement';
        level: string;
    } | null>(null);
    const [accessDenied, setAccessDenied] = useState<string | null>(null);
    const [machineConflict, setMachineConflict] = useState<{
        assignment: MachineAssignment;
        conflictingItem: StockItem;
    } | null>(null);
    const [downgradeWarning, setDowngradeWarning] = useState<MachineAssignment | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const assignments = migrateToMachineAssignments(item);
    const hasUsingAssignment = assignments.some(a => a.status === 'Using');

    // Calculate stock info
    const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);
    const isOutOfStock = totalQty === 0 || item.stockStatus === "Out of Stock";
    const isLowStock = !isOutOfStock && (totalQty <= item.lowStockThreshold || item.stockStatus === "Low Stock" || item.stockStatus === "Limited Stock");

    const handleStatusChange = async (machineId: string, newStatus: 'Using' | 'Replacement') => {
        const assignment = assignments.find(a => a.machineId === machineId);
        if (!assignment) return;

        // If changing to "Using", run all checks
        if (newStatus === 'Using' && assignment.status !== 'Using') {
            // 1. Check stock level - Out of Stock requires supervisor
            if (isOutOfStock) {
                if (!hasRole(["manager", "admin"])) {
                    setAccessDenied("This item is out of stock. Only supervisors can set out-of-stock items as active.");
                    return;
                }
                // Supervisor continues with warning
                setStockWarning({ assignment, newStatus, level: "Out of Stock" });
                return;
            }

            // 2. Check for Low/Limited stock - show warning
            if (isLowStock) {
                setStockWarning({ assignment, newStatus, level: stockLevel.label });
                return;
            }

            // 3. Check if machine already has another "Using" item
            const machineActiveItem = items.find(i =>
                i.id !== item.id &&
                i.machineAssignments?.some(a =>
                    a.machineId === machineId && a.status === 'Using'
                )
            );
            if (machineActiveItem) {
                setMachineConflict({ assignment, conflictingItem: machineActiveItem });
                return;
            }

            // 4. Check if another machine already has this item as Using
            if (hasUsingAssignment) {
                setConfirmStatusChange({ assignment, newStatus });
                return;
            }
        }

        // If changing from "Using" to "Replacement", show downgrade warning
        if (newStatus === 'Replacement' && assignment.status === 'Using') {
            setDowngradeWarning(assignment);
            return;
        }

        await executeStatusChange(machineId, newStatus);
    };

    const executeStatusChange = async (machineId: string, newStatus: 'Using' | 'Replacement') => {
        setIsUpdating(true);
        try {
            const assignment = assignments.find(a => a.machineId === machineId);
            const oldStatus = assignment?.status || 'Unknown';
            const updatedAssignments = updateAssignmentStatus(assignments, machineId, newStatus);
            const machineName = assignment?.machineName;

            // Update stock item
            await stockService.update(item.id, {
                machineAssignments: updatedAssignments,
                ...syncLegacyFieldsFromAssignments({ ...item, machineAssignments: updatedAssignments }),
                updatedAt: new Date()
            });

            // Sync machine slot data - use first slot since each machine now has only one
            const machine = machines.find(m => m.id === machineId);
            if (machine) {
                const targetSlot = machine.slots[0];

                if (targetSlot) {
                    const updatedSlots = machine.slots.map(slot => {
                        if (slot.id === targetSlot.id) {
                            if (newStatus === 'Using') {
                                // Set as currentItem, remove from queue if present
                                return {
                                    ...slot,
                                    currentItem: item,
                                    upcomingQueue: (slot.upcomingQueue || []).filter(q => q.itemId !== item.id)
                                };
                            } else {
                                // Replacement: remove from currentItem if it was there, add to queue
                                const isCurrentItem = slot.currentItem?.id === item.id;
                                if (isCurrentItem) {
                                    return {
                                        ...slot,
                                        currentItem: null,
                                        upcomingQueue: [
                                            ...(slot.upcomingQueue || []),
                                            {
                                                itemId: item.id,
                                                name: item.name,
                                                imageUrl: item.imageUrl,
                                                addedBy: user?.email || 'unknown',
                                                addedAt: new Date()
                                            }
                                        ]
                                    };
                                }
                                return slot;
                            }
                        }
                        return slot;
                    });
                    await machineService.update(machine.id, { slots: updatedSlots });
                }
            }

            // Log the audit
            try {
                await auditService.add({
                    entityType: 'stock',
                    entityId: item.id,
                    action: 'status_change',
                    details: {
                        machineId,
                        machineName,
                        oldStatus,
                        newStatus: newStatus === 'Using' ? 'Assigned' : 'Assigned for Replacement'
                    },
                    userId: user?.email || 'unknown',
                    timestamp: new Date()
                });
            } catch (e) {
                console.warn("Failed to log audit:", e);
            }

            toast.success("Status Updated", {
                description: `${item.name} is now "${newStatus}" on ${machineName}`
            });

            onUpdate();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
            setConfirmStatusChange(null);
            setStockWarning(null);
            setMachineConflict(null);
        }
    };

    const handleRemove = async (machineId: string) => {
        const assignment = assignments.find(a => a.machineId === machineId);
        if (!assignment) return;
        setConfirmRemove(assignment);
    };

    const executeRemove = async () => {
        if (!confirmRemove) return;

        setIsUpdating(true);
        try {
            const updatedAssignments = removeMachineAssignment(assignments, confirmRemove.machineId);

            // Update stock item
            await stockService.update(item.id, {
                machineAssignments: updatedAssignments,
                ...syncLegacyFieldsFromAssignments({ ...item, machineAssignments: updatedAssignments }),
                updatedAt: new Date()
            });

            // Also remove from machine slot/queue if present
            const machine = machines.find(m => m.id === confirmRemove.machineId);
            if (machine) {
                const updatedSlots = machine.slots.map(slot => {
                    // Remove from currentItem if matches
                    if (slot.currentItem?.id === item.id) {
                        return { ...slot, currentItem: null };
                    }
                    // Remove from upcomingQueue if present
                    if (slot.upcomingQueue?.some(q => q.itemId === item.id)) {
                        return {
                            ...slot,
                            upcomingQueue: slot.upcomingQueue.filter(q => q.itemId !== item.id)
                        };
                    }
                    return slot;
                });
                await machineService.update(machine.id, { slots: updatedSlots });
            }

            // Log the audit
            try {
                await auditService.add({
                    entityType: 'stock',
                    entityId: item.id,
                    action: 'unassign',
                    details: {
                        machineId: confirmRemove.machineId,
                        machineName: confirmRemove.machineName,
                        previousStatus: confirmRemove.status
                    },
                    userId: user?.email || 'unknown',
                    timestamp: new Date()
                });
            } catch (e) {
                console.warn("Failed to log audit:", e);
            }

            toast.success("Assignment Removed", {
                description: `${item.name} removed from ${confirmRemove.machineName}`
            });

            onUpdate();
        } catch (error) {
            console.error("Failed to remove assignment:", error);
            toast.error("Failed to remove assignment");
        } finally {
            setIsUpdating(false);
            setConfirmRemove(null);
        }
    };

    const computedStatus = getComputedAssignedStatus(item);

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            Machine Assignments
                            <Badge variant="outline" className="ml-2">
                                {assignments.length}
                            </Badge>
                        </CardTitle>
                        {onAddMachine && (
                            <Button size="sm" variant="outline" onClick={onAddMachine}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Machine
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Overall: <span className="font-medium">{computedStatus}</span></span>
                        {isOutOfStock && (
                            <Badge variant="destructive" className="text-[10px] h-4">Out of Stock</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                            <Badge variant="outline" className="text-[10px] h-4 text-amber-600 border-amber-300">{stockLevel.label}</Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {assignments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No machine assignments</p>
                            {onAddMachine && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={onAddMachine}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Assign to Machine
                                </Button>
                            )}
                        </div>
                    ) : (
                        assignments.map((assignment) => (
                            <div
                                key={assignment.machineId}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border
                                    ${assignment.status === 'Using'
                                        ? 'bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800'
                                        : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Gamepad2 className={`h-5 w-5 ${assignment.status === 'Using' ? 'text-purple-600' : 'text-blue-600'
                                        }`} />
                                    <div>
                                        <Link
                                            href={`/machines/${assignment.machineId}`}
                                            className="font-medium text-sm hover:underline"
                                        >
                                            {assignment.machineName}
                                        </Link>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Select
                                        value={assignment.status}
                                        onValueChange={(value) => handleStatusChange(
                                            assignment.machineId,
                                            value as 'Using' | 'Replacement'
                                        )}
                                        disabled={isUpdating}
                                    >
                                        <SelectTrigger className="w-[130px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Using">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                                                    Using
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="Replacement">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                    Replacement
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemove(assignment.machineId)}
                                        disabled={isUpdating}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Access Denied Dialog */}
            <AlertDialog open={!!accessDenied} onOpenChange={() => setAccessDenied(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Cannot Assign
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {accessDenied}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAccessDenied(null)}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stock Level Warning Dialog */}
            <AlertDialog open={!!stockWarning} onOpenChange={() => setStockWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-amber-500" />
                            {stockWarning?.level} Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{item.name}</strong> has <strong>{stockWarning?.level?.toLowerCase()}</strong> ({totalQty} units).
                            <br /><br />
                            Are you sure you want to set it as active on <strong>{stockWarning?.assignment.machineName}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => stockWarning && executeStatusChange(
                                stockWarning.assignment.machineId,
                                stockWarning.newStatus
                            )}
                            disabled={isUpdating}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isUpdating ? "Updating..." : "Proceed Anyway"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Machine Conflict Dialog */}
            <AlertDialog open={!!machineConflict} onOpenChange={() => setMachineConflict(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Machine Already Has Active Item
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{machineConflict?.assignment.machineName}</strong> already has{" "}
                            <strong>{machineConflict?.conflictingItem.name}</strong> as its active item.
                            <br /><br />
                            Setting <strong>{item.name}</strong> as "Using" will make both items active on the same machine.
                            <br /><br />
                            Do you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => machineConflict && executeStatusChange(
                                machineConflict.assignment.machineId,
                                'Using'
                            )}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Updating..." : "Proceed Anyway"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Confirmation Dialog */}
            <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Remove Assignment
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{item.name}</strong> from{" "}
                            <strong>{confirmRemove?.machineName}</strong>?
                            {confirmRemove?.status === 'Using' && (
                                <span className="block mt-2 text-amber-600">
                                    ⚠️ This item is currently active on this machine. Removing it will
                                    leave the machine without an active item.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeRemove}
                            disabled={isUpdating}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isUpdating ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Multiple Using Confirmation Dialog */}
            <AlertDialog
                open={!!confirmStatusChange}
                onOpenChange={() => setConfirmStatusChange(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Multiple Active Machines
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This item is already set as "Using" on another machine.
                            <br /><br />
                            Setting <strong>{confirmStatusChange?.assignment.machineName}</strong> to
                            "Using" will make this item active on multiple machines simultaneously.
                            <br /><br />
                            Do you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => confirmStatusChange && executeStatusChange(
                                confirmStatusChange.assignment.machineId,
                                confirmStatusChange.newStatus
                            )}
                            disabled={isUpdating}
                        >
                            {isUpdating ? "Updating..." : "Yes, Set as Using"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Downgrade Warning Dialog (Using → Replacement) */}
            <AlertDialog open={!!downgradeWarning} onOpenChange={() => setDowngradeWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Status Change Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You are changing this item to <strong>"Replacement"</strong> on{" "}
                            <strong>{downgradeWarning?.machineName}</strong>.
                            <br /><br />
                            It will remain assigned to this machine but will <strong>no longer be the active item</strong>.
                            <br /><br />
                            Do you want to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => downgradeWarning && executeStatusChange(
                                downgradeWarning.machineId,
                                'Replacement'
                            ).then(() => setDowngradeWarning(null))}
                            disabled={isUpdating}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            {isUpdating ? "Updating..." : "Yes, Set as Replacement"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
