"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { machineService, stockService } from "@/services";
import { useData } from "@/context/DataProvider";
import { AuditLog, StockItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Package, DollarSign, Truck, Settings2, Gamepad2, Bot, StickyNote, Pencil, Warehouse, Info } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StockItemForm } from "@/components/inventory/StockItemForm";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow, format } from "date-fns";

// New Components
import { StockDetailHero } from "@/components/inventory/StockDetailHero";
import { StockActivitySidebar } from "@/components/inventory/StockActivitySidebar";
import { MachineAssignmentHistory } from "@/components/inventory/MachineAssignmentHistory";
import { useAuth } from "@/context/AuthContext"; // Added auth context
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { getItemById, machines, items, itemsLoading, machinesLoading, refreshMachines } = useData();
    const { userProfile, hasRole } = useAuth();

    const [categories, setCategories] = useState<string[]>([]);
    // sizes is managed internally by StockItemForm
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    // Inline editing states
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // Assignment Logic States
    const [statusConfirm, setStatusConfirm] = useState<{ item: StockItem, status: string } | null>(null);
    const [warningAlert, setWarningAlert] = useState<{ title: string, description: string, open: boolean }>({ title: "", description: "", open: false });
    const [assignmentConflict, setAssignmentConflict] = useState<{
        item: StockItem;
        currentUsingItem: StockItem;
    } | null>(null);

    // Machine Assignment States
    const [isAssignMachineOpen, setIsAssignMachineOpen] = useState(false);
    const [assigningItem, setAssigningItem] = useState<StockItem | null>(null);
    const [assignmentMode, setAssignmentMode] = useState<'primary' | 'replacement'>('primary');
    const [machineSearch, setMachineSearch] = useState("");
    const [machineFilter, setMachineFilter] = useState("All");
    const [pendingAssignment, setPendingAssignment] = useState<{ machine: any, status: string, slotId?: string } | null>(null);

    // Stock Level Change States
    const [pendingStockChange, setPendingStockChange] = useState<{ item: StockItem; newLevel: string } | null>(null);
    const [isOutOfStockConfirmOpen, setIsOutOfStockConfirmOpen] = useState(false);
    const [itemToSetOutOfStock, setItemToSetOutOfStock] = useState<StockItem | null>(null);
    const [restockQuantity, setRestockQuantity] = useState<string>("0");
    const [outOfStockMode, setOutOfStockMode] = useState<"set-zero" | "keep-quantity">("set-zero");

    // Supervisor Override States
    const [supervisorOverride, setSupervisorOverride] = useState<{ item: StockItem, action: "unassign" | "downgrade-using-to-replacement" } | null>(null);
    const [supervisorPassword, setSupervisorPassword] = useState("");
    const [supervisorError, setSupervisorError] = useState("");

    // Get item from context (auto-updates when data changes)
    const item = getItemById(id) || null;
    const loading = itemsLoading || machinesLoading;

    // Load categories and sizes for form
    useEffect(() => {
        const loadFormData = async () => {
            try {
                // Get unique categories from all stock items
                const allItems = await stockService.getAll();
                const uniqueCategories = [...new Set(allItems.map(item => item.category).filter(Boolean))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };
        loadFormData();
    }, []);

    // Inline edit handlers
    const startEdit = (field: string, currentValue: string) => {
        setEditingField(field);
        setEditValue(currentValue);
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValue("");
    };

    const saveEdit = async (field: string) => {
        if (!item) return;
        try {
            const updateData: Partial<StockItem> = { updatedAt: new Date() };

            // Handle different field types
            if (field === "description") {
                updateData.description = editValue;
            } else if (field === "lowStockThreshold") {
                updateData.lowStockThreshold = parseInt(editValue) || 0;
            } else if (field === "playWinTarget") {
                updateData.playWinTarget = parseInt(editValue) || 0;
            } else if (field.startsWith("location_")) {
                const locIndex = parseInt(field.split("_")[1]);
                const newLocations = [...(item.locations || [])];
                if (newLocations[locIndex]) {
                    newLocations[locIndex].quantity = parseInt(editValue) || 0;
                }
                updateData.locations = newLocations;
            }

            await stockService.update(item.id, updateData);
            toast.success("Updated", { description: `${field} has been updated.` });
        } catch (error) {
            console.error("Failed to update:", error);
            toast.error("Error", { description: "Failed to update field." });
        }
        cancelEdit();
    };

    const handleSaveItem = async (data: any) => {
        if (!item) return;
        try {
            await stockService.update(item.id, {
                ...data,
                updatedAt: new Date()
            });
            toast.success("Item Updated", { description: "Item details have been updated." });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Failed to update item:", error);
            toast.error("Error", { description: "Failed to update item." });
        }
    };

    const handleDeleteItem = async () => {
        if (!item) return;
        try {
            await stockService.remove(item.id);
            toast.success("Item Deleted", { description: `${item.name} has been permanently deleted.` });
            router.push("/inventory");
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Error", { description: "Failed to delete item." });
        } finally {
            setIsDeleteConfirmOpen(false);
        }
    };

    const handleChangeStockStatus = async (newLevel: string) => {
        if (!item) return;

        const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
        const currentLevel = calculateStockLevel(totalQty, item.stockStatus).status;

        // If the calculated status already matches the requested level, we don't strictly need to do anything.
        if (currentLevel === newLevel) return;

        // Handle "Out of Stock" with a confirmation dialog
        if (newLevel === "Out of Stock") {
            setItemToSetOutOfStock(item);
            setIsOutOfStockConfirmOpen(true);
            return;
        }

        // For other stock levels, show the dialog
        setPendingStockChange({ item, newLevel });

        // Default quantities based on new level
        if (newLevel === "In Stock") setRestockQuantity("26");
        else if (newLevel === "Limited Stock") setRestockQuantity("12");
        else if (newLevel === "Low Stock") setRestockQuantity("5");
        else setRestockQuantity("0");
    };

    const createHistoryLog = (action: string, details: any, entityId: string = "temp"): AuditLog => ({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        entityType: "StockItem",
        entityId,
        userId: userProfile?.uid || "system",
        userRole: userProfile?.role || "system",
        timestamp: new Date(),
        details
    });

    const processStatusChange = async (targetItem: StockItem, newStatus: string) => {
        try {
            const oldStatus = targetItem.assignedStatus;
            const historyLog = createHistoryLog("STATUS_CHANGE", {
                oldStatus: oldStatus || "Not Assigned",
                newStatus: newStatus,
                machine: targetItem.assignedMachineName || "None"
            }, targetItem.id);
            const updatedHistory = [...(targetItem.history || []), historyLog];

            const updates: Partial<StockItem> = {
                assignedStatus: newStatus,
                history: updatedHistory,
                updatedAt: new Date()
            };

            if (newStatus === "Not Assigned") {
                updates.assignedMachineId = undefined;
                updates.assignedMachineName = undefined;
            }

            await stockService.update(targetItem.id, updates);

            // Logic for "Machine Without an Active Item" & "Replacement Queue Auto-Assignment"
            if (oldStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
                const machineId = targetItem.assignedMachineId;
                if (machineId) {
                    // Replacement Queue Auto-Assignment
                    const replacementQueue = items.filter(i =>
                        i.assignedMachineId === machineId &&
                        i.assignedStatus === "Assigned for Replacement" &&
                        i.id !== targetItem.id
                    );

                    if (replacementQueue.length > 0) {
                        replacementQueue.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
                        const nextItem = replacementQueue[0];

                        await stockService.update(nextItem.id, {
                            assignedStatus: "Assigned",
                            updatedAt: new Date()
                        });

                        toast.success("Auto-Assigned Replacement", {
                            description: `${nextItem.name} has been automatically promoted to active item.`
                        });
                    }
                }
            }

            // Refresh machines to update slot status if we changed assignment status
            if ((newStatus === "Not Assigned" && targetItem.assignedMachineId) || (oldStatus === "Assigned" && newStatus !== "Assigned") || newStatus === "Assigned") {
                await refreshMachines(); // Use useData's refresh
            }

            toast.success(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        }
    };

    const handleChangeAssignedStatus = async (newStatus: string) => {
        if (!item) return;

        // Validation Logic - use toast notifications instead of modal dialogs
        if (newStatus === "Assigned" || newStatus === "Assigned for Replacement") {
            const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || item.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= item.lowStockThreshold || item.stockStatus === "Low Stock");

            if (isOut) {
                if (!hasRole(["manager", "admin"])) {
                    toast.error("Out of Stock", {
                        description: "This item is out of stock and cannot be assigned by crew. Please ask a supervisor to assign it or update stock first.",
                    });
                    return;
                } else {
                    toast.warning("Supervisor Override - Out of Stock", {
                        description: "This item is currently out of stock. Machines may appear empty until stock is received.",
                    });
                }
            } else if (isLow) {
                toast.warning("Low Stock Warning", {
                    description: "This item is low on stock. Assigning it now may cause the machine to run out soon.",
                });
            }
        }

        // Handle changing from Replacement -> Using
        if (item.assignedStatus === "Assigned for Replacement" && newStatus === "Assigned") {
            if (item.assignedMachineId) {
                const currentActive = items.find(i =>
                    i.assignedMachineId === item.assignedMachineId &&
                    i.assignedStatus === "Assigned" &&
                    i.id !== item.id
                );

                if (currentActive) {
                    setAssignmentConflict({ item, currentUsingItem: currentActive });
                    return;
                }
            }
            await processStatusChange(item, "Assigned");
            return;
        }

        // Changing from Using to Not Assigned or Replacement requires warning
        if (item.assignedStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
            if (newStatus === "Assigned for Replacement") {
                toast.info("Status Change", {
                    description: `Changing to "Replacement". Item will remain assigned to ${item.assignedMachineName} but will no longer be the active item.`
                });
                await processStatusChange(item, newStatus);
                return;
            }

            setStatusConfirm({ item, status: newStatus });
            return;
        }

        // If changing to Assigned and no machine is assigned, open the assignment dialog
        if (newStatus === "Assigned" && !item.assignedMachineId) {
            setAssigningItem(item);
            setAssignmentMode('primary');
            setIsAssignMachineOpen(true);
            return;
        }

        // If changing to Assigned for Replacement, open the assignment dialog
        if (newStatus === "Assigned for Replacement") {
            setAssigningItem(item);
            setAssignmentMode('replacement');
            setIsAssignMachineOpen(true);
            return;
        }

        // Normal path
        await processStatusChange(item, newStatus);
    };

    const handleAssignMachine = async (machineId: string, slotId: string) => {
        if (!assigningItem) return;

        try {
            // Get current item state from context to have updated values
            const currentItem = getItemById(assigningItem.id);
            if (!currentItem) {
                toast.error("Error", { description: "Item not found." });
                return;
            }

            // Global stock checks when assigning via machine dialog
            const totalQty = currentItem.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || currentItem.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= currentItem.lowStockThreshold || currentItem.stockStatus === "Low Stock");

            // Show warnings as toasts but don't block the flow (except for crew on out of stock)
            if (isOut) {
                if (!hasRole(["manager", "admin"])) {
                    toast.error("Out of Stock", {
                        description: "This item is out of stock and cannot be assigned by crew. Please ask a supervisor to assign it or update stock first.",
                    });
                    setIsAssignMachineOpen(false);
                    setAssigningItem(null);
                    return;
                } else {
                    toast.warning("Supervisor Override - Out of Stock", {
                        description: "This item is currently out of stock. Machines may appear empty until stock is received.",
                    });
                }
            } else if (isLow) {
                toast.warning("Low Stock Warning", {
                    description: "This item is low on stock. Assigning it now may cause the machine to run out soon.",
                });
            }

            const machine = machines.find(m => m.id === machineId);
            if (!machine) {
                toast.error("Error", { description: "Machine not found." });
                return;
            }

            // Determine the target status based on mode
            const targetStatus = assignmentMode === 'replacement'
                ? "Assigned for Replacement"
                : "Assigned";

            // Check if item is already assigned to this machine
            const alreadyOnThisMachine = items.some(i =>
                i.id === currentItem.id && i.assignedMachineId === machineId
            );

            if (alreadyOnThisMachine) {
                const currentStatus = currentItem.assignedStatus || "Not Assigned";
                toast.error("Already Assigned", {
                    description: `This item is already "${currentStatus}" to ${machine.name}.`
                });
                return;
            }

            // USING Mode Logic
            if (targetStatus === "Assigned") {
                const currentActiveItem = items.find(i =>
                    i.assignedMachineId === machineId &&
                    i.assignedStatus === "Assigned"
                );

                if (currentActiveItem) {
                    // Machine is occupied. Ask for confirmation to replace.
                    setPendingAssignment({ machine, status: targetStatus, slotId });
                    return;
                }
            }

            // REPLACEMENT Mode Logic
            if (targetStatus === "Assigned for Replacement") {
                const replacementQueue = items.filter(i =>
                    i.assignedMachineId === machineId &&
                    i.assignedStatus === "Assigned for Replacement"
                );

                if (replacementQueue.length > 0) {
                    toast.info("Adding to Queue", {
                        description: `This machine already has ${replacementQueue.length} item(s) in the replacement queue. Adding this item.`
                    });
                }
            }

            // Update assigningItem to use current state before executing
            setAssigningItem(currentItem);
            await executeAssignment(machine, targetStatus, slotId);

        } catch (error) {
            console.error("Failed to assign machine:", error);
            toast.error("Error", { description: "Failed to assign machine." });
        }
    };

    const executeAssignment = async (machine: any, targetStatus: string, slotId?: string) => {
        if (!assigningItem) return;

        // If USING mode, unassign any existing active item
        if (targetStatus === "Assigned") {
            const currentActiveItem = items.find(i =>
                i.assignedMachineId === machine.id &&
                i.assignedStatus === "Assigned"
            );

            if (currentActiveItem) {
                const unassignLog = createHistoryLog("UNASSIGN_MACHINE", {
                    reason: "Replaced by new item",
                    replacedBy: assigningItem.name,
                    machine: machine.name,
                    previousStatus: currentActiveItem.assignedStatus
                }, currentActiveItem.id);
                const updatedHistory = [...(currentActiveItem.history || []), unassignLog];

                await stockService.update(currentActiveItem.id, {
                    assignedMachineId: undefined,
                    assignedMachineName: undefined,
                    assignedStatus: "Not Assigned",
                    history: updatedHistory,
                    updatedAt: new Date()
                });
            }
        }

        // Update inventory item with machine assignment
        const assignLog = createHistoryLog("ASSIGN_MACHINE", {
            machine: machine.name,
            machineId: machine.id,
            slot: slotId || "Any",
            status: targetStatus,
            assignmentMode: assignmentMode
        }, assigningItem.id);
        const updatedAssignHistory = [...(assigningItem.history || []), assignLog];

        await stockService.update(assigningItem.id, {
            assignedMachineId: machine.id,
            assignedMachineName: machine.name,
            assignedSlotId: slotId,
            assignedStatus: targetStatus,
            history: updatedAssignHistory,
            updatedAt: new Date()
        });

        // Reload machines to update slot status
        await refreshMachines();

        toast.success("Assigned to Machine", { description: `${assigningItem.name} assigned to ${machine.name} as "${targetStatus}"` });
        setIsAssignMachineOpen(false);
        setAssigningItem(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4">
                <h1 className="text-2xl font-bold">Item Not Found</h1>
                <Button onClick={() => router.push("/inventory")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Inventory
                </Button>
            </div>
        );
    }

    const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);
    const assignedMachines = machines.filter(m =>
        m.slots.some(slot =>
            slot.currentItem?.id === item.id ||
            slot.upcomingQueue?.some(uItem => uItem.itemId === item.id)
        )
    );

    // Inline editable field component
    const InlineEdit = ({
        field,
        value,
        type = "text",
        className = ""
    }: {
        field: string;
        value: string | number;
        type?: "text" | "number" | "textarea";
        className?: string;
    }) => {
        if (editingField === field) {
            return (
                <div className="flex items-center gap-2">
                    {type === "textarea" ? (
                        <Textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="min-h-[80px]"
                            autoFocus
                        />
                    ) : (
                        <Input
                            type={type}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 w-24"
                            autoFocus
                        />
                    )}
                    <Button size="sm" onClick={() => saveEdit(field)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                </div>
            );
        }
        return (
            <span
                className={`cursor-pointer hover:bg-muted/50 px-1 rounded group inline-flex items-center gap-1 ${className}`}
                onClick={() => startEdit(field, String(value))}
            >
                {value}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
            </span>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.push("/inventory")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Inventory
            </Button>

            {/* Hero Section */}
            <StockDetailHero
                item={item}
                onEdit={() => setIsEditOpen(true)}
                onDelete={() => setIsDeleteConfirmOpen(true)}
                onAdjustStock={() => setIsAdjustOpen(true)}
                onRequestReorder={() => toast.info("Reorder feature coming soon")}
                onChangeStockStatus={handleChangeStockStatus}
                onChangeAssignedStatus={handleChangeAssignedStatus}
            />

            {/* Main Content with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Tabbed Content (2/3) */}
                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                            <TabsTrigger value="overview"><Package className="h-4 w-4 mr-1 hidden sm:inline" />Overview</TabsTrigger>
                            <TabsTrigger value="financials"><DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />Financials</TabsTrigger>
                            <TabsTrigger value="supply"><Truck className="h-4 w-4 mr-1 hidden sm:inline" />Supply</TabsTrigger>
                            <TabsTrigger value="technical"><Settings2 className="h-4 w-4 mr-1 hidden sm:inline" />Tech</TabsTrigger>
                            <TabsTrigger value="gameplay"><Gamepad2 className="h-4 w-4 mr-1 hidden sm:inline" />Gameplay</TabsTrigger>
                            <TabsTrigger value="machines"><Bot className="h-4 w-4 mr-1 hidden sm:inline" />Machines</TabsTrigger>
                            <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-1 hidden sm:inline" />Notes</TabsTrigger>
                        </TabsList>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="space-y-4 mt-4">
                            {/* Description */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        Description
                                        <Button variant="ghost" size="sm" onClick={() => startEdit("description", item.description || "")}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {editingField === "description" ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="min-h-[100px]"
                                                placeholder="Add a description..."
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => saveEdit("description")}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {item.description || "No description provided."}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Locations */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Stock Locations</CardTitle>
                                    <CardDescription>Where this item is stored</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {item.locations && item.locations.length > 0 ? (
                                            item.locations.map((loc, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{loc.name}</span>
                                                    </div>
                                                    <InlineEdit
                                                        field={`location_${idx}`}
                                                        value={loc.quantity}
                                                        type="number"
                                                        className="font-bold"
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">No locations defined</p>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                        <span className="font-medium">Total Stock</span>
                                        <Badge className={`${stockLevel.colorClass} text-white`}>{totalQty} units</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Info */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Quick Info</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Category</span>
                                        <p className="font-medium">{item.category}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Brand</span>
                                        <p className="font-medium">{item.brand || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Size</span>
                                        <p className="font-medium">{item.size || "N/A"}{item.subSize && ` (${item.subSize})`}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Type</span>
                                        <p className="font-medium">{item.type || "N/A"}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Low Stock Threshold</span>
                                        <p className="font-medium">
                                            <InlineEdit field="lowStockThreshold" value={item.lowStockThreshold || 0} type="number" />
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <p className="font-medium">
                                            {item.updatedAt ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true }) : "N/A"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Financials Tab */}
                        <TabsContent value="financials" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Financial Overview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <p className="text-sm text-green-600 dark:text-green-400">Total Inventory Value</p>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                                ${((item.value || item.supplyChain?.costPerUnit || 0) * totalQty).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                            <p className="text-sm text-blue-600 dark:text-blue-400">Cost Per Unit</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                ${item.supplyChain?.costPerUnit?.toFixed(2) || item.cost?.toFixed(2) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Estimated Retail Value</span>
                                            <span className="font-medium">${item.value?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Margin per Unit</span>
                                            <span className="font-medium">
                                                {item.value && item.supplyChain?.costPerUnit
                                                    ? `$${(item.value - item.supplyChain.costPerUnit).toFixed(2)}`
                                                    : "N/A"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Supply Chain Tab */}
                        <TabsContent value="supply" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Supply Chain</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Vendor</span>
                                            <p className="font-medium">{item.supplyChain?.vendor || "N/A"}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Reorder Point</span>
                                            <p className="font-medium">{item.supplyChain?.reorderPoint || item.lowStockThreshold || "N/A"} units</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Cost Per Unit</span>
                                            <p className="font-medium">${item.supplyChain?.costPerUnit?.toFixed(2) || "0.00"}</p>
                                        </div>
                                    </div>

                                    {/* Reorder Alert */}
                                    {totalQty <= (item.supplyChain?.reorderPoint || item.lowStockThreshold || 0) && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                                ⚠️ Stock is at or below reorder point. Consider placing an order.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Technical Specs Tab */}
                        <TabsContent value="technical" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Technical Specifications</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Weight</span>
                                        <span className="font-medium">
                                            {item.technicalSpecs?.weightGrams ? `${item.technicalSpecs.weightGrams}g` : "N/A"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Dimensions (L×W×H)</span>
                                        <span className="font-medium">
                                            {item.technicalSpecs?.dimensions
                                                ? `${item.technicalSpecs.dimensions.lengthCm}×${item.technicalSpecs.dimensions.widthCm}×${item.technicalSpecs.dimensions.heightCm} cm`
                                                : "N/A"
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-muted-foreground">Recommended Claw Strength</span>
                                        <span className="font-medium">
                                            {item.technicalSpecs?.recommendedClawStrength || "N/A"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Gameplay Tab */}
                        <TabsContent value="gameplay" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Gameplay Settings</CardTitle>
                                    <CardDescription>Prize win configuration</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <p className="text-sm text-purple-600 dark:text-purple-400">Play/Win Target</p>
                                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                                <InlineEdit field="playWinTarget" value={item.playWinTarget || 0} type="number" />
                                            </p>
                                        </div>
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <p className="text-sm text-indigo-600 dark:text-indigo-400">Expected Payout Rate</p>
                                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                                                {item.playWinTarget ? `${(100 / item.playWinTarget).toFixed(1)}%` : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payout Settings */}
                                    {item.payouts && item.payouts.length > 0 && (
                                        <div className="pt-4">
                                            <h4 className="text-sm font-medium mb-2">Payout Configuration</h4>
                                            <div className="space-y-2">
                                                {item.payouts.map((payout, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                                        {typeof payout === 'object' && payout !== null ? (
                                                            <>
                                                                <span className="text-sm">Play Cost: ${payout.playCost}</span>
                                                                <span className="text-sm font-medium">{payout.playsRequired} plays required</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm">Payout #{idx + 1}: {payout}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Machines Tab */}
                        <TabsContent value="machines" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Machine Assignments</CardTitle>
                                    <CardDescription>Where this item is currently in use</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignedMachines.length > 0 ? (
                                        <div className="space-y-3">
                                            {assignedMachines.map((machine) => (
                                                <div key={machine.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                    <a
                                                        href={`/machines/${machine.id}`}
                                                        className="font-medium text-primary hover:underline flex items-center gap-2"
                                                    >
                                                        <Bot className="h-4 w-4" />
                                                        {machine.name}
                                                    </a>
                                                    <div className="text-right text-sm">
                                                        {machine.slots.filter(s => s.currentItem?.id === item.id).map(s => (
                                                            <div key={s.id}>In use: <span className="font-semibold">{s.name}</span></div>
                                                        ))}
                                                        {machine.slots.filter(s => s.upcomingQueue?.some(u => u.itemId === item.id)).map(s => (
                                                            <div key={s.id} className="text-yellow-600">Queued: <span className="font-semibold">{s.name}</span></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-8">Not assigned to any machines.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Notes Tab */}
                        <TabsContent value="notes" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Notes</CardTitle>
                                    <CardDescription>Internal notes for this item</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Add notes about this item..."
                                        className="min-h-[150px]"
                                    />
                                    <Button className="mt-3" disabled>
                                        Save Notes (Coming Soon)
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar (1/3) */}
                <div className="space-y-6">
                    {/* Activity Log */}
                    <StockActivitySidebar
                        history={item.history}
                        onViewAll={() => setActiveTab("history")}
                    />

                    {/* Machine Assignment History */}
                    <MachineAssignmentHistory
                        item={item}
                        machines={machines}
                        onViewAll={() => setActiveTab("machines")}
                    />

                    {/* Metadata Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Metadata
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Item ID</span>
                                <span className="font-mono">{item.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span>
                                    {item.createdAt ? format(new Date(item.createdAt), "MMM d, yyyy") : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Updated</span>
                                <span>
                                    {item.updatedAt ? formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true }) : "N/A"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Stock Item</DialogTitle>
                        <DialogDescription>
                            Update details for {item.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <StockItemForm
                        initialData={item}
                        categories={categories}
                        machines={machines}
                        onSubmit={handleSaveItem}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                onConfirm={handleDeleteItem}
                title="Are you sure?"
                description={`This will permanently delete "${item.name}". This action cannot be undone.`}
                destructive
            />

            {/* Warning Alert */}
            <AlertDialog open={warningAlert.open} onOpenChange={(open) => setWarningAlert(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{warningAlert.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {warningAlert.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setWarningAlert(prev => ({ ...prev, open: false }))}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Status Change Confirmation */}
            <AlertDialog open={!!statusConfirm} onOpenChange={(open) => !open && setStatusConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to change status to &quot;{statusConfirm?.status}&quot;?
                            {statusConfirm?.item.assignedMachineId && " This may affect the machine's active item."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (statusConfirm) {
                                processStatusChange(statusConfirm.item, statusConfirm.status);
                                setStatusConfirm(null);
                            }
                        }}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Assignment Conflict Dialog */}
            <AlertDialog open={!!assignmentConflict} onOpenChange={(open) => !open && setAssignmentConflict(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Assignment Conflict</AlertDialogTitle>
                        <AlertDialogDescription>
                            {assignmentConflict?.currentUsingItem.name} is currently assigned as &quot;Using&quot; in this machine.
                            Do you want to swap them?
                            <br /><br />
                            • {assignmentConflict?.currentUsingItem.name} will become &quot;Replacement&quot;
                            <br />
                            • {assignmentConflict?.item.name} (this item) will become &quot;Using&quot;
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (assignmentConflict) {
                                // Swap logic
                                await processStatusChange(assignmentConflict.currentUsingItem, "Assigned for Replacement");
                                await processStatusChange(assignmentConflict.item, "Assigned");
                                setAssignmentConflict(null);
                                toast.success("Items Swapped", { description: "Active item swapped successfully." });
                            }
                        }}>
                            Confirm Swap
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Machine Assignment Dialog */}
            <Dialog open={isAssignMachineOpen} onOpenChange={setIsAssignMachineOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>
                            {assignmentMode === 'primary' ? 'Assign to Machine (Using)' : 'Assign for Replacement'}
                        </DialogTitle>
                        <DialogDescription>
                            {assignmentMode === 'primary'
                                ? 'Select a machine to assign this item as the active (Using) item.'
                                : 'Select a machine to add this item to the replacement queue.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Input
                            placeholder="Search machines..."
                            value={machineSearch}
                            onChange={(e) => setMachineSearch(e.target.value)}
                        />

                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-2">
                                {machines
                                    .filter(m => m.name.toLowerCase().includes(machineSearch.toLowerCase()))
                                    .map(machine => {
                                        const slotsToRender = (machine.slots && machine.slots.length > 0)
                                            ? machine.slots
                                            : [{ id: "slot-1", name: "Slot 1" }]; // Default slot if none

                                        return (
                                            <React.Fragment key={machine.id}>
                                                {slotsToRender.map((slot: any) => {
                                                    // Check if THIS slot is occupied
                                                    const isOccupied = items.some(
                                                        i =>
                                                            i.assignedMachineId === machine.id &&
                                                            i.assignedStatus === "Assigned" &&
                                                            (!i.assignedSlotId || i.assignedSlotId === slot.id)
                                                    );
                                                    const replacementCount = items.filter(
                                                        i =>
                                                            i.assignedMachineId === machine.id &&
                                                            i.assignedStatus === "Assigned for Replacement" &&
                                                            (!i.assignedSlotId || i.assignedSlotId === slot.id)
                                                    ).length;

                                                    return (
                                                        <Button
                                                            key={`${machine.id}-${slot.id}`}
                                                            variant="outline"
                                                            className={cn(
                                                                "w-full justify-start h-auto py-3 mb-2 transition-colors",
                                                                isOccupied
                                                                    ? "border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300"
                                                                    : "border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300"
                                                            )}
                                                            onClick={() => handleAssignMachine(machine.id, slot.id)}
                                                        >
                                                            <div className="flex flex-col items-start gap-1 w-full text-left">
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-medium flex items-center gap-1">
                                                                            {machine.name}
                                                                            {slot.name && (
                                                                                <span className="text-xs text-muted-foreground font-normal bg-background/80 px-1.5 py-0.5 rounded border border-border/50">
                                                                                    {slot.name}
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                        {isOccupied ? (
                                                                            <Badge
                                                                                variant="destructive"
                                                                                className="text-[10px] h-5 px-1.5"
                                                                            >
                                                                                Occupied
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-[10px] h-5 px-1.5 border-green-500 text-green-600 bg-green-50"
                                                                            >
                                                                                Available
                                                                            </Badge>
                                                                        )}
                                                                        {replacementCount > 0 && (
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="text-[10px] h-5 px-1.5"
                                                                            >
                                                                                Queue: {replacementCount}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    {machine.prizeSize && (
                                                                        <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                                                                            {machine.prizeSize}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-muted-foreground truncate w-full">
                                                                    Asset #{machine.assetTag} • {machine.location} •{" "}
                                                                    {machine.type || "Unknown Type"}
                                                                </span>
                                                            </div>
                                                        </Button>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Stock Level Change Dialog */}
            <Dialog open={!!pendingStockChange} onOpenChange={(open) => {
                if (!open) {
                    setPendingStockChange(null);
                    setRestockQuantity("0");
                    setOutOfStockMode("set-zero");
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pendingStockChange?.newLevel === "Out of Stock"
                                ? "Mark Item as Out of Stock"
                                : "Update Stock Status"}
                        </DialogTitle>
                        <DialogDescription>
                            {pendingStockChange?.newLevel === "Out of Stock"
                                ? "Choose how you want to handle the existing quantity for this item."
                                : `You're changing the stock status for ${pendingStockChange?.item.name}. Enter how many units are being restocked now.`}
                        </DialogDescription>
                    </DialogHeader>

                    {pendingStockChange?.newLevel === "Out of Stock" ? (
                        <div className="space-y-3">
                            <div className="flex flex-col gap-2">
                                <Label className="text-sm font-medium">Quantity behaviour</Label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            className="h-4 w-4"
                                            checked={outOfStockMode === "set-zero"}
                                            onChange={() => setOutOfStockMode("set-zero")}
                                        />
                                        <span>Set all locations to 0 (recommended)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="radio"
                                            className="h-4 w-4"
                                            checked={outOfStockMode === "keep-quantity"}
                                            onChange={() => setOutOfStockMode("keep-quantity")}
                                        />
                                        <span>Keep existing quantities, only change status</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Label htmlFor="restock-qty" className="text-sm font-medium">
                                Update Quantity
                            </Label>
                            <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200 mb-2">
                                Current quantity ({pendingStockChange?.item.locations.reduce((s, l) => s + l.quantity, 0)}) does not match &quot;{pendingStockChange?.newLevel}&quot;.
                                <br />
                                Please confirm the new quantity:
                            </div>
                            <Input
                                id="restock-qty"
                                type="number"
                                min={0}
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(e.target.value)}
                                placeholder="Enter quantity"
                            />
                            <p className="text-xs text-muted-foreground">
                                This will set the quantity for the first location and set others to 0.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPendingStockChange(null);
                                setRestockQuantity("0");
                                setOutOfStockMode("set-zero");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!pendingStockChange) return;
                                const { item, newLevel } = pendingStockChange;
                                try {
                                    let updatedItem: StockItem = { ...item };

                                    if (newLevel === "Out of Stock") {
                                        if (outOfStockMode === "set-zero") {
                                            updatedItem = {
                                                ...updatedItem,
                                                locations: updatedItem.locations.map(loc => ({
                                                    ...loc,
                                                    quantity: 0,
                                                })),
                                            };
                                        }
                                        updatedItem.stockStatus = "Out of Stock";
                                    } else {
                                        const qtyNum = Math.max(0, Number(restockQuantity) || 0);
                                        let locations = [...(updatedItem.locations || [])];

                                        if (locations.length === 0) {
                                            locations = [{ name: "Warehouse", quantity: qtyNum }];
                                        } else {
                                            locations = locations.map((loc, index) => ({
                                                ...loc,
                                                quantity: index === 0 ? qtyNum : 0
                                            }));
                                        }

                                        updatedItem = {
                                            ...updatedItem,
                                            locations,
                                            stockStatus: newLevel,
                                        };
                                    }

                                    const historyLog = createHistoryLog("STOCK_LEVEL_CHANGE", {
                                        oldStatus: item.stockStatus || "Unknown",
                                        newStatus: newLevel,
                                        quantitySetTo: newLevel === "Out of Stock" && outOfStockMode === "set-zero" ? 0 : restockQuantity,
                                        mode: outOfStockMode,
                                        changedBy: userProfile?.displayName || userProfile?.email || "Unknown",
                                        changedByRole: userProfile?.role || "Unknown"
                                    }, item.id);
                                    const updatedHistory = [...(updatedItem.history || []), historyLog];

                                    await stockService.update(item.id, {
                                        locations: updatedItem.locations,
                                        stockStatus: updatedItem.stockStatus,
                                        history: updatedHistory,
                                        updatedAt: new Date(),
                                    });

                                    toast.success("Stock Level Updated", { description: "Stock level has been updated." });
                                } catch (error) {
                                    console.error("Failed to update stock level with quantity:", error);
                                    toast.error("Error", { description: "Failed to update stock level." });
                                } finally {
                                    setPendingStockChange(null);
                                    setRestockQuantity("0");
                                    setOutOfStockMode("set-zero");
                                }
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Out of Stock Confirmation Dialog */}
            <AlertDialog open={isOutOfStockConfirmOpen} onOpenChange={setIsOutOfStockConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Out of Stock</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will set all location quantities to 0 and mark the item as Out of Stock.
                            Are you sure you want to continue?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!itemToSetOutOfStock) return;
                                const item = itemToSetOutOfStock;

                                try {
                                    const updatedItem: StockItem = {
                                        ...item,
                                        locations: item.locations.map(loc => ({
                                            ...loc,
                                            quantity: 0,
                                        })),
                                        stockStatus: "Out of Stock",
                                    };

                                    const historyLog = createHistoryLog("STOCK_LEVEL_CHANGE", {
                                        oldStatus: item.stockStatus || "Unknown",
                                        newStatus: "Out of Stock",
                                        quantitySetTo: 0,
                                        changedBy: userProfile?.displayName || userProfile?.email || "Unknown",
                                        changedByRole: userProfile?.role || "Unknown"
                                    }, item.id);
                                    const updatedHistory = [...(updatedItem.history || []), historyLog];

                                    await stockService.update(item.id, {
                                        locations: updatedItem.locations,
                                        stockStatus: updatedItem.stockStatus,
                                        history: updatedHistory,
                                        updatedAt: new Date(),
                                    });

                                    toast.success("Stock Level Updated", { description: "Item marked as Out of Stock with quantity set to 0." });
                                } catch (error) {
                                    console.error("Failed to update stock level:", error);
                                    toast.error("Error", { description: "Failed to update stock level." });
                                } finally {
                                    setIsOutOfStockConfirmOpen(false);
                                    setItemToSetOutOfStock(null);
                                }
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Pending Assignment Confirmation */}
            <AlertDialog open={!!pendingAssignment} onOpenChange={(open) => {
                if (!open) setPendingAssignment(null);
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Assignment</AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAssignment && (
                                <>
                                    {pendingAssignment.status === "Assigned" ? (
                                        <>
                                            Machine <strong>{pendingAssignment.machine.name}</strong> already has an active item.
                                            Continuing will replace it with this item.
                                        </>
                                    ) : (
                                        <>
                                            Machine <strong>{pendingAssignment.machine.name}</strong> already has items in the replacement queue.
                                            This item will be added to the queue.
                                        </>
                                    )}
                                    <br /><br />
                                    Do you want to continue?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (pendingAssignment) {
                                    await executeAssignment(
                                        pendingAssignment.machine,
                                        pendingAssignment.status,
                                        pendingAssignment.slotId
                                    );
                                    setPendingAssignment(null);
                                }
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Supervisor Override Dialog */}
            <AlertDialog open={!!supervisorOverride} onOpenChange={(open) => {
                if (!open) {
                    setSupervisorOverride(null);
                    setSupervisorPassword("");
                    setSupervisorError("");
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supervisor Override Required</AlertDialogTitle>
                        <AlertDialogDescription>
                            A supervisor must enter their password to complete this action.
                            <br />
                            Please ask a supervisor to enter the override password below.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="supervisor-password" className="text-sm font-medium">
                            Supervisor password
                        </Label>
                        <Input
                            id="supervisor-password"
                            type="password"
                            value={supervisorPassword}
                            onChange={(e) => setSupervisorPassword(e.target.value)}
                            placeholder="Enter supervisor password"
                        />
                        {supervisorError && (
                            <p className="text-xs text-destructive">{supervisorError}</p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!supervisorOverride) return;
                                if (supervisorPassword.trim().length < 4) {
                                    setSupervisorError("Password must be at least 4 characters.");
                                    return;
                                }

                                const item = supervisorOverride.item;
                                const action = supervisorOverride.action;

                                try {
                                    if (action === "downgrade-using-to-replacement") {
                                        const updates: Partial<StockItem> = {
                                            assignedStatus: "Not Assigned",
                                            assignedMachineId: undefined,
                                            assignedMachineName: undefined,
                                            updatedAt: new Date(),
                                        };
                                        await stockService.update(item.id, updates);
                                        toast.success("Status Updated", {
                                            description: "Item removed from machine and set to Not Assigned.",
                                        });
                                    } else if (action === "unassign") {
                                        await processStatusChange(item, "Not Assigned");
                                    }

                                    setSupervisorOverride(null);
                                    setSupervisorPassword("");
                                    setSupervisorError("");
                                } catch (error) {
                                    console.error("Supervisor override failed:", error);
                                    toast.error("Error", { description: "Failed to complete supervisor action." });
                                }
                            }}
                        >
                            Confirm Override
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}