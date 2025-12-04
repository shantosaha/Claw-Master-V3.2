"use client";
// Force rebuild

import React, { useEffect, useState, useMemo } from "react";
import { stockService, orderService, machineService } from "@/services";
import { StockItem, ReorderRequest, ArcadeMachine, AuditLog } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { useAuth } from "@/context/AuthContext";
import { StockItemHistoryDialog } from "@/components/inventory/StockItemHistoryDialog";
import { Button } from "@/components/ui/button";
import { Plus, Inbox, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

import { StockFilters, ViewStyle, SortOption, StockStatusFilter } from "./StockFilters";
import { StockItemCard } from "./StockItemCard";
import { StockItemForm } from "./StockItemForm";
import { AdjustStockDialog } from "./AdjustStockDialog";
import { ReceiveOrderDialog } from "./ReceiveOrderDialog";
import { StockItemDetailsDialog } from "./StockItemDetailsDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Settings2, History, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function StockList() {
    const { userProfile, hasRole } = useAuth();
    const [items, setItems] = useState<StockItem[]>([]);
    const [reorderRequests, setReorderRequests] = useState<ReorderRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState<SortOption>("date-new");
    const [stockStatus, setStockStatus] = useState<StockStatusFilter>("all");
    const [viewStyle, setViewStyle] = useState<ViewStyle>(() => {
        // Load saved view preference from localStorage, default to "list" if not set
        if (typeof window !== 'undefined') {
            const savedView = localStorage.getItem('inventory-view-style');
            return (savedView as ViewStyle) || "list";
        }
        return "list";
    });
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // Filter states
    const [selectedSize, setSelectedSize] = useState("All");
    const [selectedBrand, setSelectedBrand] = useState("All");
    const [assignedStatusFilter, setAssignedStatusFilter] = useState<string>("all");

    // Dialog State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
    const [isReceiveOpen, setIsReceiveOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyItemId, setHistoryItemId] = useState<string | null>(null);
    const activeHistoryItem = useMemo(() =>
        items.find(i => i.id === historyItemId) || null
        , [items, historyItemId]);

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsItem, setDetailsItem] = useState<StockItem | null>(null);
    const [isAssignMachineOpen, setIsAssignMachineOpen] = useState(false);
    const [assigningItem, setAssigningItem] = useState<StockItem | null>(null);
    const [assignmentMode, setAssignmentMode] = useState<'primary' | 'replacement'>('primary');
    const [machines, setMachines] = useState<ArcadeMachine[]>([]);
    const [machineSearch, setMachineSearch] = useState("");
    const [machineFilter, setMachineFilter] = useState("All");
    const [statusConfirm, setStatusConfirm] = useState<{ item: StockItem, status: string } | null>(null);
    const [showAllMachines, setShowAllMachines] = useState(false);
    const [warningAlert, setWarningAlert] = useState<{ title: string, description: string, open: boolean }>({ title: "", description: "", open: false });
    const [pendingAssignment, setPendingAssignment] = useState<{ machine: ArcadeMachine, status: string, slotId?: string } | null>(null);
    const [supervisorOverride, setSupervisorOverride] = useState<{ item: StockItem, action: "unassign" | "downgrade-using-to-replacement" } | null>(null);
    const [supervisorPassword, setSupervisorPassword] = useState("");
    const [supervisorError, setSupervisorError] = useState("");
    const [assignmentConflict, setAssignmentConflict] = useState<{
        item: StockItem;
        currentUsingItem: StockItem;
    } | null>(null);
    const [pendingStockChange, setPendingStockChange] = useState<{ item: StockItem; newLevel: string } | null>(null);
    const [isOutOfStockConfirmOpen, setIsOutOfStockConfirmOpen] = useState(false);
    const [itemToSetOutOfStock, setItemToSetOutOfStock] = useState<StockItem | null>(null);
    const [restockQuantity, setRestockQuantity] = useState<string>("0");
    const [outOfStockMode, setOutOfStockMode] = useState<"set-zero" | "keep-quantity">("set-zero");

    // Zoom Dialog State
    const [zoomItem, setZoomItem] = useState<StockItem | null>(null);
    const [zoomImageIndex, setZoomImageIndex] = useState(0);
    const [isZoomOpen, setIsZoomOpen] = useState(false);


    const categories = useMemo(() => {
        const cats = new Set(items.map(i => i.category));
        return Array.from(cats).sort();
    }, [items]);

    const sizes = useMemo(() => {
        const s = new Set(items.map(i => i.size).filter((s): s is string => !!s));
        return Array.from(s).sort();
    }, [items]);

    const brands = useMemo(() => {
        const b = new Set(items.map(i => i.brand).filter(Boolean));
        return Array.from(b).sort();
    }, [items]);



    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (isAssignMachineOpen) {
            machineService.getAll().then(setMachines);
        }
    }, [isAssignMachineOpen]);

    // Persist view style preference to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('inventory-view-style', viewStyle);
        }
    }, [viewStyle]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [stockData, requestsData, machinesData] = await Promise.all([
                stockService.getAll(),
                orderService.getAll(),
                machineService.getAll()
            ]);
            setItems(stockData);
            setReorderRequests(requestsData);
            setMachines(machinesData);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Error", {
                description: "Failed to load inventory data.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedCategory("All");
        setStockStatus("all");
        setSelectedSize("All");
        setSelectedBrand("All");
        setSortOrder("date-new");
        setSortColumn(null);
        setSortDirection("asc");
        setAssignedStatusFilter("all");
    };


    const filteredItems = useMemo(() => {
        const result = items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            const matchesSize = selectedSize === "All" || item.size === selectedSize;
            const matchesBrand = selectedBrand === "All" || item.brand === selectedBrand;

            const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const stockLevel = calculateStockLevel(totalQty, item.stockStatus);
            let matchesStatus = true;

            if (stockStatus === "low") matchesStatus = stockLevel.status === "Low Stock";
            if (stockStatus === "out") matchesStatus = stockLevel.status === "Out of Stock";
            if (stockStatus === "limited") matchesStatus = stockLevel.status === "Limited Stock";
            if (stockStatus === "in-stock-not-low") matchesStatus = stockLevel.status === "In Stock";

            const itemAssignedStatus = item.assignedStatus || "Not Assigned";
            const matchesAssignedStatus =
                assignedStatusFilter === "all" ||
                (assignedStatusFilter === "not-assigned" && itemAssignedStatus === "Not Assigned") ||
                (assignedStatusFilter === "assigned" && itemAssignedStatus === "Assigned") ||
                (assignedStatusFilter === "assigned-for-replacement" && itemAssignedStatus === "Assigned for Replacement");

            return matchesSearch && matchesCategory && matchesStatus && matchesSize && matchesBrand && matchesAssignedStatus;
        });

        // Sorting
        if (sortColumn) {
            result.sort((a, b) => {
                let aVal: any, bVal: any;

                switch (sortColumn) {
                    case "name":
                        aVal = a.name;
                        bVal = b.name;
                        break;
                    case "category":
                        aVal = a.category;
                        bVal = b.category;
                        break;
                    case "size":
                        aVal = a.size || "";
                        bVal = b.size || "";
                        break;
                    case "quantity":
                        aVal = a.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                        bVal = b.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                        break;
                    case "stockStatus":
                        const qtyA = a.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                        const qtyB = b.locations.reduce((sum, loc) => sum + loc.quantity, 0);

                        const getStatusRank = (qty: number) => {
                            if (qty <= 0) return 0; // Out
                            if (qty <= 12) return 1; // Low
                            if (qty <= 25) return 2; // Limited
                            return 3; // In Stock
                        };

                        aVal = getStatusRank(qtyA);
                        bVal = getStatusRank(qtyB);
                        break;
                    case "assignedStatus":
                        aVal = a.assignedStatus || "";
                        bVal = b.assignedStatus || "";
                        break;
                    case "assignedTo":
                        aVal = a.assignedMachineName || "";
                        bVal = b.assignedMachineName || "";
                        break;
                    default:
                        return 0;
                }

                if (typeof aVal === "string" && typeof bVal === "string") {
                    return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
            });
        } else {
            // Default sorting
            result.sort((a, b) => {
                const qtyA = a.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                const qtyB = b.locations.reduce((sum, loc) => sum + loc.quantity, 0);

                switch (sortOrder) {
                    case "name-asc": return a.name.localeCompare(b.name);
                    case "name-desc": return b.name.localeCompare(a.name);
                    case "qty-asc": return qtyA - qtyB;
                    case "qty-desc": return qtyB - qtyA;
                    case "date-old": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    case "date-new": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    default: return 0;
                }
            });
        }

        return result;
    }, [items, searchTerm, selectedCategory, sortOrder, stockStatus, selectedSize, selectedBrand, sortColumn, sortDirection, assignedStatusFilter]);

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

    const handleSaveItem = async (data: any) => {
        try {
            if (editingItem) {
                const historyLog = createHistoryLog("UPDATE_ITEM", {
                    changes: "Item details updated",
                    name: data.name !== editingItem.name ? `Name changed from ${editingItem.name} to ${data.name}` : undefined,
                    quantity: data.quantity !== editingItem.quantity ? `Quantity changed from ${editingItem.quantity} to ${data.quantity}` : undefined
                }, editingItem.id);

                const updatedHistory = [...(editingItem.history || []), historyLog];

                await stockService.update(editingItem.id, {
                    ...data,
                    history: updatedHistory,
                    updatedAt: new Date()
                });
                // Update state directly instead of reloading
                setItems(prevItems => prevItems.map(item =>
                    item.id === editingItem.id ? { ...item, ...data, history: updatedHistory, updatedAt: new Date() } : item
                ));
                toast.success("Item Updated", { description: `${data.name} has been updated.` });
            } else {
                const historyLog = createHistoryLog("CREATE_ITEM", {
                    name: data.name,
                    category: data.category,
                    initialQuantity: data.quantity
                });

                const newId = await stockService.add({
                    ...data,
                    history: [historyLog],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                // Add to state directly
                setItems(prevItems => [...prevItems, { ...data, id: newId, history: [historyLog], createdAt: new Date(), updatedAt: new Date() }]);
                toast.success("Item Created", { description: `${data.name} has been added.` });
            }
            setIsFormOpen(false);
            setEditingItem(null);
        } catch (error) {
            console.error("Failed to save item:", error);
            toast.error("Error", { description: "Failed to save item." });
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await stockService.remove(itemToDelete.id);
            // Update state directly
            setItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
            toast.success("Item Deleted", { description: `${itemToDelete.name} has been removed.` });
            setIsDeleteOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Error", { description: "Failed to delete item." });
        }
    };

    const handleAdjustStock = async (itemId: string, values: any) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

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

        if (values.adjustmentType === 'add') newQty += values.quantity;
        if (values.adjustmentType === 'remove') newQty = Math.max(0, currentQty - values.quantity);
        if (values.adjustmentType === 'set') newQty = values.quantity;

        newLocations[locIndex].quantity = newQty;

        newLocations[locIndex].quantity = newQty;

        const newHistoryEntry = createHistoryLog("ADJUST_STOCK", {
            location: values.locationName,
            change: values.adjustmentType === 'set' ? 'set' : (values.adjustmentType === 'remove' ? -values.quantity : values.quantity),
            newQuantity: newQty,
            reason: values.notes
        }, itemId);

        const updatedHistory = [...(item.history || []), newHistoryEntry];

        try {
            await stockService.update(itemId, {
                locations: newLocations,
                history: updatedHistory,
                updatedAt: new Date()
            });
            // Update state directly
            setItems(prevItems => prevItems.map(i =>
                i.id === itemId ? { ...i, locations: newLocations, history: updatedHistory, updatedAt: new Date() } : i
            ));
            toast.success("Stock Adjusted", { description: `Stock for ${item.name} updated.` });
        } catch (error) {
            console.error("Failed to adjust stock:", error);
            toast.error("Error", { description: "Failed to adjust stock." });
        }
    };

    const handleReceiveOrder = async (request: ReorderRequest, action: 'update_existing' | 'create_new', itemId?: string) => {
        try {
            if (action === 'update_existing' && itemId) {
                const item = items.find(i => i.id === itemId);
                if (item) {
                    // Add to default location or first location
                    const locationName = item.locations[0]?.name || "Warehouse";
                    await handleAdjustStock(itemId, {
                        type: 'add',
                        quantity: request.quantityRequested,
                        location: locationName,
                        reason: `Received Order #${request.id}`
                    });
                }
            } else if (action === 'create_new') {
                setEditingItem({
                    id: "", // Will be generated
                    name: request.itemName,
                    category: request.itemCategory || "Plush",
                    sku: "",
                    locations: [{ name: "Warehouse", quantity: request.quantityRequested }],
                    lowStockThreshold: 10,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    quantityDescription: "",
                } as any);
                setIsFormOpen(true);
                // We need to mark request as received AFTER the form is submitted... 
                // Ideally we pass a callback or handle it in handleSaveItem. 
                // For simplicity, let's just mark it as received now, but user might cancel form.
                // Better: Pre-fill form and let user save. Then we need to link back.
                // For this MVP, let's just open the form. The user manually updates the request status later or we automate it.
                // Let's automate updating the request status:
                await orderService.update(request.id, { status: 'received', updatedAt: new Date() });
                return; // Exit here, form will handle item creation
            }

            // Update request status
            await orderService.update(request.id, { status: 'received', updatedAt: new Date() });
            toast.success("Order Received", { description: `Order #${request.id} processed.` });
            loadData();
        } catch (error) {
            console.error("Failed to receive order:", error);
            toast.error("Error", { description: "Failed to process order." });
        }
    };

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(column);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (column: string) => {
        if (sortColumn !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />;
        return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };



    const handleQuickStockLevelChange = async (itemId: string, newLevel: string) => {
        const item = items.find(i => i.id === itemId);
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

    const handleConfirmSetOutOfStock = async () => {
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
                quantitySetTo: 0
            }, item.id);
            const updatedHistory = [...(updatedItem.history || []), historyLog];

            await stockService.update(item.id, {
                locations: updatedItem.locations,
                stockStatus: updatedItem.stockStatus,
                history: updatedHistory,
                updatedAt: new Date(),
            });

            setItems(prev =>
                prev.map(i =>
                    i.id === item.id
                        ? {
                            ...i,
                            locations: updatedItem.locations,
                            stockStatus: updatedItem.stockStatus,
                            history: updatedHistory,
                            updatedAt: new Date(),
                        } as StockItem
                        : i
                )
            );

            toast.success("Stock Level Updated", { description: "Item marked as Out of Stock with quantity set to 0." });
        } catch (error) {
            console.error("Failed to update stock level:", error);
            toast.error("Error", { description: "Failed to update stock level." });
        } finally {
            setIsOutOfStockConfirmOpen(false);
            setItemToSetOutOfStock(null);
        }
    };



    const processStatusChange = async (item: StockItem, newStatus: string) => {
        try {
            const oldStatus = item.assignedStatus;
            const historyLog = createHistoryLog("STATUS_CHANGE", {
                oldStatus: oldStatus || "Not Assigned",
                newStatus: newStatus,
                machine: item.assignedMachineName || "None"
            }, item.id);
            const updatedHistory = [...(item.history || []), historyLog];

            const updates: Partial<StockItem> = {
                assignedStatus: newStatus,
                history: updatedHistory,
                updatedAt: new Date()
            };

            if (newStatus === "Not Assigned") {
                updates.assignedMachineId = undefined;
                updates.assignedMachineName = undefined;
            }

            await stockService.update(item.id, updates);

            setItems(prevItems => prevItems.map(i =>
                i.id === item.id ? { ...i, ...updates } : i
            ));

            // Logic for "Machine Without an Active Item" & "Replacement Queue Auto-Assignment"
            // If item was "Assigned" and is now "Not Assigned" or "Assigned for Replacement"
            if (oldStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
                const machineId = item.assignedMachineId;
                if (machineId) {
                    // Replacement Queue Auto-Assignment
                    // Find items in replacement queue for this machine
                    // Note: We use 'items' from the closure, which is the state BEFORE the update we just did.
                    // So if we just moved the current item to "Assigned for Replacement", it will show as "Assigned" in 'items'.
                    // We must filter it out explicitly.
                    const replacementQueue = items.filter(i =>
                        i.assignedMachineId === machineId &&
                        i.assignedStatus === "Assigned for Replacement" &&
                        i.id !== item.id
                    );

                    if (replacementQueue.length > 0) {
                        // Sort by updatedAt (FIFO) - assuming older updates mean they've been in queue longer
                        replacementQueue.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());

                        const nextItem = replacementQueue[0];

                        // Assign the next item
                        await stockService.update(nextItem.id, {
                            assignedStatus: "Assigned",
                            updatedAt: new Date()
                        });

                        setItems(prevItems => prevItems.map(i =>
                            i.id === nextItem.id ? { ...i, assignedStatus: "Assigned", updatedAt: new Date() } : i
                        ));

                        toast.success("Auto-Assigned Replacement", {
                            description: `${nextItem.name} has been automatically promoted to active item.`
                        });
                    }
                }
            }

            // Refresh machines to update slot status if we changed assignment status
            if ((newStatus === "Not Assigned" && item.assignedMachineId) || (oldStatus === "Assigned" && newStatus !== "Assigned") || newStatus === "Assigned") {
                const updatedMachines = await machineService.getAll();
                setMachines(updatedMachines);
            }

            toast.success("Status Updated", { description: `Item status changed to ${newStatus}` });
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Error", { description: "Failed to update status." });
        }
    };


    const handleQuickStatusChange = async (id: string, newStatus: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;

        // When assigning (Using / Replacement), respect stock level
        if (newStatus === "Assigned" || newStatus === "Assigned for Replacement") {
            const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || item.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= item.lowStockThreshold || item.stockStatus === "Low Stock");

            if (isOut) {
                // Out of stock: crew cannot assign, supervisors can after warning
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
                // Low stock: warn but allow
                setWarningAlert({
                    open: true,
                    title: "Low Stock Warning",
                    description: `This item is low on stock. Assigning it now may cause the machine to run out soon.`,
                });
            }
        }

        // Handle changing from Replacement -> Using (Assigned for Replacement -> Assigned)
        if (item.assignedStatus === "Assigned for Replacement" && newStatus === "Assigned") {
            // If the item is already linked to a machine, make sure that machine doesn't already
            // have another item in "Using" state. One machine can't have multiple "Using" items.
            if (item.assignedMachineId) {
                const currentActive = items.find(i =>
                    i.assignedMachineId === item.assignedMachineId &&
                    i.assignedStatus === "Assigned" &&
                    i.id !== item.id
                );

                if (currentActive) {
                    // Open an in-app confirmation dialog so the warning is visible on the page
                    setAssignmentConflict({ item, currentUsingItem: currentActive });
                    return;
                }
            }

            await processStatusChange(item, "Assigned");
            return;
        }

        // Changing from Using ("Assigned") to Not Assigned or Replacement requires supervisor override
        if (item.assignedStatus === "Assigned" && (newStatus === "Not Assigned" || newStatus === "Assigned for Replacement")) {
            if (newStatus === "Assigned for Replacement") {
                setWarningAlert({
                    open: true,
                    title: "Status Change Warning",
                    description: `You are changing this item to "Replacement". It will remain assigned to ${item.assignedMachineName} but will no longer be the active item.`
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

        await processStatusChange(item, newStatus);
    };

    const handleAssignMachine = async (machineId: string, slotId: string) => {
        if (!assigningItem) return;

        try {
            // Global stock checks when assigning via machine dialog
            const totalQty = assigningItem.locations.reduce((sum, loc) => sum + loc.quantity, 0);
            const isOut = totalQty === 0 || assigningItem.stockStatus === "Out of Stock";
            const isLow = !isOut && (totalQty <= assigningItem.lowStockThreshold || assigningItem.stockStatus === "Low Stock");

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

            const machine = machines.find(m => m.id === machineId);
            if (!machine) return;

            // Determine the target status based on mode
            const targetStatus = assignmentMode === 'replacement'
                ? "Assigned for Replacement"
                : "Assigned";

            // Check if item is already assigned to this machine
            const alreadyOnThisMachine = items.some(i =>
                i.id === assigningItem.id && i.assignedMachineId === machineId
            );

            if (alreadyOnThisMachine) {
                const currentStatus = assigningItem.assignedStatus || "Not Assigned";
                setWarningAlert({
                    open: true,
                    title: "Already Assigned",
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
                    // Show warning about existing queue
                    setPendingAssignment({ machine, status: targetStatus, slotId });
                    return;
                }
            }

            // ... (rest of the logic)

            // Wait, I need to implement the confirmation logic properly. 
            // Let's create a `confirmAction` state that can hold a function to execute.

            await executeAssignment(machine, targetStatus, slotId);

        } catch (error) {
            console.error("Failed to assign machine:", error);
            toast.error("Error", { description: "Failed to assign machine." });
        }
    };

    const executeAssignment = async (machine: ArcadeMachine, targetStatus: string, slotId?: string) => {
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
                    machine: machine.name
                }, currentActiveItem.id);
                const updatedHistory = [...(currentActiveItem.history || []), unassignLog];

                await stockService.update(currentActiveItem.id, {
                    assignedMachineId: undefined,
                    assignedMachineName: undefined,
                    assignedStatus: "Not Assigned",
                    history: updatedHistory,
                    updatedAt: new Date()
                });

                // Update local state for the unassigned item
                setItems(prevItems => prevItems.map(item =>
                    item.id === currentActiveItem.id
                        ? { ...item, assignedMachineId: undefined, assignedMachineName: undefined, assignedStatus: "Not Assigned", history: updatedHistory, updatedAt: new Date() }
                        : item
                ));
            }
        }

        // Update inventory item with machine assignment
        const assignLog = createHistoryLog("ASSIGN_MACHINE", {
            machine: machine.name,
            slot: slotId || "Any",
            status: targetStatus
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

        // Update state directly
        setItems(prevItems => prevItems.map(item =>
            item.id === assigningItem.id
                ? {
                    ...item,
                    assignedMachineId: machine.id,
                    assignedMachineName: machine.name,
                    assignedSlotId: slotId,
                    assignedStatus: targetStatus,
                    history: updatedAssignHistory,
                    updatedAt: new Date()
                }
                : item
        ));

        // Reload machines to update slot status
        const updatedMachines = await machineService.getAll();
        setMachines(updatedMachines);

        toast.success("Assigned to Machine", { description: `${assigningItem.name} assigned to ${machine.name} as "${targetStatus}"` });
        setIsAssignMachineOpen(false);
        setAssigningItem(null);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <p className="text-muted-foreground">Manage stock, track quantities, and handle reorders.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsReceiveOpen(true)}>
                        <Inbox className="mr-2 h-4 w-4" /> Receive Order
                    </Button>
                    <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </div>
            </div>

            <StockFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                stockStatus={stockStatus}
                onStatusChange={setStockStatus}
                viewStyle={viewStyle}
                onViewStyleChange={setViewStyle}
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
                sizes={sizes}
                selectedBrand={selectedBrand}
                onBrandChange={setSelectedBrand}
                brands={brands}
                onResetFilters={handleResetFilters}
                assignedStatusFilter={assignedStatusFilter}
                onAssignedStatusChange={setAssignedStatusFilter}
            />

            {viewStyle === 'list' ? (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("name")}>
                                    <div className="flex items-center">Name{getSortIcon("name")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("category")}>
                                    <div className="flex items-center">Category{getSortIcon("category")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("size")}>
                                    <div className="flex items-center">Size{getSortIcon("size")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("stockStatus")}>
                                    <div className="flex items-center">Stock Level{getSortIcon("stockStatus")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("assignedStatus")}>
                                    <div className="flex items-center">Assigned Status{getSortIcon("assignedStatus")}</div>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("assignedTo")}>
                                    <div className="flex items-center">Assigned To{getSortIcon("assignedTo")}</div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => {
                                    const totalQty = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
                                    const isLow = totalQty <= item.lowStockThreshold && totalQty > 0;
                                    const isOut = totalQty === 0;
                                    return (
                                        <TableRow
                                            key={item.id}
                                            className="hover:bg-muted/50 group cursor-pointer"
                                            onClick={() => {
                                                setDetailsItem(item);
                                                setIsDetailsOpen(true);
                                            }}
                                        >
                                            <TableCell className="cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                <div
                                                    className="relative w-10 h-10 rounded overflow-hidden bg-muted hover:opacity-80 transition-opacity ring-1 ring-transparent group-hover:ring-primary/40 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setZoomItem(item);
                                                        setZoomImageIndex(0);
                                                        setIsZoomOpen(true);
                                                    }}
                                                >
                                                    {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                                                        <img
                                                            src={item.imageUrls?.[0] || item.imageUrl || ""}
                                                            alt={item.name}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = "https://placehold.co/400x400?text=No+Image";
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white">
                                                        Click to zoom
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <Link
                                                    href={`/inventory/${item.id}`}
                                                    className="text-primary underline underline-offset-4 group-hover:decoration-2"
                                                >
                                                    {item.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="transition-shadow group-hover:shadow-sm group-hover:ring-2 group-hover:ring-primary/40">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {item.size || "-"}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="cursor-pointer flex justify-start">
                                                            <Badge className={cn("whitespace-nowrap text-xs font-medium px-2 py-0.5 cursor-pointer", calculateStockLevel(totalQty, item.stockStatus).colorClass)}>
                                                                {calculateStockLevel(totalQty, item.stockStatus).label}
                                                            </Badge>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuItem onClick={() => handleQuickStockLevelChange(item.id, "In Stock")}>
                                                            In Stock
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleQuickStockLevelChange(item.id, "Limited Stock")}>
                                                            Limited Stock
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleQuickStockLevelChange(item.id, "Low Stock")}>
                                                            Low Stock
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleQuickStockLevelChange(item.id, "Out of Stock")}>
                                                            Out of Stock
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Select
                                                    value={item.assignedStatus || "Not Assigned"}
                                                    onValueChange={(value) => handleQuickStatusChange(item.id, value)}
                                                >
                                                    <SelectTrigger className={`h-8 w-[140px] ${item.assignedStatus === "Assigned"
                                                        ? "bg-green-100 text-green-700 border-green-200"
                                                        : item.assignedStatus === "Assigned for Replacement"
                                                            ? "bg-blue-100 text-blue-700 border-blue-200"
                                                            : "bg-gray-100 text-gray-700 border-gray-200"
                                                        }`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Not Assigned">Not Assigned</SelectItem>
                                                        <SelectItem value="Assigned">Using</SelectItem>
                                                        <SelectItem value="Assigned for Replacement">Replacement</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                {item.assignedMachineName ? (
                                                    <Link
                                                        href={`/machines/${item.assignedMachineId || ''}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-primary hover:underline"
                                                    >
                                                        {item.assignedMachineName}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>


                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <div className="cursor-pointer">
                                                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsFormOpen(true); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setAdjustItem(item); setIsAdjustOpen(true); }}>
                                                            <Settings2 className="mr-2 h-4 w-4" /> Adjust Stock
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistoryItemId(item.id); setIsHistoryOpen(true); }}>
                                                            <History className="mr-2 h-4 w-4" /> View History
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setIsDeleteOpen(true); }} className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className={viewStyle === 'compact-grid'
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                }>
                    {filteredItems.map(item => (
                        <StockItemCard
                            key={item.id}
                            item={item}
                            viewStyle={viewStyle as "grid" | "compact-grid"}
                            onEdit={(i) => { setEditingItem(i); setIsFormOpen(true); }}
                            onDelete={(i) => { setItemToDelete(i); setIsDeleteOpen(true); }}
                            onAdjust={(i) => { setAdjustItem(i); setIsAdjustOpen(true); }}
                            onViewHistory={(i) => { setHistoryItemId(i.id); setIsHistoryOpen(true); }}
                            onChangeAssignedStatus={(id, status) => handleQuickStatusChange(id, status)}
                        />
                    ))}
                    {filteredItems.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No items found matching your filters.
                        </div>
                    )}
                </div>
            )
            }

            {/* Dialogs */}
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Stock Item" : "Add New Stock Item"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Update item details and locations." : "Create a new inventory item."}
                        </DialogDescription>
                    </DialogHeader>
                    <StockItemForm
                        initialData={editingItem || undefined}
                        onSubmit={handleSaveItem}
                        onCancel={() => setIsFormOpen(false)}
                        categories={categories}
                        sizes={sizes}
                        machines={machines}
                    />
                </DialogContent>
            </Dialog>

            {/* Shared Image Zoom Dialog */}
            <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
                <DialogContent className="max-w-4xl w-full p-2 bg-transparent border-none shadow-none">
                    <VisuallyHidden>
                        <DialogTitle>{zoomItem?.name} - Image Preview</DialogTitle>
                    </VisuallyHidden>

                    {zoomItem && (
                        <div
                            className="relative w-full h-[80vh] flex items-center justify-center outline-none"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'ArrowLeft') {
                                    setZoomImageIndex((prev) => (prev === 0 ? (zoomItem.imageUrls?.length || 1) - 1 : prev - 1));
                                } else if (e.key === 'ArrowRight') {
                                    setZoomImageIndex((prev) => (prev === (zoomItem.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                }
                            }}
                        >
                            {zoomItem.imageUrls && zoomItem.imageUrls.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/30 hover:bg-black/50 text-white rounded-full z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImageIndex((prev) => (prev === 0 ? (zoomItem.imageUrls?.length || 1) - 1 : prev - 1));
                                    }}
                                >
                                    <ChevronLeft className="h-8 w-8" />
                                </Button>
                            )}

                            <img
                                src={zoomItem.imageUrls && zoomItem.imageUrls.length > 0 ? zoomItem.imageUrls[zoomImageIndex] : zoomItem.imageUrl || ""}
                                alt={zoomItem.name}
                                className="object-contain max-h-full max-w-full rounded-lg shadow-2xl"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/400x400?text=No+Image";
                                }}
                            />

                            {zoomItem.imageUrls && zoomItem.imageUrls.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/30 hover:bg-black/50 text-white rounded-full z-50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setZoomImageIndex((prev) => (prev === (zoomItem.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                    }}
                                >
                                    <ChevronRight className="h-8 w-8" />
                                </Button>
                            )}

                            {zoomItem.imageUrls && zoomItem.imageUrls.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full pointer-events-none">
                                    {zoomImageIndex + 1} / {zoomItem.imageUrls.length}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AdjustStockDialog
                isOpen={isAdjustOpen}
                onOpenChange={setIsAdjustOpen}
                item={adjustItem}
                onSubmit={handleAdjustStock}
                user={userProfile}
            />

            <StockItemHistoryDialog
                isOpen={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                item={activeHistoryItem}
                historyLogs={activeHistoryItem?.history || []}
            />
            <ReceiveOrderDialog
                open={isReceiveOpen}
                onOpenChange={setIsReceiveOpen}
                requests={reorderRequests}
                stockItems={items}
                onReceive={handleReceiveOrder}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            <span className="font-semibold"> {itemToDelete?.name}</span> and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isOutOfStockConfirmOpen} onOpenChange={setIsOutOfStockConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will set the stock quantity of <span className="font-semibold">{itemToSetOutOfStock?.name}</span> to 0 and mark it as "Out of Stock". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSetOutOfStock} className="bg-destructive hover:bg-destructive/90">
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <StockItemDetailsDialog
                isOpen={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                item={detailsItem}
                onEdit={(item) => {
                    setEditingItem(item);
                    setIsFormOpen(true);
                    setIsDetailsOpen(false);
                }}
                onDelete={(item) => {
                    setItemToDelete(item);
                    setIsDeleteOpen(true);
                    setIsDetailsOpen(false);
                }}
                canPerformWriteActions={hasRole(["admin", "manager"])}
                canDelete={hasRole(["admin", "manager"])}
            />


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
                                let baseFiltered = machines.filter(m =>
                                    (m.name.toLowerCase().includes(machineSearch.toLowerCase()) ||
                                        m.location.toLowerCase().includes(machineSearch.toLowerCase())) &&
                                    (machineFilter === "All" || m.type === machineFilter || (!m.type && machineFilter === "Other"))
                                );

                                // Split into Compatible and Other
                                let compatibleMachines: ArcadeMachine[] = [];
                                let otherMachines: ArcadeMachine[] = [];

                                // Filter Logic based on Mode
                                const isPrimary = assignmentMode === 'primary';

                                if (assigningItem?.size) {
                                    compatibleMachines = baseFiltered.filter(m => {
                                        const machineSize = m.prizeSize?.trim().toLowerCase();
                                        const itemSize = assigningItem.size?.trim().toLowerCase();
                                        const sizeMatch = machineSize === itemSize;
                                        // For both modes, we prioritize size match.
                                        return sizeMatch;
                                    });

                                    otherMachines = baseFiltered.filter(m => {
                                        const machineSize = m.prizeSize?.trim().toLowerCase();
                                        const itemSize = assigningItem.size?.trim().toLowerCase();
                                        const sizeMatch = machineSize === itemSize;
                                        return !sizeMatch;
                                    });
                                } else {
                                    // No item size, treat all as compatible
                                    compatibleMachines = baseFiltered;
                                }

                                // Sorting Logic:
                                // 1. Empty machines first (Available)
                                // 2. Machines with NO upcoming items first (for replacement mode context)
                                // 3. Name alphabetical
                                const sortMachines = (machines: ArcadeMachine[]) => {
                                    return machines.sort((a, b) => {
                                        // Check if occupied by an "Assigned" item
                                        const aOccupied = items.some(i => i.assignedMachineId === a.id && i.assignedStatus === "Assigned");
                                        const bOccupied = items.some(i => i.assignedMachineId === b.id && i.assignedStatus === "Assigned");

                                        if (aOccupied !== bOccupied) return aOccupied ? 1 : -1; // Available first

                                        // Secondary sort: Replacement queue length
                                        const aQueue = items.filter(i => i.assignedMachineId === a.id && i.assignedStatus === "Assigned for Replacement").length;
                                        const bQueue = items.filter(i => i.assignedMachineId === b.id && i.assignedStatus === "Assigned for Replacement").length;

                                        if (aQueue !== bQueue) return aQueue - bQueue;

                                        return a.name.localeCompare(b.name);
                                    });
                                };

                                compatibleMachines = sortMachines(compatibleMachines);
                                otherMachines = sortMachines(otherMachines);

                                const renderMachineButton = (machine: ArcadeMachine) => {
                                    return (
                                        <React.Fragment key={machine.id}>
                                            {machine.slots.map((slot) => {
                                                // Treat a slot as occupied if:
                                                // - item is Assigned to this machine AND
                                                //   - assignedSlotId matches this slot, OR
                                                //   - assignedSlotId is missing (legacy data before per-slot support)
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
                                                        className={`w-full justify-start h-auto py-3 mb-2 ${isOccupied
                                                            ? "border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300"
                                                            : "border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300"
                                                            }`}
                                                        onClick={() => handleAssignMachine(machine.id, slot.id)}
                                                    >
                                                        <div className="flex flex-col items-start gap-1 w-full">
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">
                                                                        {machine.name}{" "}
                                                                        {slot.name && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                • {slot.name}
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
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {machine.prizeSize}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">
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

            <AlertDialog open={!!statusConfirm} onOpenChange={(open) => !open && setStatusConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {statusConfirm?.status === "Assigned for Replacement"
                                ? "Change Using to Replacement?"
                                : "Unassign Item?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {statusConfirm?.status === "Assigned for Replacement" ? (
                                <>
                                    This item is currently <strong>Using</strong> on{" "}
                                    <strong>{statusConfirm.item.assignedMachineName || "a machine"}</strong>.
                                    <br /><br />
                                    Changing to <strong>Replacement</strong> will remove it from the machine and leave the
                                    machine empty (item will become <strong>Not Assigned</strong>).
                                    <br /><br />
                                    This action requires a supervisor override.
                                </>
                            ) : (
                                <>
                                    This item is currently assigned to{" "}
                                    <strong>{statusConfirm?.item.assignedMachineName || "a machine"}</strong>.
                                    <br /><br />
                                    Changing to <strong>Not Assigned</strong> will remove it from that machine and requires
                                    a supervisor override.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!statusConfirm) return;
                                const isSupervisor = hasRole(["manager", "admin"]);

                                // Downgrade from Using -> Replacement (which we treat as Not Assigned + empty machine)
                                if (statusConfirm.status === "Assigned for Replacement") {
                                    if (isSupervisor) {
                                        // Supervisor can perform directly
                                        const item = statusConfirm.item;
                                        const updates: Partial<StockItem> = {
                                            assignedStatus: "Not Assigned",
                                            assignedMachineId: undefined,
                                            assignedMachineName: undefined,
                                            updatedAt: new Date(),
                                        };
                                        stockService.update(item.id, updates).then(() => {
                                            setItems(prev =>
                                                prev.map(i => i.id === item.id ? { ...i, ...updates } as StockItem : i)
                                            );
                                            toast.success("Status Updated", {
                                                description: "Item removed from machine and set to Not Assigned.",
                                            });
                                        }).catch((error) => {
                                            console.error("Failed to update status:", error);
                                            toast.error("Error", { description: "Failed to update status." });
                                        });
                                        setStatusConfirm(null);
                                    } else {
                                        // Crew: require supervisor password
                                        setSupervisorOverride({ item: statusConfirm.item, action: "downgrade-using-to-replacement" });
                                        setSupervisorPassword("");
                                        setSupervisorError("");
                                        setStatusConfirm(null);
                                    }
                                } else if (statusConfirm.status === "Not Assigned") {
                                    // Using -> Not Assigned
                                    if (isSupervisor) {
                                        processStatusChange(statusConfirm.item, "Not Assigned");
                                        setStatusConfirm(null);
                                    } else {
                                        setSupervisorOverride({ item: statusConfirm.item, action: "unassign" });
                                        setSupervisorPassword("");
                                        setSupervisorError("");
                                        setStatusConfirm(null);
                                    }
                                }
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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

            {/* Pending Assignment Confirmation Dialog */}
            <AlertDialog open={!!pendingAssignment} onOpenChange={(open) => !open && setPendingAssignment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {pendingAssignment?.status === "Assigned" ? "Machine Occupied" : "Existing Replacement Queue"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {pendingAssignment?.status === "Assigned" ? (
                                <>
                                    This machine is already using an item. Continuing will <strong>remove the current item</strong> and assign this one.
                                </>
                            ) : (
                                <>
                                    This machine already has items in the replacement queue.
                                    <br /><br />
                                    Do you want to add this item to the queue?
                                </>
                            )}
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

            {/* Stock status change dialog (restock / out-of-stock handling) */}
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

                                        // SET logic: Set first location to qtyNum, others to 0
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
                                        quantitySetTo: newLevel === "Out of Stock" && outOfStockMode === "set-zero" ? 0 : restockQuantity
                                    }, item.id);
                                    const updatedHistory = [...(updatedItem.history || []), historyLog];

                                    await stockService.update(item.id, {
                                        locations: updatedItem.locations,
                                        stockStatus: updatedItem.stockStatus,
                                        history: updatedHistory,
                                        updatedAt: new Date(),
                                    });

                                    setItems(prev =>
                                        prev.map(i =>
                                            i.id === item.id
                                                ? {
                                                    ...i,
                                                    locations: updatedItem.locations,
                                                    stockStatus: updatedItem.stockStatus,
                                                    history: updatedHistory,
                                                    updatedAt: new Date(),
                                                } as StockItem
                                                : i
                                        )
                                    );

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

            {/* Supervisor password dialog (for crew override) */}
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
                                        setItems(prev =>
                                            prev.map(i => i.id === item.id ? { ...i, ...updates } as StockItem : i)
                                        );
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

            {/* Replacement -> Using conflict dialog (one Using per machine) */}
            <AlertDialog
                open={!!assignmentConflict}
                onOpenChange={(open) => {
                    if (!open) setAssignmentConflict(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Machine Already Has a Using Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            {assignmentConflict && (
                                <>
                                    Machine{" "}
                                    <strong>{assignmentConflict.item.assignedMachineName || "Unknown Machine"}</strong>{" "}
                                    is currently <strong>Using</strong>{" "}
                                    <strong>{assignmentConflict.currentUsingItem.name}</strong>.
                                    <br />
                                    <br />
                                    Continuing will remove that item from Using (set it to{" "}
                                    <strong>Not Assigned</strong>) and set{" "}
                                    <strong>{assignmentConflict.item.name}</strong> as the new{" "}
                                    <strong>Using</strong> item on that machine.
                                    <br />
                                    <br />
                                    Do you want to continue?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (!assignmentConflict) return;
                                const { currentUsingItem, item } = assignmentConflict;

                                try {
                                    // Demote current Using item on that machine
                                    await stockService.update(currentUsingItem.id, {
                                        assignedStatus: "Not Assigned",
                                        assignedMachineId: undefined,
                                        assignedMachineName: undefined,
                                        updatedAt: new Date(),
                                    });
                                    setItems(prev =>
                                        prev.map(i =>
                                            i.id === currentUsingItem.id
                                                ? {
                                                    ...i,
                                                    assignedStatus: "Not Assigned",
                                                    assignedMachineId: undefined,
                                                    assignedMachineName: undefined,
                                                    updatedAt: new Date(),
                                                } as StockItem
                                                : i
                                        )
                                    );

                                    // Now promote the replacement item to Using
                                    await processStatusChange(item, "Assigned");
                                    setAssignmentConflict(null);
                                } catch (error) {
                                    console.error("Failed to resolve assignment conflict:", error);
                                    toast.error("Error", { description: "Failed to update machine assignments." });
                                }
                            }}
                        >
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

