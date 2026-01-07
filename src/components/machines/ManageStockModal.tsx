"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, AlertTriangle, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { StockItem, ArcadeMachine } from "@/types";
import { useData } from "@/context/DataProvider";
import { machineService, stockService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
    migrateToMachineAssignments,
    addMachineAssignment,
    removeMachineAssignment,
    isAssignedToMachine,
    syncLegacyFieldsFromAssignments
} from "@/utils/machineAssignmentUtils";
import { MachineAssignment } from "@/types";
import { areSizesCompatible, getSizeMatchPriority, sizesAreEqual } from "@/utils/normalizeUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ManageStockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine: ArcadeMachine;
    slotId?: string;
    // Optional callback for when stock is selected (used for new machines that don't exist in Firestore yet)
    onStockSelected?: (slotId: string, item: StockItem, mode: 'current' | 'replace') => void;
}

export function ManageStockModal({ open, onOpenChange, machine, slotId, onStockSelected }: ManageStockModalProps) {
    const { items, refreshMachines, refreshItems } = useData();
    const { user } = useAuth();

    // UI States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [assignmentMode, setAssignmentMode] = useState<"current" | "replace">("current");
    const [supervisorOverride, setSupervisorOverride] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation States
    const [pendingItem, setPendingItem] = useState<StockItem | null>(null);
    const [confirmationWarnings, setConfirmationWarnings] = useState<string[]>([]);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Target Identification
    const targetSlot = slotId
        ? machine.slots.find(s => s.id === slotId)
        : (machine.slots.length === 1 ? machine.slots[0] : machine.slots[0]);

    const targetSize = machine.prizeSize || targetSlot?.size;

    // Derived Data
    const uniqueCategories = useMemo(() => {
        const cats = new Set(items.map(i => i.category).filter(cat => cat && cat.trim() !== ""));
        return Array.from(cats).sort();
    }, [items]);

    const { compatibleItems, otherItems } = useMemo(() => {
        if (!targetSlot) return { compatibleItems: [], otherItems: [] };

        let filtered = items.filter(item => {
            // Search Filter
            if (searchQuery) {
                const lowerQ = searchQuery.toLowerCase();
                if (!item.name.toLowerCase().includes(lowerQ) && !item.sku.toLowerCase().includes(lowerQ)) {
                    return false;
                }
            }
            // Category Filter
            if (selectedCategory !== "all" && item.category !== selectedCategory) {
                return false;
            }
            return true;
        });

        // Split by compatibility
        const compatible: StockItem[] = [];
        const other: StockItem[] = [];

        filtered.forEach(item => {
            if (areSizesCompatible(targetSize, item.size)) {
                compatible.push(item);
            } else {
                other.push(item);
            }
        });

        // Sort compatible items: exact size match first, then by name
        compatible.sort((a, b) => {
            const aPriority = getSizeMatchPriority(targetSize, a.size);
            const bPriority = getSizeMatchPriority(targetSize, b.size);
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.name.localeCompare(b.name);
        });

        return { compatibleItems: compatible, otherItems: other };
    }, [items, searchQuery, selectedCategory, targetSize, targetSlot]);
    // Handlers
    const checkAndConfirmAssign = (item: StockItem) => {
        const warnings: string[] = [];
        const totalQty = item.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0;
        const threshold = item.lowStockThreshold || 5;

        // 1. Check Stock Level
        if (totalQty === 0) {
            warnings.push("⚠️ This item is currently OUT OF STOCK.");
        } else if (totalQty <= threshold) {
            warnings.push(`⚠️ Low Stock: Only ${totalQty} units remaining.`);
        }

        // 2. Check if already assigned to THIS machine
        if (isAssignedToMachine(item, machine.id)) {
            warnings.push(`ℹ️ This item is already assigned to this machine.`);
        }

        // 3. Check if assigned to OTHER machines
        const assignments = migrateToMachineAssignments(item);
        const otherMachines = assignments.filter(a => a.machineId !== machine.id);
        if (otherMachines.length > 0) {
            const machineNames = otherMachines.map(a => a.machineName).join(', ');
            warnings.push(`ℹ️ Also assigned to: ${machineNames}`);
        }

        // 4. Check Size Compatibility - ALWAYS check, even with supervisor override ON
        // Use the same areSizesCompatible function used for filtering the list
        // This ensures consistency between what's shown as "incompatible" and what triggers a warning
        const isCompatible = areSizesCompatible(targetSize, item.size);
        if (!isCompatible) {
            const machineExpectedSize = targetSize || machine.prizeSize || 'Unknown';
            const itemActualSize = item.size || 'Unknown';
            warnings.push(`🚫 Size Mismatch: Machine expects "${machineExpectedSize}" prizes, but this item is "${itemActualSize}".`);
        }

        // 5. Check if machine slot is occupied (for current mode)
        if (assignmentMode === 'current' && targetSlot?.currentItem && targetSlot.currentItem.id !== item.id) {
            warnings.push(`⚠️ This will replace the current item on this machine.`);
        }

        // ALWAYS show confirmation dialog - even when no warnings
        setPendingItem(item);
        setConfirmationWarnings(warnings);
        setIsConfirmOpen(true);
    };

    const confirmAssignment = () => {
        if (pendingItem) {
            executeAssign(pendingItem);
            setIsConfirmOpen(false);
            setPendingItem(null);
        }
    };

    const executeAssign = async (item: StockItem) => {
        if (!user || !targetSlot || isSubmitting) return;
        setIsSubmitting(true);

        try {
            // If callback is provided, use it instead of Firestore operations (for new machines)
            if (onStockSelected) {
                onStockSelected(targetSlot.id, item, assignmentMode);
                toast.success(assignmentMode === 'current'
                    ? `Selected ${item.name} as current prize`
                    : `Added ${item.name} to replacement queue`
                );
                onOpenChange(false); // Close the modal
                return;
            }

            // Get current assignments for this item
            const currentAssignments = migrateToMachineAssignments(item);
            const assignmentStatus: 'Using' | 'Replacement' = assignmentMode === 'current' ? 'Using' : 'Replacement';

            if (assignmentMode === "current") {
                // Logic: Set as Current Item
                // 1. Clear old current if exists
                if (targetSlot.currentItem) {
                    const oldItemAssignments = migrateToMachineAssignments(targetSlot.currentItem);
                    const updatedOldAssignments = removeMachineAssignment(oldItemAssignments, machine.id);
                    const oldItemUpdate = {
                        machineAssignments: updatedOldAssignments,
                        ...syncLegacyFieldsFromAssignments({
                            ...targetSlot.currentItem,
                            machineAssignments: updatedOldAssignments
                        })
                    };
                    await stockService.update(targetSlot.currentItem.id, oldItemUpdate);
                }

                // 2. Add new assignment
                const newAssignment: Omit<MachineAssignment, 'assignedAt'> = {
                    machineId: machine.id,
                    machineName: machine.name,
                    status: 'Using',
                };
                const updatedAssignments = addMachineAssignment(currentAssignments, newAssignment);
                const itemUpdate = {
                    machineAssignments: updatedAssignments,
                    ...syncLegacyFieldsFromAssignments({ ...item, machineAssignments: updatedAssignments })
                };
                await stockService.update(item.id, itemUpdate);

                // 3. Update Machine
                const updatedSlots = machine.slots.map(s => {
                    if (s.id === targetSlot.id) return { ...s, currentItem: item };
                    return s;
                });
                await machineService.update(machine.id, { slots: updatedSlots });

                await logAction(user.uid, "update", "machine", machine.id, `Set current stock to ${item.name}`);
                toast.success(`Set ${item.name} as current prize`);

            } else {
                // Logic: Add to Queue (Replacement)
                // 1. Add assignment
                const newAssignment: Omit<MachineAssignment, 'assignedAt'> = {
                    machineId: machine.id,
                    machineName: machine.name,
                    status: 'Replacement',
                };
                const updatedAssignments = addMachineAssignment(currentAssignments, newAssignment);
                const itemUpdate = {
                    machineAssignments: updatedAssignments,
                    ...syncLegacyFieldsFromAssignments({ ...item, machineAssignments: updatedAssignments })
                };
                await stockService.update(item.id, itemUpdate);

                // 2. Add to machine queue
                const newQueueItem = {
                    itemId: item.id,
                    name: item.name,
                    sku: item.sku,
                    imageUrl: item.imageUrl,
                    addedBy: user.uid,
                    addedAt: new Date()
                };
                const updatedSlots = machine.slots.map(s => {
                    if (s.id === targetSlot.id) return { ...s, upcomingQueue: [...s.upcomingQueue, newQueueItem] };
                    return s;
                });
                await machineService.update(machine.id, { slots: updatedSlots });

                await logAction(user.uid, "update", "machine", machine.id, `Queued ${item.name} for replacement`);
                toast.success(`Added ${item.name} to replacement queue`);
            }

            refreshItems();
            refreshMachines();
            onOpenChange(false); // Close the modal after successful assignment
        } catch (e) {
            console.error(e);
            toast.error("Assignment failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!targetSlot) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    {/* Header Section */}
                    <div className="p-6 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-xl">
                                Assign to {machine.name}{targetSlot && machine.slots.length > 1 ? ` ${targetSlot.name}` : ''} <span className="text-muted-foreground text-base font-normal">({items.length} items loaded)</span>
                            </DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full">
                                <span className="sr-only">Close</span>
                            </Button>
                        </div>

                        <DialogDescription className="hidden">Assign stock items</DialogDescription>

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search inventory by name or SKU..."
                                    className="pl-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {uniqueCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Logic Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Assignment Type</Label>
                                <RadioGroup
                                    value={assignmentMode}
                                    onValueChange={(v) => setAssignmentMode(v as any)}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="current" id="mode-current" />
                                        <Label htmlFor="mode-current" className="cursor-pointer font-medium">Set as Current Prize</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="replace" id="mode-queue" />
                                        <Label htmlFor="mode-queue" className="cursor-pointer font-medium">Add to Queue</Label>
                                    </div>
                                </RadioGroup>
                                <p className="text-[11px] text-muted-foreground">
                                    {assignmentMode === 'current'
                                        ? "Replaces the currently active item. Use for immediate restocking."
                                        : "Adds to the upcoming queue. Machine will auto-switch when empty."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                                <Switch
                                    id="supervisor-override"
                                    checked={supervisorOverride}
                                    onCheckedChange={setSupervisorOverride}
                                />
                                <div className="grid gap-0.5">
                                    <Label htmlFor="supervisor-override" className="text-sm font-semibold cursor-pointer">
                                        Supervisor Override
                                    </Label>
                                    <span className="text-[10px] text-muted-foreground">
                                        Show incompatible {targetSize ? `(${targetSize})` : ''} items
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* List Section */}
                    <div className="flex-1 overflow-hidden bg-muted/5">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-6">

                                {/* Compatible Items */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                                        Compatible Items
                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-background">
                                            {compatibleItems.length}
                                        </Badge>
                                    </h3>

                                    {compatibleItems.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                            <p className="text-sm text-muted-foreground">No compatible items found matching your filters.</p>
                                        </div>
                                    ) : (
                                        compatibleItems.map(item => (
                                            <StockItemRow
                                                key={item.id}
                                                item={item}
                                                activeMode={assignmentMode}
                                                onAssign={() => checkAndConfirmAssign(item)}
                                                currentMachineId={machine.id}
                                                targetSize={targetSize}
                                            />
                                        ))
                                    )}
                                </div>

                                {/* Incompatible Items (Only if override is on) */}
                                {supervisorOverride && otherItems.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                                            Incompatible / Other Sizes
                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-background">
                                                {otherItems.length}
                                            </Badge>
                                        </h3>
                                        {otherItems.map(item => (
                                            <StockItemRow
                                                key={item.id}
                                                item={item}
                                                activeMode={assignmentMode}
                                                onAssign={() => checkAndConfirmAssign(item)}
                                                currentMachineId={machine.id}
                                                targetSize={targetSize}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="p-4 border-t bg-background">
                        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                            <span>
                                Assigning to: <span className="font-medium text-foreground">{targetSlot.name || machine.name}</span>
                            </span>
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className={`flex items-center gap-2 ${confirmationWarnings.length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {confirmationWarnings.length > 0 ? (
                                <>
                                    <AlertTriangle className="h-5 w-5" />
                                    Review Before Assigning
                                </>
                            ) : (
                                <>
                                    <Gamepad2 className="h-5 w-5" />
                                    Confirm Assignment
                                </>
                            )}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 pt-2" asChild>
                            <div>
                                {/* Show the item being assigned */}
                                {pendingItem && (
                                    <div className="border rounded-lg p-3 bg-green-50/50 dark:bg-green-900/10">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                                            {assignmentMode === 'current' ? 'Assigning as current item:' : 'Adding to replacement queue:'}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                                                {pendingItem.imageUrl ? (
                                                    <img
                                                        src={pendingItem.imageUrl}
                                                        alt={pendingItem.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                                        No Img
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground truncate">
                                                    {pendingItem.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Size: {pendingItem.size || 'Unknown'} • Stock: {pendingItem.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Show current item being replaced */}
                                {assignmentMode === 'current' && targetSlot?.currentItem && pendingItem && targetSlot.currentItem.id !== pendingItem.id && (
                                    <div className="border rounded-lg p-3 bg-red-50/50 dark:bg-red-900/10">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">
                                            This will replace the current item:
                                        </p>
                                        <Link
                                            href={`/inventory/${targetSlot.currentItem.id}`}
                                            className="flex items-center gap-3 group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                                                {targetSlot.currentItem.imageUrl ? (
                                                    <img
                                                        src={targetSlot.currentItem.imageUrl}
                                                        alt={targetSlot.currentItem.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                                        No Img
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground group-hover:text-primary group-hover:underline truncate">
                                                    {targetSlot.currentItem.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Click to view details →
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                {/* Warnings List - only if there are warnings */}
                                {confirmationWarnings.length > 0 && (
                                    <div className="space-y-1">
                                        {confirmationWarnings.map((warning, index) => (
                                            <div key={index} className="text-sm text-foreground">
                                                {warning}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="pt-2 text-xs text-muted-foreground border-t">
                                    {confirmationWarnings.length > 0
                                        ? 'Do you want to proceed despite the warnings above?'
                                        : `Assign to ${machine.name}?`
                                    }
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmAssignment}
                            className={confirmationWarnings.length > 0 ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {confirmationWarnings.length > 0 ? 'Proceed Anyway' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// Sub-component for efficient rendering of list items
function StockItemRow({
    item,
    activeMode,
    onAssign,
    currentMachineId,
    targetSize
}: {
    item: StockItem,
    activeMode: "current" | "replace",
    onAssign: () => void,
    currentMachineId: string,
    targetSize?: string
}) {
    const totalQty = item.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0;
    const isLowStock = totalQty <= (item.lowStockThreshold || 5);
    const isOutOfStock = totalQty === 0;
    const isSizeMismatch = targetSize && item.size && !areSizesCompatible(targetSize, item.size);

    // Check assignment status using new utility
    const isAssignedToThis = isAssignedToMachine(item, currentMachineId);
    const assignments = migrateToMachineAssignments(item);
    const isAssignedElsewhere = assignments.some(a => a.machineId !== currentMachineId);

    // Badge Logic - show assignment to this machine AND details of other assignments
    const otherMachines = assignments.filter(a => a.machineId !== currentMachineId);
    const otherCount = otherMachines.length;

    // Build other machines display based on count
    let otherMachinesDisplay = null;

    if (otherCount === 1) {
        // Single other machine - show full name directly as clickable link
        const other = otherMachines[0];
        otherMachinesDisplay = (
            <Link href={`/machines/${other.machineId}`} onClick={(e) => e.stopPropagation()}>
                <Badge
                    variant="outline"
                    className={`text-xs cursor-pointer hover:underline ${other.status === 'Using' ? 'text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100' : 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100'}`}
                >
                    {other.machineName} ({other.status})
                </Badge>
            </Link>
        );
    } else if (otherCount > 1) {
        // Multiple other machines - use popover with full names as links
        otherMachinesDisplay = (
            <Popover>
                <PopoverTrigger asChild>
                    <Badge
                        variant="outline"
                        className="text-xs cursor-pointer text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                    >
                        +{otherCount} machines
                    </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Also assigned to:</div>
                    <div className="space-y-1.5">
                        {otherMachines.map(a => (
                            <Link
                                key={a.machineId}
                                href={`/machines/${a.machineId}`}
                                className="flex items-center gap-2 p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                            >
                                <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium hover:underline">{a.machineName}</div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${a.status === 'Using' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'}`}
                                >
                                    {a.status}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    let statusBadge;

    if (isAssignedToThis) {
        const thisAssignment = assignments.find(a => a.machineId === currentMachineId);
        statusBadge = (
            <div className="flex items-center gap-1.5 flex-wrap">
                {thisAssignment?.status === 'Using'
                    ? <Badge className="bg-purple-600 hover:bg-purple-700">Currently Active</Badge>
                    : <Badge variant="secondary" className="bg-blue-100 text-blue-700">In Queue</Badge>
                }
                {otherMachinesDisplay}
            </div>
        );
    } else if (otherCount > 0) {
        // Not assigned to this machine, but assigned to others
        statusBadge = otherMachinesDisplay;
    } else {
        statusBadge = <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Available</Badge>;
    }

    // Border Logic
    let borderClass = "border-green-500/40 bg-green-50/10 hover:border-green-500 hover:bg-green-50/30"; // Default Good

    if (isOutOfStock || isAssignedElsewhere) {
        // Critical: Dark Red
        borderClass = "border-red-800/60 bg-red-100/30 hover:border-red-800 hover:bg-red-100/50";
    } else if (isLowStock || isSizeMismatch) {
        // Warning: Red
        borderClass = "border-red-400 bg-red-50/20 hover:border-red-500 hover:bg-red-50/40";
    }

    return (
        <div className={`
            group flex items-center justify-between p-3 rounded-lg border-2 transition-all shadow-sm
            ${borderClass}
        `}>
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-md overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.name}</span>
                        {statusBadge}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{item.sku}</span>
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                        <span>•</span>
                        <span className={isSizeMismatch ? "text-red-600 font-bold" : ""}>
                            {item.size || "Unknown Size"}
                        </span>
                        <span>•</span>
                        <span className={isOutOfStock ? "text-destructive font-black" : isLowStock ? "text-amber-600 font-bold" : "text-green-600 font-medium"}>
                            {totalQty} in stock
                        </span>
                    </div>
                </div>
            </div>

            <Button
                size="sm"
                variant={isOutOfStock ? "destructive" : (isLowStock || isSizeMismatch ? "secondary" : "default")}
                className={`
                    opacity-0 group-hover:opacity-100 transition-opacity
                    ${activeMode === 'current' ? (isOutOfStock ? '' : 'bg-purple-600 hover:bg-purple-700') : ''}
                    ${isAssignedToThis ? 'invisible' : ''}
                `}
                onClick={onAssign}
            >
                {activeMode === 'current' ? "Set Current" : "Add to Queue"}
            </Button>
        </div>
    );
}
