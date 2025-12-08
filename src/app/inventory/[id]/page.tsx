"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { machineService, stockService } from "@/services";
import { useData } from "@/context/DataProvider";
import { AuditLog, StockItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Loader2, Package, DollarSign, Truck, Settings2, Gamepad2, Bot, StickyNote, Pencil, Warehouse, Info, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

    // Get item from context (auto-updates when data changes)
    const item = getItemById(id) || null;
    const loading = itemsLoading || machinesLoading;

    // Load categories and sizes for form
    useEffect(() => {
        const loadFormData = async () => {
            try {
                const categoriesData = await stockService.getUniqueCategories();
                setCategories(categoriesData);
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

    const handleChangeStockStatus = async (status: string) => {
        if (!item) return;
        try {
            await stockService.update(item.id, {
                stockStatus: status || undefined,
                updatedAt: new Date()
            });
            toast.success("Status Updated", { description: `Stock status changed to ${status || "Auto"}.` });
        } catch (error) {
            toast.error("Error", { description: "Failed to update status." });
        }
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

    const handleChangeAssignedStatus = async (status: string) => {
        if (!item) return;

        // Validation Logic from StockList
        if (status === "Assigned" || status === "Assigned for Replacement") {
            const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || item.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= item.lowStockThreshold || item.stockStatus === "Low Stock");

            if (isOut) {
                if (!hasRole(["manager", "admin"])) {
                    setWarningAlert({
                        open: true,
                        title: "Out of Stock",
                        description: `This item is out of stock and cannot be assigned by crew. Please ask a supervisor to assign it or update stock first.`,
                    });
                    return;
                } else {
                    setWarningAlert({
                        open: true,
                        title: "Supervisor Override - Out of Stock",
                        description: `This item is currently out of stock. As a supervisor you can still assign it, but machines may appear empty until stock is received.`,
                    });
                }
            } else if (isLow) {
                setWarningAlert({
                    open: true,
                    title: "Low Stock Warning",
                    description: `This item is low on stock. Assigning it now may cause the machine to run out soon.`,
                });
            }
        }

        // Handle changing from Replacement -> Using
        if (item.assignedStatus === "Assigned for Replacement" && status === "Assigned") {
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
        if (item.assignedStatus === "Assigned" && (status === "Not Assigned" || status === "Assigned for Replacement")) {
            if (status === "Assigned for Replacement") {
                setWarningAlert({
                    open: true,
                    title: "Status Change Warning",
                    description: `You are changing this item to "Replacement". It will remain assigned to ${item.assignedMachineName} but will no longer be the active item.`
                });
                await processStatusChange(item, status);
                return;
            }

            setStatusConfirm({ item, status });
            return;
        }

        // Normal path
        await processStatusChange(item, status);
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
                            Are you sure you want to change status to "{statusConfirm?.status}"?
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
                            {assignmentConflict?.currentUsingItem.name} is currently assigned as "Using" in this machine.
                            Do you want to swap them?
                            <br /><br />
                            • {assignmentConflict?.currentUsingItem.name} will become "Replacement"
                            <br />
                            • {assignmentConflict?.item.name} (this item) will become "Using"
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
        </div>
    );
}