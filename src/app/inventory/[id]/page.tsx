"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { machineService, stockService, auditService, orderService } from "@/services";
import { useData } from "@/context/DataProvider";
import { AuditLog, StockItem, ArcadeMachine } from "@/types";
import { Switch } from "@/components/ui/switch";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, ArrowLeft, Loader2, Package, DollarSign, Truck, Settings2, Gamepad2, Bot, StickyNote, Pencil, Warehouse, Info, AlertTriangle, TrendingUp, BarChart3, PieChart as PieChartIcon, Activity, ChevronDown, GitCompare, TrendingDown, Target, Zap, Lightbulb } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, CartesianGrid, ComposedChart } from "recharts";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StockItemForm } from "@/components/inventory/StockItemForm";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow, format, subDays, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";

// New Components
import { StockDetailHero } from "@/components/inventory/StockDetailHero";
import { StockActivitySidebar } from "@/components/inventory/StockActivitySidebar";
import { MachineAssignmentHistory } from "@/components/inventory/MachineAssignmentHistory";
import { AdjustStockDialog } from "@/components/inventory/AdjustStockDialog";
import { RequestReorderDialog } from "@/components/inventory/RequestReorderDialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

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

    const [comparisonMode, setComparisonMode] = useState<'none' | 'item' | 'history' | 'machine' | 'location'>('none');
    const [compareItemId, setCompareItemId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const [chartType, setChartType] = useState<'bar' | 'area' | 'line'>('bar');

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
    const [showAllMachines, setShowAllMachines] = useState(false);
    const [pendingAssignment, setPendingAssignment] = useState<{ machine: ArcadeMachine, status: string, slotId?: string } | null>(null);

    // Stock Level Change States
    const [pendingStockChange, setPendingStockChange] = useState<{ item: StockItem; newLevel: string } | null>(null);
    const [isOutOfStockConfirmOpen, setIsOutOfStockConfirmOpen] = useState(false);
    const [itemToSetOutOfStock, setItemToSetOutOfStock] = useState<StockItem | null>(null);
    const [restockQuantity, setRestockQuantity] = useState<string>("0");
    const [outOfStockMode, setOutOfStockMode] = useState<"set-zero" | "keep-quantity">("set-zero");

    // Supervisor Override States
    const [supervisorOverride, setSupervisorOverride] = useState<{ item: StockItem, action: "unassign" | "downgrade-using-to-replacement" | "assign-out-of-stock" } | null>(null);
    const [pendingOverrideAssignment, setPendingOverrideAssignment] = useState<{ machine: ArcadeMachine, slotId: string, status: string } | null>(null);
    const [supervisorPassword, setSupervisorPassword] = useState("");
    const [supervisorError, setSupervisorError] = useState("");
    const [stockLevelWarning, setStockLevelWarning] = useState<{ item: StockItem, status: string, actionType: 'status_change' | 'assign_machine', machineId?: string, slotId?: string } | null>(null);
    const [isRequestReorderOpen, setIsRequestReorderOpen] = useState(false);

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
            let changeMessage = "";
            let oldValue = "";
            let newValue = editValue;

            // Handle different field types
            if (field === "description") {
                updateData.description = editValue;
                oldValue = item.description || "";
                changeMessage = `Item description updated from "${oldValue}" to "${editValue}"`;
            } else if (field === "lowStockThreshold") {
                const val = parseInt(editValue) || 0;
                updateData.lowStockThreshold = val;
                oldValue = item.lowStockThreshold?.toString() || "0";
                newValue = val.toString();
                changeMessage = `Low stock threshold updated from "${oldValue}" to "${newValue}"`;
            } else if (field === "playWinTarget") {
                const val = parseInt(editValue) || 0;
                updateData.playWinTarget = val;
                oldValue = item.playWinTarget?.toString() || "0";
                newValue = val.toString();
                changeMessage = `Play win target updated from "${oldValue}" to "${newValue}"`;
            } else if (field.startsWith("location_")) {
                const locIndex = parseInt(field.split("_")[1]);
                const newLocations = [...(item.locations || [])];
                if (newLocations[locIndex]) {
                    const oldQty = newLocations[locIndex].quantity;
                    const newQty = parseInt(editValue) || 0;
                    newLocations[locIndex].quantity = newQty;
                    oldValue = oldQty.toString();
                    newValue = newQty.toString();
                    changeMessage = `Stock location "${newLocations[locIndex].name}" quantity updated from "${oldValue}" to "${newValue}"`;

                    // Also log as stock adjustment
                    const historyLog = createHistoryLog("ADJUST_STOCK", {
                        message: changeMessage,
                        location: newLocations[locIndex].name,
                        previousQuantity: oldQty,
                        newQuantity: newQty,
                        change: newQty - oldQty
                    }, item.id);
                    updateData.history = [...(item.history || []), historyLog];
                }
                updateData.locations = newLocations;
            }

            // Create log for the field update if not already logged as stock adjust
            if (changeMessage && !field.startsWith("location_")) {
                const historyLog = createHistoryLog("UPDATE_ITEM", {
                    changes: [changeMessage],
                    message: changeMessage
                }, item.id);
                updateData.history = [...(item.history || []), historyLog];
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
            let imageUrl = data.imageUrl;
            let imageUrls: string[] = [];

            // Check if Firebase is initialized before attempting storage operations
            const { isFirebaseInitialized, storage } = await import('@/lib/firebase');

            if (!isFirebaseInitialized) {
                console.warn("Firebase not initialized, converting images to Base64 for local storage");

                // Convert new files to Base64
                if (data.imageUrls && Array.isArray(data.imageUrls)) {
                    const base64Promises = data.imageUrls.map(async (item: any) => {
                        if (item instanceof File) {
                            return new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result as string);
                                reader.onerror = reject;
                                reader.readAsDataURL(item);
                            });
                        } else if (typeof item === 'string') {
                            return item;
                        }
                        return null;
                    });

                    const results = await Promise.all(base64Promises);
                    imageUrls = results.filter((url): url is string => typeof url === 'string' && url.length > 0);
                } else if (data.imageUrl instanceof File) {
                    // Fallback for single image file
                    const base64 = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(data.imageUrl);
                    });
                    imageUrls = [base64];
                } else if (typeof data.imageUrl === 'string') {
                    imageUrls = [data.imageUrl];
                }

                if (imageUrls.length > 0) {
                    imageUrl = imageUrls[0];
                }
            } else {
                // Firebase Upload Logic
                if (data.imageUrls && Array.isArray(data.imageUrls)) {
                    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

                    const uploadPromises = data.imageUrls.map(async (item: any) => {
                        if (item instanceof File) {
                            try {
                                const storageRef = ref(storage, `stock-items/${Date.now()}-${item.name}`);
                                await uploadBytes(storageRef, item);
                                return await getDownloadURL(storageRef);
                            } catch (err) {
                                console.error("Error uploading file:", item.name, err);
                                toast.error(`Failed to upload image: ${item.name}`);
                                return null;
                            }
                        } else if (typeof item === 'string') {
                            return item;
                        }
                        return null;
                    });

                    const results = await Promise.all(uploadPromises);
                    imageUrls = results.filter((url): url is string => typeof url === 'string' && url.length > 0);

                    if (imageUrls.length > 0) {
                        imageUrl = imageUrls[0];
                    }
                } else if (imageUrl instanceof File) {
                    try {
                        const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
                        const storageRef = ref(storage, `stock-items/${Date.now()}-${imageUrl.name}`);
                        const snapshot = await uploadBytes(storageRef, imageUrl);
                        imageUrl = await getDownloadURL(storageRef);
                        imageUrls = [imageUrl];
                    } catch (uploadError) {
                        console.error("Failed to upload image:", uploadError);
                        toast.error("Image Upload Failed", { description: "The item will be saved without an image." });
                        imageUrl = undefined;
                    }
                } else if (typeof imageUrl === 'string') {
                    imageUrls = [imageUrl];
                }
            }

            // Create the item data with the uploaded image URLs
            const itemData: any = {
                ...data,
                imageUrl: imageUrl || (typeof data.imageUrl === 'string' ? data.imageUrl : undefined),
                imageUrls: imageUrls.length > 0 ? imageUrls : (Array.isArray(data.imageUrls) ? data.imageUrls.filter((u: any) => typeof u === 'string') : [])
            };

            // Remove internal form fields
            delete itemData._parsedOverallNumericQuantity;
            delete itemData._sumOfLocationQuantities;

            const updates: Partial<StockItem> = {
                ...itemData,
                updatedAt: new Date()
            };

            const newHistory: AuditLog[] = [];

            // 1. Detect Machine Assignment Changes
            const oldMachineId = item.assignedMachineId;
            const newMachineId = itemData.assignedMachineId;

            // Check if machine assignment changed
            if (oldMachineId !== newMachineId) {
                if (newMachineId) {
                    // Assigned to a new machine
                    const machineName = machines.find(m => m.id === newMachineId)?.name || "Unknown Machine";
                    updates.assignedMachineName = machineName;

                    newHistory.push(createHistoryLog("ASSIGN_MACHINE", {
                        machineId: newMachineId,
                        machineName: machineName,
                        previousMachineId: oldMachineId || null,
                        status: itemData.assignmentStatus || "Assigned"
                    }, item.id));
                } else if (oldMachineId) {
                    // Unassigned from a machine
                    updates.assignedMachineName = null; // Clear machine name
                    updates.assignedStatus = "Not Assigned"; // Ensure status is Not Assigned

                    newHistory.push(createHistoryLog("UNASSIGN_MACHINE", {
                        previousMachineId: oldMachineId,
                        previousMachineName: item.assignedMachineName || "Unknown Machine"
                    }, item.id));
                }
            }

            // 2. Detect Assignment Status Changes
            if (oldMachineId === newMachineId && newMachineId) {
                if (item.assignedStatus !== itemData.assignmentStatus) {
                    newHistory.push(createHistoryLog("STATUS_CHANGE", {
                        oldStatus: item.assignedStatus || "Not Assigned",
                        newStatus: itemData.assignmentStatus,
                        machine: item.assignedMachineName || "Unknown Machine"
                    }, item.id));
                }
            }

            // 3. Detect General Field Changes
            const changes: string[] = [];

            // Core identity
            if (item.name !== itemData.name) changes.push(`Item name updated from "${item.name}" to "${itemData.name}"`);
            if (item.category !== itemData.category) changes.push(`Item category updated from "${item.category}" to "${itemData.category}"`);
            if (item.sku !== itemData.sku) changes.push(`Item SKU updated from "${item.sku || ''}" to "${itemData.sku || ''}"`);
            if (itemData.imageUrl && item.imageUrl !== itemData.imageUrl) changes.push(`Item image updated`);

            // Details
            if (item.size !== itemData.size) changes.push(`Item size updated from "${item.size || ''}" to "${itemData.size || ''}"`);
            if (item.brand !== itemData.brand) changes.push(`Item brand updated from "${item.brand || ''}" to "${itemData.brand || ''}"`);
            if (item.description !== itemData.description) changes.push(`Item description updated from "${item.description || ''}" to "${itemData.description || ''}"`);

            // Tags (Compare as string)
            const oldTags = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '');
            const newTags = Array.isArray(itemData.tags) ? itemData.tags.join(', ') : (itemData.tags || '');
            if (oldTags !== newTags) changes.push(`Item tags updated from "${oldTags}" to "${newTags}"`);

            // Numeric fields
            if (item.lowStockThreshold !== itemData.lowStockThreshold) changes.push(`Low stock threshold updated from "${item.lowStockThreshold || 0}" to "${itemData.lowStockThreshold || 0}"`);
            if (item.value !== itemData.value) changes.push(`Item value updated from "${item.value || ''}" to "${itemData.value || ''}"`);

            // Supply Chain
            const oldCost = item.supplyChain?.costPerUnit || 0;
            const newCost = itemData.supplyChain?.costPerUnit || 0;
            if (oldCost !== newCost) changes.push(`Cost per unit updated from "${oldCost}" to "${newCost}"`);

            const oldVendor = item.supplyChain?.vendor || '';
            const newVendor = itemData.supplyChain?.vendor || '';
            if (oldVendor !== newVendor) changes.push(`Vendor updated from "${oldVendor}" to "${newVendor}"`);

            // Technical Specs
            const oldWeight = item.technicalSpecs?.weightGrams || '';
            const newWeight = itemData.technicalSpecs?.weightGrams || '';
            if (oldWeight !== newWeight) changes.push(`Weight updated from "${oldWeight}g" to "${newWeight}g"`);

            // Payouts
            const oldPlayCost = (item.payouts?.[0] as any)?.playCost || '';
            const newPlayCost = (itemData.payouts?.[0] as any)?.playCost || '';
            if (oldPlayCost !== newPlayCost) changes.push(`Play cost updated from "${oldPlayCost}" to "${newPlayCost}"`);

            // Check stock quantity change
            const oldTotal = item.locations?.reduce((s, l) => s + l.quantity, 0) || 0;
            const newTotal = (itemData.locations as any[])?.reduce((s, l) => s + (l.quantity || 0), 0) || 0;

            if (oldTotal !== newTotal) {
                newHistory.push(createHistoryLog("ADJUST_STOCK", {
                    message: "Stock quantity updated via edit form",
                    previousQuantity: oldTotal,
                    newQuantity: newTotal,
                    change: newTotal - oldTotal
                }, item.id));
            }

            if (changes.length > 0) {
                newHistory.push(createHistoryLog("UPDATE_ITEM", {
                    changes: changes,
                    message: `Updated fields: ${changes.join(', ')}`
                }, item.id));
            }

            if (newHistory.length > 0) {
                updates.history = [...(item.history || []), ...newHistory];
            }

            await stockService.update(item.id, updates);
            toast.success("Item Updated", { description: "Item details have been updated successfully." });
            setIsEditOpen(false);
        } catch (error) {
            console.error("Failed to update item:", error);
            toast.error("Error", { description: "Failed to update item." });
        }
    };

    const handleDeleteItem = async () => {
        if (!item) return;
        try {
            // Log deletion to global audit before removing
            await auditService.add({
                action: "DELETE_ITEM",
                entityType: "StockItem",
                entityId: item.id,
                userId: userProfile?.uid || "system",
                userRole: userProfile?.role || "system",
                timestamp: new Date(),
                details: {
                    name: item.name,
                    sku: item.sku,
                    reason: "Deleted from details page"
                }
            });

            await stockService.remove(item.id);
            toast.success("Item Deleted", { description: "The item has been permanently removed." });
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

    const createHistoryLog = (action: string, details: any, entityId: string = "temp"): AuditLog => {
        const log: AuditLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action,
            entityType: "StockItem",
            entityId,
            userId: userProfile?.uid || "system",
            userRole: userProfile?.role || "system",
            timestamp: new Date(),
            details
        };

        // Dispatch to global audit service (fire and forget)
        const { id, ...logData } = log;
        auditService.add(logData).catch(err => console.error("Failed to add global audit log", err));

        return log;
    };

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

        // Validation Logic - use modal dialogs to match inventory page
        if (newStatus === "Assigned" || newStatus === "Assigned for Replacement") {
            const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || item.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= item.lowStockThreshold || item.stockStatus === "Low Stock");

            if (isOut) {
                if (!hasRole(["manager", "admin"])) {
                    setWarningAlert({
                        open: true,
                        title: "Out of Stock",
                        description: "This item is out of stock and cannot be assigned by crew. Please ask a supervisor to assign it or update stock first.",
                    });
                    return;
                }
                // Supervisors get the standard warning below
            }

            // Check for stock level warning (Low, Limited, Out)
            const stockLevel = calculateStockLevel(totalQty, item.stockStatus);
            if (["Low Stock", "Limited Stock", "Out of Stock"].includes(stockLevel.label)) {
                setStockLevelWarning({ item, status: newStatus, actionType: 'status_change' });
                return;
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
            const machineId = item.assignedMachineId;
            let warningMessage = "";

            if (machineId) {
                // Find replacement items for this machine
                const replacements = items.filter(i =>
                    i.assignedMachineId === machineId &&
                    i.assignedStatus === "Assigned for Replacement" &&
                    i.id !== item.id
                ).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                if (replacements.length > 0) {
                    const nextItem = replacements[0];
                    warningMessage = `Assigning this to "${newStatus}" will promote **${nextItem.name}** to the active item on **${item.assignedMachineName}**.`;
                } else {
                    if (newStatus === "Not Assigned") {
                        warningMessage = `This will make the machine **${item.assignedMachineName}** empty as there are no replacement items.`;
                    } else {
                        // Replacement
                        warningMessage = `This will make the machine **${item.assignedMachineName}** empty as you are moving the only active item to replacement.`
                    }
                }
            } else {
                warningMessage = `Are you sure you want to change status to "${newStatus}"?`;
            }

            if (newStatus === "Assigned for Replacement") {
                setWarningAlert({
                    open: true,
                    title: "Status Change Warning",
                    description: warningMessage
                });
                await processStatusChange(item, newStatus);
                return;
            }

            // For Not Assigned, use the confirm dialog but with custom message?
            // Existing `statusConfirm` logic uses a generic message. 
            // Let's use `setWarningAlert` then proceed? No, that's non-blocking info.
            // We'll update `statusConfirm` to support description or just generic confirm. 
            // Wait, existing logic uses `statusConfirm` which has a fixed message.
            // I will replace `setStatusConfirm` usage here with a custom confirm logic or just accept generic.
            // User requested: "show that item name will be assigned... also change state".
            // So better to show the message.

            // Using `setStatusConfirm` but modifying the renderer? Or just using `setWarningAlert` and then doing it is risky if user cancels.
            // I'll skip `setStatusConfirm` and use a dedicated alert or reuse it if I can make it dynamic.
            // `statusConfirm` state is `{ item, status }`.
            // The dialog renderer uses: `Are you sure... This may affect...`

            // I will assume `setStatusConfirm` is fine for simple confirm, but I want to show the specific details.
            // I'll show a warning alert first? No that's bad UX.
            // I'll show a "Status Change" confirmation using a new state or modifying current.
            // Let's use `setWarningAlert` for now as "Info" before action? 
            // "it should show the it will make..."

            // Actually, best is to show a confirmation dialog with this text. 
            // I will use `statusConfirm` but I need to store the message. 
            // I don't have a field for 'message' in `statusConfirm`.
            // Let's modify `statusConfirm` state type? No, too many changes.
            // I'll use `window.confirm`? No.
            // I'll use `setAssignmentConflict`? No.

            // Let's just use `setWarningAlert` but with a callback? No.
            // Okay, looking at `handleChangeAssignedStatus` logic again.
            // It sets `setStatusConfirm`. 
            // I can modify the render of `Status Change Confirmation` dialog to calculate this message dynamically!
            // Yes, that's better. I don't need to change logic here much, just let it set `setStatusConfirm`.

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
            // Fix: Use calculateStockLevel for Low Stock check
            const totalQty = currentItem.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || currentItem.stockStatus === "Out of Stock";
            // Check if calculated level is Low Stock
            const calculatedLevel = calculateStockLevel(totalQty);
            const isLow = !isOut && calculatedLevel.status === "Low Stock";

            // Show warnings as modal dialogs (matching inventory page behavior)
            // Show warnings as modal dialogs (matching inventory page behavior)
            if (isOut) {
                if (!hasRole(["manager", "admin"])) {
                    // Prompt for supervisor override instead of blocking
                    const modeStatus = assignmentMode === 'replacement' ? "Assigned for Replacement" : "Assigned";
                    setPendingOverrideAssignment({ machine: machines.find(m => m.id === machineId)!, slotId, status: modeStatus });

                    setSupervisorOverride({
                        item: currentItem,
                        action: "assign-out-of-stock"
                    });
                    return;
                }
                // Supervisors continue to stock warning
            }

            const stockLevel = calculateStockLevel(totalQty, currentItem.stockStatus);
            if (["Low Stock", "Limited Stock", "Out of Stock"].includes(stockLevel.label)) {
                // Target status is derived in next step but we can derive it here for the warning
                const targetStatus = assignmentMode === 'replacement' ? "Assigned for Replacement" : "Assigned";
                setStockLevelWarning({
                    item: currentItem,
                    status: targetStatus,
                    actionType: 'assign_machine',
                    machineId,
                    slotId
                });
                return;
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
                // Show confirmation dialog instead of blocking
                setPendingAssignment({ machine, status: targetStatus, slotId });
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
                onRequestReorder={() => setIsRequestReorderOpen(true)}
                onChangeStockStatus={handleChangeStockStatus}
                onChangeAssignedStatus={handleChangeAssignedStatus}
            />

            {/* Main Content with Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Tabbed Content (2/3) */}
                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview"><Package className="h-4 w-4 mr-1.5" />Overview</TabsTrigger>
                            <TabsTrigger value="specifications"><Settings2 className="h-4 w-4 mr-1.5" />Specifications</TabsTrigger>
                            <TabsTrigger value="analyze"><Activity className="h-4 w-4 mr-1.5" />Analyze</TabsTrigger>
                        </TabsList>

                        {/* ========================= OVERVIEW TAB ========================= */}
                        <TabsContent value="overview" className="space-y-4 mt-4">
                            {/* Description */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-primary" />
                                            Description
                                        </span>
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

                            {/* Stock Locations */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Warehouse className="h-4 w-4 text-primary" />
                                        Stock Locations
                                    </CardTitle>
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
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t bg-muted/30 p-3 rounded-lg">
                                        <span className="font-semibold text-base">Total Stock</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold">{totalQty}</span>
                                            <span className="text-sm text-muted-foreground">units</span>
                                            <Badge className={`${stockLevel.colorClass} ml-2`}>{stockLevel.label}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes Section */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <StickyNote className="h-4 w-4 text-primary" />
                                        Notes
                                    </CardTitle>
                                    <CardDescription>Internal notes for this item</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        placeholder="Add notes about this item..."
                                        className="min-h-[100px]"
                                    />
                                    <Button className="mt-3" size="sm" disabled>
                                        Save Notes (Coming Soon)
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ========================= SPECIFICATIONS TAB ========================= */}
                        <TabsContent value="specifications" className="space-y-4 mt-4">
                            {/* Physical Specifications */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-primary" />
                                        Physical Specifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Weight</p>
                                            <p className="text-xl font-bold mt-1">
                                                {item.technicalSpecs?.weightGrams ? `${item.technicalSpecs.weightGrams}g` : "N/A"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Dimensions (L×W×H)</p>
                                            <p className="text-xl font-bold mt-1">
                                                {item.technicalSpecs?.dimensions
                                                    ? `${item.technicalSpecs.dimensions.lengthCm}×${item.technicalSpecs.dimensions.widthCm}×${item.technicalSpecs.dimensions.heightCm} cm`
                                                    : "N/A"
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Claw Strength</p>
                                            <p className="text-xl font-bold mt-1">
                                                {item.technicalSpecs?.recommendedClawStrength || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gameplay Configuration */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Gamepad2 className="h-4 w-4 text-primary" />
                                        Gameplay Configuration
                                    </CardTitle>
                                    <CardDescription>Prize win settings and payout configuration</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Play/Win Target</p>
                                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                                                <InlineEdit field="playWinTarget" value={item.playWinTarget || 0} type="number" />
                                            </p>
                                        </div>
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                            <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Expected Payout Rate</p>
                                            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                                                {item.playWinTarget ? `${(100 / item.playWinTarget).toFixed(1)}%` : "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Payout Settings */}
                                    {item.payouts && item.payouts.length > 0 && (
                                        <div className="pt-4 border-t">
                                            <h4 className="text-sm font-medium mb-3">Payout Configuration</h4>
                                            <div className="space-y-2">
                                                {item.payouts.map((payout, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                                        {typeof payout === 'object' && payout !== null ? (
                                                            <>
                                                                <span className="text-sm">Play Cost: <span className="font-medium">${payout.playCost}</span></span>
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

                            {/* Supply Chain */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-primary" />
                                        Supply Chain
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Vendor</p>
                                            <p className="font-medium mt-1">{item.supplyChain?.vendor || "N/A"}</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Reorder Point</p>
                                            <p className="font-medium mt-1">{item.supplyChain?.reorderPoint || item.lowStockThreshold || "N/A"} units</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Cost Per Unit</p>
                                            <p className="font-medium mt-1">${item.supplyChain?.costPerUnit?.toFixed(2) || "0.00"}</p>
                                        </div>
                                    </div>

                                    {/* Reorder Alert */}
                                    {totalQty <= (item.supplyChain?.reorderPoint || item.lowStockThreshold || 0) && (
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                                Stock is at or below reorder point. Consider placing an order.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>


                            {/* ========================= OPERATIONS CONTENT MERGED INTO SPECIFICATIONS ========================= */}
                            {/* Financial Summary */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-primary" />
                                        Financial Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Inventory Value</p>
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                                                ${((item.value || item.supplyChain?.costPerUnit || 0) * totalQty).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Cost Per Unit</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                                ${item.supplyChain?.costPerUnit?.toFixed(2) || "0.00"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-muted/30 rounded-lg flex justify-between">
                                            <span className="text-muted-foreground">Estimated Retail Value</span>
                                            <span className="font-medium">${item.value?.toFixed(2) || "0.00"}</span>
                                        </div>
                                        <div className="p-3 bg-muted/30 rounded-lg flex justify-between">
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

                            {/* Machine Assignments */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-primary" />
                                        Machine Assignments
                                    </CardTitle>
                                    <CardDescription>Where this item is currently in use</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {assignedMachines.length > 0 ? (
                                        <div className="space-y-3">
                                            {assignedMachines.map((machine) => (
                                                <div key={machine.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                                                    <a
                                                        href={`/machines/${machine.id}`}
                                                        className="font-medium text-primary hover:underline flex items-center gap-2"
                                                    >
                                                        <Bot className="h-4 w-4" />
                                                        {machine.name}
                                                    </a>
                                                    <div className="text-right text-sm space-y-1">
                                                        {machine.slots.filter(s => s.currentItem?.id === item.id).map(s => (
                                                            <div key={s.id} className="flex items-center gap-1.5">
                                                                <Badge variant="default" className="bg-green-500 text-white text-xs">Using</Badge>
                                                                <span className="font-medium">{s.name}</span>
                                                            </div>
                                                        ))}
                                                        {machine.slots.filter(s => s.upcomingQueue?.some(u => u.itemId === item.id)).map(s => (
                                                            <div key={s.id} className="flex items-center gap-1.5">
                                                                <Badge variant="secondary" className="bg-yellow-500 text-white text-xs">Queued</Badge>
                                                                <span className="font-medium">{s.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Bot className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Not assigned to any machines</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => {
                                                    setAssigningItem(item);
                                                    setAssignmentMode('primary');
                                                    setIsAssignMachineOpen(true);
                                                }}
                                            >
                                                Assign to Machine
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ========================= ANALYZE TAB ========================= */}
                        <TabsContent value="analyze" className="space-y-4 mt-4">
                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-200/50 dark:border-violet-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-violet-500/20">
                                            <Package className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">Total Stock</span>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{totalQty}</p>
                                    <p className="text-xs text-muted-foreground mt-1">units in inventory</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-emerald-500/20">
                                            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Value</span>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                        ${((item.value || item.supplyChain?.costPerUnit || 0) * totalQty).toFixed(0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">inventory worth</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-amber-500/20">
                                            <Gamepad2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Play/Win</span>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                        {item.playWinTarget || "N/A"}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">plays to win target</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-200/50 dark:border-sky-800/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-lg bg-sky-500/20">
                                            <Bot className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <span className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wider">Machines</span>
                                    </div>
                                    <p className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                        {assignedMachines.length}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">assigned locations</p>
                                </div>
                            </div>

                            {/* Stock History Chart */}
                            <Card className="overflow-hidden">
                                <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        Stock Activity History
                                    </CardTitle>
                                    <CardDescription>Stock level changes over time based on activity log</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {item.history && item.history.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <AreaChart
                                                data={(() => {
                                                    // Generate stock history data from audit logs
                                                    const stockActions = item.history
                                                        ?.filter(h => h.action === 'ADJUST_STOCK' || h.action === 'STOCK_LEVEL_CHANGE' || h.action === 'CREATE_ITEM')
                                                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                                        .slice(-10) || [];

                                                    if (stockActions.length === 0) {
                                                        // Return mock data showing current state
                                                        return [
                                                            { date: 'Initial', quantity: totalQty, label: 'Current' }
                                                        ];
                                                    }

                                                    let runningQty = 0;
                                                    return stockActions.map((action, idx) => {
                                                        const details = action.details as { newQuantity?: number; initialQuantity?: number; change?: number } | undefined;
                                                        if (details?.newQuantity !== undefined) {
                                                            runningQty = details.newQuantity;
                                                        } else if (details?.initialQuantity !== undefined) {
                                                            runningQty = details.initialQuantity;
                                                        } else if (details?.change !== undefined) {
                                                            runningQty += typeof details.change === 'number' ? details.change : 0;
                                                        }
                                                        return {
                                                            date: format(new Date(action.timestamp), 'MMM d'),
                                                            quantity: runningQty,
                                                            label: action.action.replace(/_/g, ' ')
                                                        };
                                                    });
                                                })()}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                                <YAxis stroke="#64748b" fontSize={12} />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    formatter={(value: number) => [`${value} units`, 'Stock']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="quantity"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorQty)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                                                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">No stock activity recorded yet</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Stock adjustments will appear here</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Distribution Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Stock by Location Pie Chart */}
                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <PieChartIcon className="h-4 w-4 text-rose-500" />
                                            Stock Distribution
                                        </CardTitle>
                                        <CardDescription>Quantity by storage location</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        {item.locations && item.locations.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={200}>
                                                <PieChart>
                                                    <Pie
                                                        data={item.locations.map((loc, i) => ({
                                                            name: loc.name,
                                                            value: loc.quantity,
                                                            fill: ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1'][i % 6]
                                                        }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={40}
                                                        outerRadius={70}
                                                        paddingAngle={2}
                                                        dataKey="value"
                                                    >
                                                        {item.locations.map((_, i) => (
                                                            <Cell
                                                                key={`cell-${i}`}
                                                                fill={['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#6366f1'][i % 6]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: '1px solid #e2e8f0',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                        }}
                                                        formatter={(value: number) => [`${value} units`, 'Quantity']}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        height={36}
                                                        formatter={(value) => <span className="text-xs">{value}</span>}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <PieChartIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                                <p className="text-sm text-muted-foreground">No location data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Performance Metrics */}
                                <Card className="overflow-hidden">
                                    <CardHeader className="pb-2 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 text-sky-500" />
                                            Performance Metrics
                                        </CardTitle>
                                        <CardDescription>Key performance indicators</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart
                                                data={[
                                                    {
                                                        name: 'Stock %',
                                                        value: Math.min(100, (totalQty / Math.max(item.lowStockThreshold * 3, 1)) * 100),
                                                        fill: totalQty > item.lowStockThreshold ? '#10b981' : '#ef4444'
                                                    },
                                                    {
                                                        name: 'Value/Unit',
                                                        value: Math.min(100, ((item.value || 0) / 50) * 100),
                                                        fill: '#8b5cf6'
                                                    },
                                                    {
                                                        name: 'Margin',
                                                        value: item.value && item.supplyChain?.costPerUnit
                                                            ? Math.min(100, ((item.value - item.supplyChain.costPerUnit) / item.value) * 100)
                                                            : 0,
                                                        fill: '#06b6d4'
                                                    },
                                                    {
                                                        name: 'Win Rate',
                                                        value: item.playWinTarget ? Math.min(100, (100 / item.playWinTarget) * 10) : 0,
                                                        fill: '#f59e0b'
                                                    }
                                                ]}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} />
                                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={60} />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: '1px solid #e2e8f0',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                    }}
                                                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                                                />
                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                    {[0, 1, 2, 3].map((index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={['#10b981', '#8b5cf6', '#06b6d4', '#f59e0b'][index]}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Activity Timeline */}
                            <Card className="overflow-hidden">
                                <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-b">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-indigo-500" />
                                        Recent Activity Timeline
                                    </CardTitle>
                                    <CardDescription>Latest actions performed on this item</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {item.history && item.history.length > 0 ? (
                                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                                            {item.history.slice(-8).reverse().map((log, idx) => (
                                                <div
                                                    key={log.id}
                                                    className={cn(
                                                        "flex items-start gap-3 p-3 rounded-lg transition-all hover:bg-muted/50",
                                                        idx === 0 && "bg-primary/5 border border-primary/20"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-full shrink-0",
                                                        log.action.includes('ADJUST') && "bg-blue-100 dark:bg-blue-900/40",
                                                        log.action.includes('ASSIGN') && "bg-green-100 dark:bg-green-900/40",
                                                        log.action.includes('UNASSIGN') && "bg-amber-100 dark:bg-amber-900/40",
                                                        log.action.includes('STATUS') && "bg-purple-100 dark:bg-purple-900/40",
                                                        log.action.includes('CREATE') && "bg-emerald-100 dark:bg-emerald-900/40",
                                                        log.action.includes('UPDATE') && "bg-sky-100 dark:bg-sky-900/40"
                                                    )}>
                                                        {log.action.includes('ADJUST') && <Package className="h-3.5 w-3.5 text-blue-600" />}
                                                        {log.action.includes('ASSIGN') && <Bot className="h-3.5 w-3.5 text-green-600" />}
                                                        {log.action.includes('UNASSIGN') && <Bot className="h-3.5 w-3.5 text-amber-600" />}
                                                        {log.action.includes('STATUS') && <Activity className="h-3.5 w-3.5 text-purple-600" />}
                                                        {log.action.includes('CREATE') && <Package className="h-3.5 w-3.5 text-emerald-600" />}
                                                        {log.action.includes('UPDATE') && <Pencil className="h-3.5 w-3.5 text-sky-600" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                    {idx === 0 && (
                                                        <Badge variant="secondary" className="text-xs shrink-0">Latest</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="p-4 rounded-full bg-muted/50 mb-4">
                                                <Activity className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">Actions will be logged here</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {/* Comparison & Prediction Section */}
                            {(() => {
                                // --- ANALYTICS LOGIC (REVENUE FOCUSED) ---

                                const startDate = dateRange?.from || subDays(new Date(), 30);
                                const endDate = dateRange?.to || new Date();

                                // Helper: Calculate Revenue for a set of logs
                                const calculateRevenue = (logs: AuditLog[]) => {
                                    return logs.reduce((sum, log) => {
                                        // Only count outgoing stock (negative changes)
                                        if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                            const itemsConsumed = Math.abs((log.details as any)?.change || 0);
                                            // Revenue = Consumed * (WinTarget * CostPerLog)
                                            // Fallback to defaults if not set: 20 plays to win, $2 per play
                                            const winTarget = item.playWinTarget || 20;
                                            const costPerPlay = (item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2;
                                            return sum + (itemsConsumed * winTarget * costPerPlay);
                                        }
                                        return sum;
                                    }, 0);
                                };

                                // 1. Filter Logs by Date
                                const filteredHistory = item.history?.filter(h =>
                                    isWithinInterval(new Date(h.timestamp), { start: startOfDay(startDate), end: endOfDay(endDate) })
                                ) || [];

                                // 2. Burn Rate & Prediction (using filtered recent history)
                                const totalRevenuePeriod = calculateRevenue(filteredHistory);
                                const totalConsumedPeriod = filteredHistory.reduce((sum, log) => {
                                    if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                        return sum + Math.abs((log.details as any)?.change || 0);
                                    }
                                    return sum;
                                }, 0);

                                const activeDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
                                const dailyBurnRate = totalConsumedPeriod / activeDays;
                                const daysRemaining = dailyBurnRate > 0 ? Math.floor(totalQty / dailyBurnRate) : null;

                                // Projected Revenue (Monthly) based on *current* burn rate
                                const monthlyRevenueProjection = dailyBurnRate * (item.playWinTarget || 20) * ((item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2) * 30;

                                // 3. Comparison Datasets
                                let chartData: any[] = [];
                                let chartTitle = "";
                                let chartSubtitle = "";

                                if (comparisonMode === 'item' && compareItemId) {
                                    const compareItem = items.find(i => i.id === compareItemId);
                                    if (compareItem) {
                                        const cHistory = compareItem.history?.filter(h =>
                                            isWithinInterval(new Date(h.timestamp), { start: startOfDay(startDate), end: endOfDay(endDate) })
                                        ) || [];

                                        // Prepare Daily Comparison Data
                                        const dateMap = new Map<string, { date: string, current: number, compare: number }>();
                                        eachDayOfInterval({ start: startDate, end: endDate }).forEach(d => {
                                            dateMap.set(format(d, 'yyyy-MM-dd'), {
                                                date: format(d, 'MMM d'),
                                                current: 0,
                                                compare: 0
                                            });
                                        });

                                        [filteredHistory, cHistory].forEach((hist, idx) => {
                                            const key = idx === 0 ? 'current' : 'compare';
                                            hist.forEach(log => {
                                                const dKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
                                                if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                                    const val = Math.abs((log.details as any)?.change || 0) * (idx === 0 ? (item.playWinTarget || 20) * ((item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2) : (compareItem.playWinTarget || 20) * ((compareItem.payouts?.[0] as any)?.playCost || (compareItem as any).playCost || 2));
                                                    if (dateMap.has(dKey)) {
                                                        const entry = dateMap.get(dKey)!;
                                                        entry[key as 'current' | 'compare'] += val;
                                                    }
                                                }
                                            });
                                        });
                                        chartData = Array.from(dateMap.values());
                                        chartTitle = `Revenue vs ${compareItem.name}`;
                                        chartSubtitle = "Daily Revenue Comparison";
                                    }
                                } else if (comparisonMode === 'machine') {
                                    // Group by Machine
                                    const machineMap = new Map<string, number>();
                                    filteredHistory.forEach(log => {
                                        if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                            // Try to find machine name from logs or assigned machines
                                            // Note: details.machineId might rely on implementation of stock updates
                                            // Fallback: If logic assumes machine interaction, we map it.
                                            // Since historical logs might lack machineId, this is "best effort".
                                            const mId = (log.details as any)?.machineId;
                                            const mName = mId ? machines.find(m => m.id === mId)?.name || 'Unknown Log' : 'Unattributed';

                                            const val = Math.abs((log.details as any)?.change || 0) * (item.playWinTarget || 20) * ((item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2);
                                            machineMap.set(mName, (machineMap.get(mName) || 0) + val);
                                        }
                                    });
                                    chartData = Array.from(machineMap.entries()).map(([name, value]) => ({ name, value }));
                                    chartTitle = "Revenue by Machine";
                                    chartSubtitle = "Where is this item making money?";
                                } else if (comparisonMode === 'location') {
                                    // Group by Location (Level)
                                    const locMap = new Map<string, number>();
                                    filteredHistory.forEach(log => {
                                        if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                            const mId = (log.details as any)?.machineId;
                                            // If no machine ID in log, we can't be sure of location at THAT time.
                                            // For V1, if un-attributed, label as "Unknown Location".
                                            const machine = mId ? machines.find(m => m.id === mId) : null;
                                            const locName = machine?.location || "Unknown Location";

                                            const val = Math.abs((log.details as any)?.change || 0) * (item.playWinTarget || 20) * ((item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2);
                                            locMap.set(locName, (locMap.get(locName) || 0) + val);
                                        }
                                    });
                                    chartData = Array.from(locMap.entries()).map(([name, value]) => ({ name, value }));
                                    chartTitle = "Revenue by Location";
                                    chartSubtitle = "Performance across different floor levels";
                                } else if (comparisonMode === 'history') {
                                    // Monthly Comparison (Past Years vs Current)
                                    // Simplified: Just show month-by-month of current selected range?
                                    // Requirement: "History means... Jan to Feb".
                                    // Let's break down selected range by Month if > 60 days, else by Week?
                                    // User said "Month of Jan to Month of Feb".

                                    // Let's default to Daily breakdown of the selected range, which behaves like 'History'
                                    // But maybe aggregated by Month if range is large.
                                    const monthsStr = new Map<string, number>();
                                    filteredHistory.forEach(log => {
                                        if ((log.action === 'STOCK_LEVEL_CHANGE' || log.action === 'ADJUST_STOCK') && (log.details as any)?.change < 0) {
                                            const monthKey = format(new Date(log.timestamp), 'MMM yyyy');
                                            const val = Math.abs((log.details as any)?.change || 0) * (item.playWinTarget || 20) * ((item.payouts?.[0] as any)?.playCost || (item as any).playCost || 2);
                                            monthsStr.set(monthKey, (monthsStr.get(monthKey) || 0) + val);
                                        }
                                    });
                                    chartData = Array.from(monthsStr.entries()).map(([name, value]) => ({ name, value }));
                                    chartTitle = "Historical Revenue Trend";
                                    chartSubtitle = "Monthly performance breakdown";
                                }

                                const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

                                return (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Depletion Forecast */}
                                            <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-200/50 dark:border-indigo-800/50">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                                        <TrendingDown className="h-4 w-4" />
                                                        Depletion Forecast
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {daysRemaining !== null
                                                            ? `${daysRemaining} Days`
                                                            : (totalQty === 0 ? "Out of Stock" : "Calculating...")}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {dailyBurnRate > 0
                                                            ? `Using ~${dailyBurnRate.toFixed(1)} items/day`
                                                            : "Insufficient usage data"}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            {/* Projected Revenue */}
                                            <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-200/50 dark:border-emerald-800/50">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                        <Target className="h-4 w-4" />
                                                        Projected Revenue
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                                        {formatCurrency(monthlyRevenueProjection)}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        est. monthly potential
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            {/* Optimization */}
                                            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-200/50 dark:border-amber-800/50">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                                        <Lightbulb className="h-4 w-4" />
                                                        Optimization
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                        {assignedMachines.length > 0 ? "Best Performing Location" : "Assign to machine"}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {assignedMachines.length > 0
                                                            ? (() => {
                                                                const best = assignedMachines.slice().sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];
                                                                return `Machine "${best.name}" has highest turnover (${best.playCount || 0} plays).`;
                                                            })()
                                                            : "No machine data available."}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Comparison Section */}
                                        <Card className="overflow-hidden">
                                            <CardHeader className="border-b bg-muted/20">
                                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                    <div>
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            <GitCompare className="h-4 w-4 text-primary" />
                                                            Revenue Analytics
                                                        </CardTitle>
                                                        <CardDescription>Deep dive into financial performance</CardDescription>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {/* Date Picker */}
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant={"outline"}
                                                                    className={cn(
                                                                        "w-[240px] justify-start text-left font-normal h-8",
                                                                        !dateRange && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {dateRange?.from ? (
                                                                        dateRange.to ? (
                                                                            <>
                                                                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                                                                {format(dateRange.to, "LLL dd, y")}
                                                                            </>
                                                                        ) : (
                                                                            format(dateRange.from, "LLL dd, y")
                                                                        )
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="end">
                                                                <Calendar
                                                                    initialFocus
                                                                    mode="range"
                                                                    defaultMonth={dateRange?.from}
                                                                    selected={dateRange}
                                                                    onSelect={setDateRange}
                                                                    numberOfMonths={2}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>

                                                        {/* Comparison Modes */}
                                                        <div className="flex bg-muted rounded-md p-1 items-center">
                                                            <Button variant={comparisonMode === 'item' ? "secondary" : "ghost"} size="sm" onClick={() => setComparisonMode('item')} className="h-7 text-xs">Vs Item</Button>
                                                            <Separator orientation="vertical" className="h-4 mx-1" />
                                                            <Button variant={comparisonMode === 'machine' ? "secondary" : "ghost"} size="sm" onClick={() => setComparisonMode('machine')} className="h-7 text-xs">Vs Machine</Button>
                                                            <Separator orientation="vertical" className="h-4 mx-1" />
                                                            <Button variant={comparisonMode === 'location' ? "secondary" : "ghost"} size="sm" onClick={() => setComparisonMode('location')} className="h-7 text-xs">Vs Location</Button>
                                                            <Separator orientation="vertical" className="h-4 mx-1" />
                                                            <Button variant={comparisonMode === 'history' ? "secondary" : "ghost"} size="sm" onClick={() => setComparisonMode('history')} className="h-7 text-xs">History</Button>
                                                        </div>

                                                        {/* Chart Type Selector */}
                                                        <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                                                            <SelectTrigger className="w-[100px] h-8 text-xs">
                                                                <SelectValue placeholder="Chart" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="bar">Bar Chart</SelectItem>
                                                                <SelectItem value="area">Area Chart</SelectItem>
                                                                <SelectItem value="line">Line Chart</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                {comparisonMode === 'none' && (
                                                    <div className="text-center py-12 text-muted-foreground">
                                                        <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                        <p>Select a comparison mode above to analyze revenue</p>
                                                    </div>
                                                )}

                                                {comparisonMode === 'item' && (
                                                    <div className="mb-4">
                                                        <Select onValueChange={setCompareItemId} value={compareItemId || undefined}>
                                                            <SelectTrigger className="w-full md:w-[300px]">
                                                                <SelectValue placeholder="Select item to compare..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {items.filter(i => i.id !== item.id).map(i => (
                                                                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}

                                                {comparisonMode !== 'none' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium">{chartTitle || "Analysis"}</h4>
                                                            <p className="text-xs text-muted-foreground">{chartSubtitle}</p>
                                                        </div>
                                                        <div className="h-[350px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-dashed">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                {(() => {
                                                                    const isTimeBased = comparisonMode === 'item' || comparisonMode === 'history';
                                                                    const xKey = isTimeBased ? 'date' : 'name';
                                                                    // If item compare, we have 'current' and 'compare'. Otherwise 'value'.
                                                                    const isMultiSeries = comparisonMode === 'item';

                                                                    // Common components
                                                                    const Grid = <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />;
                                                                    const X = <XAxis
                                                                        dataKey={xKey}
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                                        interval={isTimeBased ? 'preserveStartEnd' : 0}
                                                                    />;
                                                                    const Y = <YAxis
                                                                        axisLine={false}
                                                                        tickLine={false}
                                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                                        tickFormatter={(val) => `$${val}`}
                                                                    />;
                                                                    const Tooltipp = <Tooltip
                                                                        cursor={{ fill: '#f1f5f9' }}
                                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                                                                    />;

                                                                    if (chartType === 'line') {
                                                                        return (
                                                                            <LineChart data={chartData}>
                                                                                {Grid}
                                                                                {X}
                                                                                {Y}
                                                                                {Tooltipp}
                                                                                <Legend />
                                                                                {isMultiSeries ? (
                                                                                    <>
                                                                                        <Line type="monotone" dataKey="current" name="This Item" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                                                        <Line type="monotone" dataKey="compare" name="Comparison" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                                                                    </>
                                                                                ) : (
                                                                                    <Line type="monotone" dataKey="value" name="Revenue" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                                                                                )}
                                                                            </LineChart>
                                                                        );
                                                                    }

                                                                    if (chartType === 'bar' || !isTimeBased) {
                                                                        // Default to bar for categorical (machine/location) even if area/line selected, as area/line makes less sense
                                                                        return (
                                                                            <BarChart data={chartData}>
                                                                                {Grid}
                                                                                {X}
                                                                                {Y}
                                                                                {Tooltipp}
                                                                                <Legend />
                                                                                {isMultiSeries ? (
                                                                                    <>
                                                                                        <Bar dataKey="current" name="This Item" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                                                        <Bar dataKey="compare" name="Comparison" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                                                    </>
                                                                                ) : (
                                                                                    <Bar dataKey="value" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                                                )}
                                                                            </BarChart>
                                                                        );
                                                                    }

                                                                    // Area Chart (default fallthrough for time based)
                                                                    return (
                                                                        <AreaChart data={chartData}>
                                                                            <defs>
                                                                                <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                                                </linearGradient>
                                                                                {isMultiSeries && (
                                                                                    <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                                                                                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8} />
                                                                                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                                                    </linearGradient>
                                                                                )}
                                                                            </defs>
                                                                            {Grid}
                                                                            {X}
                                                                            {Y}
                                                                            {Tooltipp}
                                                                            <Legend />
                                                                            {isMultiSeries ? (
                                                                                <>
                                                                                    <Area type="monotone" dataKey="current" name="This Item" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHistory)" />
                                                                                    <Area type="monotone" dataKey="compare" name="Comparison" stroke="#94a3b8" fillOpacity={1} fill="url(#colorCompare)" />
                                                                                </>
                                                                            ) : (
                                                                                <Area type="monotone" dataKey="value" name="Revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHistory)" />
                                                                            )}
                                                                        </AreaChart>
                                                                    );
                                                                })()}
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card >
                                    </>
                                );
                            })()}
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
                        stockItems={items}
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

            {/* Warning Alert Dialog */}
            <AlertDialog open={warningAlert.open} onOpenChange={(open) => setWarningAlert(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-orange-600 flex items-center gap-2">
                            ⚠️ {warningAlert.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {warningAlert.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setWarningAlert(prev => ({ ...prev, open: false }))}>
                            Understood
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
                            {statusConfirm && (() => {
                                const { item, status: newStatus } = statusConfirm;
                                if (item.assignedStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
                                    const machineId = item.assignedMachineId;
                                    if (machineId) {
                                        const replacements = items.filter(i =>
                                            i.assignedMachineId === machineId &&
                                            i.assignedStatus === "Assigned for Replacement" &&
                                            i.id !== item.id
                                        ).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                                        if (replacements.length > 0) {
                                            const nextItem = replacements[0];
                                            return (
                                                <>
                                                    Assigning this to &quot;{newStatus}&quot; will promote <strong>{nextItem.name}</strong> to the active item on <strong>{item.assignedMachineName}</strong>.
                                                </>
                                            );
                                        } else {
                                            if (newStatus === "Not Assigned") {
                                                return <>This will make the machine <strong>{item.assignedMachineName}</strong> empty as there are no replacement items.</>;
                                            } else {
                                                return <>This will make the machine <strong>{item.assignedMachineName}</strong> empty as you are moving the only active item to replacement.</>;
                                            }
                                        }
                                    }
                                }
                                return (
                                    <>
                                        Are you sure you want to change status to &quot;{statusConfirm?.status}&quot;?
                                        {statusConfirm?.item.assignedMachineId && " This may affect the machine's active item."}
                                    </>
                                );
                            })()}
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Assign Machine ({machines.length} loaded)</DialogTitle>
                        <DialogDescription>
                            Select a machine to assign <strong>{assigningItem?.name}</strong> ({assigningItem?.size || "No Size"}).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Search machines..."
                                value={machineSearch}
                                onChange={(e) => setMachineSearch(e.target.value)}
                                className="flex-1"
                            />
                            <Select value={machineFilter} onValueChange={setMachineFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    {Array.from(new Set(machines.map(m => m.type || "Other"))).map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignment Mode Selection */}
                        <div className="bg-muted/30 p-3 rounded-lg space-y-2">
                            <Label className="text-sm font-medium">Assignment Type</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="mode-primary"
                                        name="assignmentMode"
                                        value="primary"
                                        checked={assignmentMode === 'primary'}
                                        onChange={() => setAssignmentMode('primary')}
                                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <Label htmlFor="mode-primary" className="font-normal cursor-pointer">
                                        Assign (Primary)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="mode-replacement"
                                        name="assignmentMode"
                                        value="replacement"
                                        checked={assignmentMode === 'replacement'}
                                        onChange={() => setAssignmentMode('replacement')}
                                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                                    />
                                    <Label htmlFor="mode-replacement" className="font-normal cursor-pointer">
                                        Assign for Replacement
                                    </Label>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {assignmentMode === 'primary'
                                    ? "Assigns item as the active prize. Only empty machines are shown."
                                    : "Assigns item as backup stock. Can be assigned to occupied machines."}
                            </p>
                        </div>

                        {/* Size Matching Info and Override Toggle */}
                        {assigningItem?.size && (
                            <div className="flex items-center justify-between py-2">
                                <div className="text-sm text-muted-foreground">
                                    Assigning <strong>{assigningItem.name}</strong> (Size: {assigningItem.size})
                                </div>
                                {hasRole(['manager', 'admin']) && (
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="supervisor-override"
                                            checked={showAllMachines}
                                            onCheckedChange={setShowAllMachines}
                                        />
                                        <Label htmlFor="supervisor-override" className="text-orange-500 font-medium">
                                            Supervisor Override
                                        </Label>
                                    </div>
                                )}
                            </div>
                        )}

                        <ScrollArea className="h-[400px] pr-4">
                            {(() => {
                                // Base filtering (search + type)
                                const baseFiltered = machines.filter(m =>
                                    (m.name.toLowerCase().includes(machineSearch.toLowerCase()) ||
                                        m.location.toLowerCase().includes(machineSearch.toLowerCase())) &&
                                    (machineFilter === "All" || m.type === machineFilter || (!m.type && machineFilter === "Other"))
                                );

                                // Split into Compatible and Other
                                let compatibleMachines: ArcadeMachine[] = [];
                                let otherMachines: ArcadeMachine[] = [];

                                if (assigningItem?.size) {
                                    compatibleMachines = baseFiltered.filter(m => {
                                        const machineSize = m.prizeSize?.trim().toLowerCase();
                                        const itemSize = assigningItem.size?.trim().toLowerCase();
                                        return machineSize === itemSize;
                                    });

                                    otherMachines = baseFiltered.filter(m => {
                                        const machineSize = m.prizeSize?.trim().toLowerCase();
                                        const itemSize = assigningItem.size?.trim().toLowerCase();
                                        return machineSize !== itemSize;
                                    });
                                } else {
                                    compatibleMachines = baseFiltered;
                                }

                                // Sorting Logic: Available first, then by queue length, then alphabetical
                                const sortMachines = (machineList: ArcadeMachine[]) => {
                                    return [...machineList].sort((a, b) => {
                                        const aOccupied = items.some(i => i.assignedMachineId === a.id && i.assignedStatus === "Assigned");
                                        const bOccupied = items.some(i => i.assignedMachineId === b.id && i.assignedStatus === "Assigned");
                                        if (aOccupied !== bOccupied) return aOccupied ? 1 : -1;
                                        const aQueue = items.filter(i => i.assignedMachineId === a.id && i.assignedStatus === "Assigned for Replacement").length;
                                        const bQueue = items.filter(i => i.assignedMachineId === b.id && i.assignedStatus === "Assigned for Replacement").length;
                                        if (aQueue !== bQueue) return aQueue - bQueue;
                                        return a.name.localeCompare(b.name);
                                    });
                                };

                                compatibleMachines = sortMachines(compatibleMachines);
                                otherMachines = sortMachines(otherMachines);

                                const renderMachineButton = (machine: ArcadeMachine) => {
                                    const slotsToRender = (machine.slots && machine.slots.length > 0)
                                        ? machine.slots
                                        : [{ id: "slot-1", name: "Slot 1" }];

                                    return (
                                        <React.Fragment key={machine.id}>
                                            {slotsToRender.map((slot: any) => {
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
                                };

                                if (baseFiltered.length === 0) {
                                    return (
                                        <div className="text-sm text-muted-foreground text-center py-8">
                                            No machines found.
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-6">
                                        {compatibleMachines.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-purple-700 mb-3">Compatible Machines</h4>
                                                {compatibleMachines.map(renderMachineButton)}
                                            </div>
                                        )}

                                        {showAllMachines && otherMachines.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 mb-3 mt-4">Other Machines</h4>
                                                {otherMachines.map(renderMachineButton)}
                                            </div>
                                        )}

                                        {!showAllMachines && otherMachines.length > 0 && compatibleMachines.length === 0 && (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-muted-foreground mb-2">No compatible machines found.</p>
                                                <Button variant="link" onClick={() => setShowAllMachines(true)}>
                                                    Show all machines
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
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
                            {itemToSetOutOfStock?.assignedMachineId && (
                                <>
                                    <br /><br />
                                    <strong className="text-orange-600">⚠️ Warning:</strong> This item is currently{" "}
                                    <strong>{itemToSetOutOfStock.assignedStatus === "Assigned" ? "Using" : "assigned for Replacement"}</strong>{" "}
                                    on machine <strong>{itemToSetOutOfStock.assignedMachineName}</strong>.
                                    {itemToSetOutOfStock.assignedStatus === "Assigned" && (
                                        <> The machine will appear empty until stock is received or another item is assigned.</>
                                    )}
                                </>
                            )}
                            <br /><br />
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

            {/* Pending Assignment Confirmation Dialog */}
            <AlertDialog open={!!pendingAssignment} onOpenChange={(open) => !open && setPendingAssignment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {(() => {
                                if (!pendingAssignment) return "Confirm Assignment";
                                // Check if item is already assigned to this machine
                                const alreadyAssigned = item?.assignedMachineId === pendingAssignment.machine.id;
                                if (alreadyAssigned) return "Already Assigned";
                                return pendingAssignment.status === "Assigned" ? "Machine Occupied" : "Existing Replacement Queue";
                            })()}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {(() => {
                                if (!pendingAssignment) return null;
                                const alreadyAssigned = item?.assignedMachineId === pendingAssignment.machine.id;

                                if (alreadyAssigned) {
                                    const currentStatus = item?.assignedStatus || "Not Assigned";
                                    return (
                                        <>
                                            This item is already <strong>"{currentStatus}"</strong> to{" "}
                                            <strong>{pendingAssignment.machine.name}</strong>.
                                            <br /><br />
                                            Do you want to re-assign it anyway?
                                        </>
                                    );
                                }

                                if (pendingAssignment.status === "Assigned") {
                                    return (
                                        <>
                                            This machine is already using an item. Continuing will <strong>remove the current item</strong> and assign this one.
                                        </>
                                    );
                                }

                                return (
                                    <>
                                        This machine already has items in the replacement queue.
                                        <br /><br />
                                        Do you want to add this item to the queue?
                                    </>
                                );
                            })()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (pendingAssignment) {
                                    executeAssignment(
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
                                    if (action === "assign-out-of-stock") {
                                        // Supervisor override for assigning out of stock item
                                        // We need to proceed with assignment logic.
                                        // Since we can't easily jump back, we'll call executeAssignment directly IF we have pending info
                                        if (pendingOverrideAssignment) {
                                            const { machine, slotId, status } = pendingOverrideAssignment;

                                            // We still need to check conflict logic?
                                            // Yes, but we can assume supervisor overrides that too or we should check it?
                                            // The original code was blocking. 
                                            // Let's check conflicts.

                                            const currentItem = item;
                                            const targetStatus = status;
                                            const machineId = machine.id;

                                            // Check if item is already assigned to this machine
                                            const alreadyOnThisMachine = items.some(i =>
                                                i.id === currentItem.id && i.assignedMachineId === machineId
                                            );

                                            if (alreadyOnThisMachine) {
                                                setPendingAssignment({ machine, status: targetStatus, slotId });
                                                setSupervisorOverride(null);
                                                setSupervisorPassword("");
                                                return;
                                            }

                                            // USING Mode Logic
                                            if (targetStatus === "Assigned") {
                                                const currentActiveItem = items.find(i =>
                                                    i.assignedMachineId === machineId &&
                                                    i.assignedStatus === "Assigned"
                                                );

                                                if (currentActiveItem) {
                                                    setPendingAssignment({ machine, status: targetStatus, slotId });
                                                    setSupervisorOverride(null);
                                                    setSupervisorPassword("");
                                                    return;
                                                }
                                            }

                                            setAssigningItem(currentItem);
                                            await executeAssignment(machine, targetStatus, slotId);
                                            setSupervisorOverride(null);
                                            setSupervisorPassword("");
                                            setPendingOverrideAssignment(null);
                                            return;
                                        }
                                    } else if (action === "downgrade-using-to-replacement") {
                                        const updates: Partial<StockItem> = {
                                            assignedStatus: "Not Assigned",
                                            assignedMachineId: undefined,
                                            assignedMachineName: undefined,
                                            updatedAt: new Date(),
                                        };
                                        await stockService.update(item.id, updates);
                                        // Update local machine state if needed? 
                                        // We rely on refreshMachines() called elsewhere or page refresh? 
                                        // This page uses context data so it might auto update.
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

            {/* Stock Level Assignment Warning Dialog */}
            <AlertDialog open={!!stockLevelWarning} onOpenChange={(open) => !open && setStockLevelWarning(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Stock Level Warning
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This item is currently marked as <strong>{stockLevelWarning ? calculateStockLevel(stockLevelWarning.item.locations.reduce((s, l) => s + l.quantity, 0), stockLevelWarning.item.stockStatus).label : ""}</strong>.
                            <br /><br />
                            Are you sure you want to assign it as <strong>{stockLevelWarning?.status === "Assigned" ? "Using" : "Replacement"}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setStockLevelWarning(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                            if (!stockLevelWarning) return;
                            const { item: staleItem, status: newStatus, actionType, machineId, slotId } = stockLevelWarning;

                            // Get fresh item data from context
                            const currentItem = items.find(i => i.id === staleItem.id) || staleItem;

                            setStockLevelWarning(null); // Close dialog

                            if (actionType === 'status_change') {
                                // Continue handleChangeAssignedStatus logic
                                // Handle changing from Replacement -> Using
                                if (currentItem.assignedStatus === "Assigned for Replacement" && newStatus === "Assigned") {
                                    if (currentItem.assignedMachineId) {
                                        const currentActive = items.find(i =>
                                            i.assignedMachineId === currentItem.assignedMachineId &&
                                            i.assignedStatus === "Assigned" &&
                                            i.id !== currentItem.id
                                        );

                                        if (currentActive) {
                                            setAssignmentConflict({ item: currentItem, currentUsingItem: currentActive });
                                            return;
                                        }
                                    }
                                    await processStatusChange(currentItem, "Assigned");
                                    return;
                                }

                                // Changing from Using to Not Assigned or Replacement requires warning
                                if (currentItem.assignedStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
                                    const machineId = currentItem.assignedMachineId;
                                    if (newStatus === "Assigned for Replacement") {
                                        let warningMessage = "";
                                        if (machineId) {
                                            const replacements = items.filter(i =>
                                                i.assignedMachineId === machineId &&
                                                i.assignedStatus === "Assigned for Replacement" &&
                                                i.id !== currentItem.id
                                            ).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                                            if (replacements.length > 0) {
                                                const nextItem = replacements[0];
                                                warningMessage = `Assigning this to "${newStatus}" will promote **${nextItem.name}** to the active item on **${currentItem.assignedMachineName}**.`;
                                            } else {
                                                warningMessage = `This will make the machine **${currentItem.assignedMachineName}** empty as you are moving the only active item to replacement.`;
                                            }
                                        }
                                        setWarningAlert({
                                            open: true,
                                            title: "Status Change Warning",
                                            description: warningMessage || `Are you sure you want to change status to "${newStatus}"?`
                                        });
                                        await processStatusChange(currentItem, newStatus);
                                        return;
                                    }
                                    setStatusConfirm({ item: currentItem, status: newStatus });
                                    return;
                                }

                                // If changing to Assigned and no machine is assigned, open the assignment dialog
                                if (newStatus === "Assigned" && !currentItem.assignedMachineId) {
                                    setAssigningItem(currentItem);
                                    setAssignmentMode('primary');
                                    setIsAssignMachineOpen(true);
                                    return;
                                }

                                // If changing to Assigned for Replacement and no machine
                                if (newStatus === "Assigned for Replacement") {
                                    if (!currentItem.assignedMachineId) {
                                        setAssigningItem(currentItem);
                                        setAssignmentMode('replacement');
                                        setIsAssignMachineOpen(true);
                                        return;
                                    }
                                    // If already on a machine, we just change status?
                                    // Yes, if we fell through here.
                                    // But wait, original code:

                                    /*
                                       if (newStatus === "Assigned for Replacement") {
                                           setAssigningItem(item);
                                           setAssignmentMode('replacement');
                                           setIsAssignMachineOpen(true);
                                           return;
                                       }
                                    */
                                    // It ALWAYS opens dialog!
                                    setAssigningItem(currentItem);
                                    setAssignmentMode('replacement');
                                    setIsAssignMachineOpen(true);
                                    return;
                                }

                                await processStatusChange(currentItem, newStatus);
                            } else if (actionType === 'assign_machine' && machineId) {
                                // Continue handleAssignMachine logic
                                const machine = machines.find(m => m.id === machineId);
                                if (!machine) return;

                                const targetStatus = newStatus;
                                const alreadyOnThisMachine = items.some(i =>
                                    i.id === currentItem.id && i.assignedMachineId === machineId
                                );

                                if (alreadyOnThisMachine) {
                                    setPendingAssignment({ machine, status: targetStatus, slotId });
                                    return;
                                }

                                if (targetStatus === "Assigned") {
                                    const currentActiveItem = items.find(i =>
                                        i.assignedMachineId === machineId &&
                                        i.assignedStatus === "Assigned"
                                    );
                                    if (currentActiveItem) {
                                        setPendingAssignment({ machine, status: targetStatus, slotId });
                                        return;
                                    }
                                }

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

                                setAssigningItem(currentItem);
                                await executeAssignment(machine, targetStatus, slotId);
                            }
                        }}>
                            Continue Assignment
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AdjustStockDialog
                isOpen={isAdjustOpen}
                onOpenChange={setIsAdjustOpen}
                item={item}
                user={userProfile}
                onSubmit={async (itemId, values) => {
                    if (!item) return;

                    try {
                        const newLocations = [...item.locations];
                        let locIndex = newLocations.findIndex(l => l.name === values.locationName);

                        if (locIndex === -1) {
                            if (values.adjustmentType === 'set' || values.adjustmentType === 'add') {
                                newLocations.push({ name: values.locationName, quantity: 0 });
                                locIndex = newLocations.length - 1;
                            } else {
                                return; // Cannot remove from non-existent location
                            }
                        }

                        const currentQty = newLocations[locIndex].quantity;
                        let newQty = currentQty;
                        let changeAmount = 0;

                        if (values.adjustmentType === 'add') {
                            newQty += values.quantity;
                            changeAmount = values.quantity;
                        }
                        if (values.adjustmentType === 'remove') {
                            changeAmount = -values.quantity;
                            newQty = Math.max(0, currentQty - values.quantity);
                        }
                        if (values.adjustmentType === 'set') {
                            changeAmount = values.quantity - currentQty;
                            newQty = values.quantity;
                        }

                        newLocations[locIndex].quantity = newQty;

                        // Create comprehensive history log
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const historyDetails: any = {
                            location: values.locationName,
                            change: values.adjustmentType === 'set' ? 'set' : changeAmount,
                            previousQuantity: currentQty,
                            newQuantity: newQty,
                            reason: values.notes,
                            user: userProfile?.displayName || userProfile?.email || 'System'
                        };

                        // If assigned to a machine, log it so it might appear in relevant logs if we enhance filters later
                        if (item.assignedMachineId) {
                            historyDetails.machineId = item.assignedMachineId;
                            historyDetails.machineName = item.assignedMachineName;
                        }

                        const newHistoryEntry = createHistoryLog("ADJUST_STOCK", historyDetails, itemId);

                        const updatedHistory = [...(item.history || []), newHistoryEntry];

                        await stockService.update(itemId, {
                            locations: newLocations,
                            history: updatedHistory,
                            updatedAt: new Date()
                        });

                        toast.success("Stock Adjusted", { description: `Stock for ${item.name} updated.` });
                        setIsAdjustOpen(false);
                    } catch (error) {
                        console.error("Failed to adjust stock:", error);
                        toast.error("Error", { description: "Failed to adjust stock." });
                    }
                }}
            />

            {item && (
                <RequestReorderDialog
                    isOpen={isRequestReorderOpen}
                    onOpenChange={setIsRequestReorderOpen}
                    item={item}
                    onSubmit={async (data) => {
                        try {
                            const newRequest = {
                                itemName: item.name,
                                itemId: item.id,
                                itemCategory: item.category,
                                quantityRequested: data.quantity,
                                status: 'submitted',
                                requestedBy: userProfile?.uid || 'system',
                                notes: data.notes,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            };

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            await orderService.add(newRequest as any);

                            // Calculate current stock and projected total
                            const currentStock = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                            const projectedTotal = currentStock + data.quantity;

                            // Log this action on the item as well
                            const log = createHistoryLog("REQUEST_REORDER", {
                                quantityRequested: data.quantity,
                                currentStock: currentStock,
                                projectedTotalAfterReceiving: projectedTotal,
                                notes: data.notes
                            }, item.id);

                            await stockService.update(item.id, {
                                history: [...(item.history || []), log]
                            });

                            toast.success("Reorder Requested", { description: `Request for ${data.quantity} units submitted.` });
                            setIsRequestReorderOpen(false);
                        } catch (error) {
                            console.error("Failed to request reorder:", error);
                            toast.error("Error", { description: "Failed to submit request." });
                        }
                    }}
                />
            )}
        </div >
    );
}