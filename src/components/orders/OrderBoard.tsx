"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { orderService, stockService } from "@/services";
import { ReorderRequest, StockItem } from "@/types";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    useSortable,
    sortableKeyboardCoordinates,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Lock,
    Clock,
    Archive,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    Truck,
    PackageCheck,
    ListTodo,
    XCircle,
    LayoutGrid,
    Search
} from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/context/AuthContext";
import { OrderDialog } from "./OrderDialog";
import { OrganizeStockDialog } from "./OrganizeStockDialog";
import { ApproveOrderDialog } from "./ApproveOrderDialog";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
import { toast } from "sonner";
import { DEFAULT_STORAGE_LOCATION } from "@/components/inventory/StockItemForm";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// --- Configuration & Constants ---

const COLUMNS_CONFIG = {
    submitted: {
        id: "submitted",
        title: "Requested",
        icon: ListTodo,
        color: "text-blue-700",
        bg: "bg-blue-50/80",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-800"
    },
    approved: {
        id: "approved",
        title: "Approved",
        icon: CheckCircle2,
        color: "text-emerald-700",
        bg: "bg-emerald-50/80",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800"
    },
    ordered: {
        id: "ordered",
        title: "Ordered",
        icon: Truck,
        color: "text-purple-700",
        bg: "bg-purple-50/80",
        border: "border-purple-200",
        badge: "bg-purple-100 text-purple-800"
    },
    received: {
        id: "received",
        title: "Received",
        icon: PackageCheck,
        color: "text-amber-700",
        bg: "bg-amber-50/80",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-800"
    },
    organized: {
        id: "organized",
        title: "Organized",
        icon: LayoutGrid,
        color: "text-teal-700",
        bg: "bg-teal-50/80",
        border: "border-teal-200",
        badge: "bg-teal-100 text-teal-800"
    },
    rejected: {
        id: "rejected",
        title: "Rejected",
        icon: XCircle,
        color: "text-red-700",
        bg: "bg-red-50/80",
        border: "border-red-200",
        badge: "bg-red-100 text-red-800"
    },
};

const ACTIVE_COLUMNS = Object.values(COLUMNS_CONFIG);
const ALL_STATUS_OPTIONS = ACTIVE_COLUMNS;
const ARCHIVE_AFTER_HOURS = 12;

// --- Sortable Item Component ---

interface SortableItemProps {
    id: string;
    request: ReorderRequest & { itemName?: string };
    lastOrder?: ReorderRequest | null;
    isLocked: boolean;
    timeUntilArchive: string | null;
    onStatusChange: (req: any, status: string) => void;
    onClick: (req: any) => void;
}

function SortableItem({ id, request, lastOrder, isLocked, timeUntilArchive, onStatusChange, onClick }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id, disabled: isLocked });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const config = COLUMNS_CONFIG[request.status as keyof typeof COLUMNS_CONFIG] || COLUMNS_CONFIG.submitted;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 group touch-none">
            <Card
                className={cn(
                    "cursor-pointer transition-all duration-200 border shadow-sm hover:shadow-md",
                    isLocked ? "opacity-90 bg-gray-50/60" : "bg-white hover:border-primary/30",
                    isDragging ? "shadow-2xl ring-2 ring-primary/20 rotate-1 scale-105" : ""
                )}
                onClick={() => onClick(request)}
            >
                <CardContent className="p-3">
                    {/* Header: Item Name & Lock Icon */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0 font-medium text-sm leading-tight truncate">
                            {request.itemId ? (
                                <Link
                                    href={`/inventory/${request.itemId}`}
                                    className="hover:text-primary hover:underline decoration-primary/50 underline-offset-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {request.itemName || "Unknown Item"}
                                </Link>
                            ) : (
                                <span>{request.itemName || "Unknown Item"}</span>
                            )}
                        </div>
                        {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />}
                    </div>

                    {/* Meta: Quantity & Time */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
                        <Badge variant="secondary" className="px-1.5 py-0 h-5 font-medium text-[11px] bg-secondary/40">
                            <span className="font-bold text-foreground">{request.quantityRequested}</span>
                            <span className="ml-1 text-muted-foreground/80">qty</span>
                        </Badge>
                        <span className="text-[10px] opacity-70">{formatDate(request.createdAt, "MMM d")}</span>
                    </div>

                    {/* Footer: Status Select or Archive Timer */}
                    <div className="pt-2 border-t border-border/40">
                        {timeUntilArchive ? (
                            <div className="text-[10px] text-teal-700 font-medium flex items-center justify-center gap-1.5 bg-teal-50 px-2 py-1 rounded w-full">
                                <Clock className="h-3 w-3" />
                                <span>{timeUntilArchive}</span>
                            </div>
                        ) : (
                            <div
                                className="w-full relative"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <select
                                    className={cn(
                                        "w-full text-[11px] h-7 rounded border border-input/50 bg-muted/20 px-2 font-medium focus:ring-1 focus:ring-ring/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer hover:bg-muted/40",
                                        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20class%3D%22lucide%20lucide-chevron-down%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_6px_center] bg-no-repeat pr-6"
                                    )}
                                    value={request.status}
                                    onChange={(e) => onStatusChange(request, e.target.value)}
                                    disabled={isLocked}
                                >
                                    {ALL_STATUS_OPTIONS.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Main Order Board Component ---

export function OrderBoard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<(ReorderRequest & { itemName?: string })[]>([]);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    // Dialog States
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [isOrganizeOpen, setIsOrganizeOpen] = useState(false);
    const [organizeRequest, setOrganizeRequest] = useState<(ReorderRequest & { itemName?: string }) | null>(null);
    const [organizeStockItem, setOrganizeStockItem] = useState<StockItem | null>(null);

    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [approveRequest, setApproveRequest] = useState<(ReorderRequest & { itemName?: string }) | null>(null);

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [detailsRequest, setDetailsRequest] = useState<(ReorderRequest & { itemName?: string }) | null>(null);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribeStock: (() => void) | undefined;
        if (typeof (stockService as any).subscribe === 'function') {
            unsubscribeStock = (stockService as any).subscribe(async (items: StockItem[]) => {
                setStockItems(items);
                setRequests(prev => prev.map(r => ({
                    ...r,
                    itemName: r.itemName || items.find(i => i.id === r.itemId)?.name || "Unknown Item",
                })));
            });
        }
        loadData();
        return () => { if (unsubscribeStock) unsubscribeStock(); };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reqs, items] = await Promise.all([
                orderService.getAll(),
                stockService.getAll(),
            ]);
            setStockItems(items);
            const enrichedReqs = reqs.map(r => ({
                ...r,
                itemName: r.itemName || items.find(i => i.id === r.itemId)?.name || "Unknown Item",
            }));
            setRequests(enrichedReqs);
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    // --- Helpers ---

    const isArchivedOrder = (req: ReorderRequest) => {
        if (req.status !== 'organized') return false;
        const organizedAt = req.updatedAt || req.createdAt;
        if (!organizedAt) return false;
        const organizedDate = organizedAt instanceof Date ? organizedAt : new Date(organizedAt);
        return differenceInHours(new Date(), organizedDate) >= ARCHIVE_AFTER_HOURS;
    };

    const getTimeUntilArchived = (req: ReorderRequest) => {
        const organizedAt = req.updatedAt || req.createdAt;
        if (!organizedAt) return null;
        const organizedDate = organizedAt instanceof Date ? organizedAt : new Date(organizedAt);
        const hoursLeft = ARCHIVE_AFTER_HOURS - differenceInHours(new Date(), organizedDate);
        if (hoursLeft <= 0) return null;
        return `${hoursLeft}h until archived`;
    };

    const canChangeStatus = (req: ReorderRequest) => req.status !== 'organized';

    // Helper to find last completed order
    const getLastOrder = (req: ReorderRequest): ReorderRequest | null => {
        if (!req.itemId) return null;

        // Find orders for same item, created before this one
        const itemOrders = requests.filter(r =>
            r.itemId === req.itemId &&
            r.id !== req.id &&
            // Check valid timestamps
            r.createdAt && req.createdAt &&
            new Date(r.createdAt as any).getTime() < new Date(req.createdAt as any).getTime()
        );

        if (itemOrders.length === 0) return null;

        // Sort by date desc
        return itemOrders.sort((a, b) =>
            new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
        )[0] || null;
    };

    // --- Handlers ---

    const handleCardClick = (req: ReorderRequest & { itemName?: string }) => {
        setDetailsRequest(req);
        setIsDetailsOpen(true);
    };

    const handleStatusChange = async (req: ReorderRequest & { itemName?: string }, newStatus: string) => {
        const previousStatus = req.status;

        if (previousStatus === 'organized') {
            toast.error("Cannot Change", { description: "Organized orders cannot be modified." });
            return;
        }

        if (newStatus === 'approved' && previousStatus === 'submitted') {
            setApproveRequest(req);
            setIsApproveOpen(true);
            return;
        }

        if (newStatus === 'organized') {
            if (previousStatus !== 'received') {
                toast.error("Invalid Transition", { description: "Order must be 'Received' before it can be organized." });
                return;
            }
            const stockItem = stockItems.find(i => i.id === req.itemId) || null;
            setOrganizeRequest(req);
            setOrganizeStockItem(stockItem);
            setIsOrganizeOpen(true);
            return;
        }

        setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus as any } : r));

        try {
            await orderService.update(req.id, { status: newStatus as any, updatedAt: new Date() });

            if (newStatus === 'received' && previousStatus !== 'received' && req.itemId) {
                const stockItem = await stockService.getById(req.itemId);
                if (stockItem) {
                    const updatedLocations = [...stockItem.locations];
                    const defaultLocationIndex = updatedLocations.findIndex(l => l.name === DEFAULT_STORAGE_LOCATION);

                    if (defaultLocationIndex >= 0) {
                        updatedLocations[defaultLocationIndex].quantity += req.quantityRequested;
                    } else {
                        updatedLocations.push({ name: DEFAULT_STORAGE_LOCATION, quantity: req.quantityRequested });
                    }

                    const historyEntry = {
                        id: `hist_${Date.now()}`,
                        action: "ORDER_RECEIVED",
                        timestamp: new Date().toISOString(),
                        userId: user?.uid || 'system',
                        details: {
                            orderId: req.id,
                            quantityReceived: req.quantityRequested,
                            location: DEFAULT_STORAGE_LOCATION,
                        }
                    };

                    await stockService.update(req.itemId, {
                        locations: updatedLocations,
                        history: [...(stockItem.history || []), historyEntry] as any
                    });

                    toast.success("Stock Received", {
                        description: `Added ${req.quantityRequested} units to ${DEFAULT_STORAGE_LOCATION}.`
                    });
                }
            }

            if (previousStatus === 'received' && newStatus !== 'received' && newStatus !== 'organized' && req.itemId) {
                const stockItem = await stockService.getById(req.itemId);
                if (stockItem) {
                    const updatedLocations = [...stockItem.locations];
                    const defaultLocationIndex = updatedLocations.findIndex(l => l.name === DEFAULT_STORAGE_LOCATION);

                    if (defaultLocationIndex >= 0) {
                        updatedLocations[defaultLocationIndex].quantity -= req.quantityRequested;
                        if (updatedLocations[defaultLocationIndex].quantity < 0) updatedLocations[defaultLocationIndex].quantity = 0;
                        if (updatedLocations[defaultLocationIndex].quantity === 0) updatedLocations.splice(defaultLocationIndex, 1);
                    }

                    const historyEntry = {
                        id: `hist_${Date.now()}`,
                        action: "ORDER_RECEIVE_REVERSED",
                        timestamp: new Date().toISOString(),
                        userId: user?.uid || 'system',
                        details: {
                            orderId: req.id,
                            quantityRemoved: req.quantityRequested,
                            location: DEFAULT_STORAGE_LOCATION,
                            reason: `Status changed from 'received' to '${newStatus}'`
                        }
                    };

                    await stockService.update(req.itemId, {
                        locations: updatedLocations,
                        history: [...(stockItem.history || []), historyEntry] as any
                    });

                    toast.warning("Stock Reversed", {
                        description: `Removed ${req.quantityRequested} units from ${DEFAULT_STORAGE_LOCATION}.`
                    });
                }
            }
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
            loadData();
        }
    };

    const handleOrganizeSubmit = async (distributions: { locationName: string; quantity: number }[]) => {
        if (!organizeRequest || !organizeRequest.itemId) return;

        try {
            const stockItem = await stockService.getById(organizeRequest.itemId);
            if (!stockItem) return;

            const updatedLocations = [...stockItem.locations];
            const receivedQty = organizeRequest.quantityRequested;

            const bPlushyIndex = updatedLocations.findIndex(l => l.name === DEFAULT_STORAGE_LOCATION);
            if (bPlushyIndex >= 0) {
                updatedLocations[bPlushyIndex].quantity -= receivedQty;
                if (updatedLocations[bPlushyIndex].quantity < 0) updatedLocations[bPlushyIndex].quantity = 0;
            }

            for (const dist of distributions) {
                if (dist.quantity <= 0 || !dist.locationName) continue;
                const locIndex = updatedLocations.findIndex(l => l.name === dist.locationName);
                if (locIndex >= 0) {
                    updatedLocations[locIndex].quantity += dist.quantity;
                } else {
                    updatedLocations.push({ name: dist.locationName, quantity: dist.quantity });
                }
            }

            const cleanedLocations = updatedLocations.filter(l => l.quantity > 0);

            const historyEntry = {
                id: `hist_${Date.now()}`,
                action: "ORDER_ORGANIZED",
                timestamp: new Date().toISOString(),
                userId: user?.uid || 'system',
                details: {
                    orderId: organizeRequest.id,
                    distributions: distributions,
                    totalQuantity: receivedQty,
                }
            };

            await stockService.update(organizeRequest.itemId, {
                locations: cleanedLocations,
                history: [...(stockItem.history || []), historyEntry] as any
            });

            await orderService.update(organizeRequest.id, { status: 'organized' as any, updatedAt: new Date() });

            setRequests(prev => prev.map(r =>
                r.id === organizeRequest.id ? { ...r, status: 'organized' as any, updatedAt: new Date() } : r
            ));

            const distDesc = distributions.map(d => `${d.quantity} → ${d.locationName}`).join(', ');
            toast.success("Stock Organized", { description: distDesc });

            setIsOrganizeOpen(false);
            setOrganizeRequest(null);
            setOrganizeStockItem(null);
        } catch (error) {
            console.error("Failed to organize:", error);
            toast.error("Failed to organize stock");
        }
    };

    const handleApproveSubmit = async (approvedQty: number, rejectedQty: number, notes?: string) => {
        if (!approveRequest) return;
        try {
            if (rejectedQty === 0) {
                await orderService.update(approveRequest.id, { status: 'approved' as any, updatedAt: new Date(), notes: notes || approveRequest.notes });
                setRequests(prev => prev.map(r => r.id === approveRequest.id ? { ...r, status: 'approved' as any } : r));
                toast.success("Order Approved", { description: `Approved ${approvedQty} units.` });
            } else if (approvedQty === 0) {
                await orderService.update(approveRequest.id, { status: 'rejected' as any, updatedAt: new Date(), notes: notes || 'Fully rejected' });
                setRequests(prev => prev.map(r => r.id === approveRequest.id ? { ...r, status: 'rejected' as any } : r));
                toast.info("Order Rejected", { description: `Rejected ${rejectedQty} units.` });
            } else {
                await orderService.update(approveRequest.id, {
                    status: 'approved' as any, quantityRequested: approvedQty, updatedAt: new Date(),
                    notes: notes ? `Partial approval. ${notes}` : 'Partial approval'
                });
                const rejectedOrder = {
                    itemId: approveRequest.itemId, itemName: approveRequest.itemName, itemCategory: approveRequest.itemCategory,
                    quantityRequested: rejectedQty, status: 'rejected' as const, requestedBy: approveRequest.requestedBy,
                    notes: notes ? `Rejected from partial approval. ${notes}` : 'Rejected from partial approval',
                    createdAt: new Date(), updatedAt: new Date(),
                };
                await orderService.add(rejectedOrder as any);
                await loadData();
                toast.success("Partial Approval", { description: `Approved ${approvedQty}, rejected ${rejectedQty}.` });
            }
            setIsApproveOpen(false);
            setApproveRequest(null);
        } catch (error) {
            console.error("Failed to approve:", error);
            toast.error("Failed to approve order");
        }
    };

    // --- Drag & Drop Handlers ---

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeRequest = requests.find(r => r.id === activeId);

        if (!activeRequest || activeRequest.status === 'organized') return;

        // If dropped on a column (droppable zone)
        if (ACTIVE_COLUMNS.some(c => c.id === overId)) {
            if (activeRequest.status !== overId) {
                await handleStatusChange(activeRequest, overId);
            }
        }
    };

    // --- Filtering ---
    const lowerSearch = searchQuery.toLowerCase();
    const activeRequests = requests.filter(r => !isArchivedOrder(r) && (r.itemName || "").toLowerCase().includes(lowerSearch));
    const archivedRequests = requests.filter(r => isArchivedOrder(r) && (r.itemName || "").toLowerCase().includes(lowerSearch));

    if (loading) return (
        <div className="flex items-center justify-center p-8 space-x-2 text-muted-foreground">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <span>Loading orders...</span>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-background">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-1">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search orders..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-muted/40 border-muted-foreground/20 focus:bg-background transition-colors text-base"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {archivedRequests.length > 0 && (
                        <Button
                            variant={showArchived ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setShowArchived(!showArchived)}
                            className="text-muted-foreground h-9"
                        >
                            <Archive className="mr-2 h-4 w-4" />
                            {showArchived ? 'Hide' : 'Show'} History
                            <Badge variant="secondary" className="ml-2 h-5 min-w-[1.25rem] px-1">{archivedRequests.length}</Badge>
                        </Button>
                    )}
                    <Button onClick={() => setIsDialogOpen(true)} className="shadow-sm h-9 px-4">
                        <Plus className="mr-2 h-4 w-4" /> New Request
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                {/* Kanban Board - Responsive Grid */}
                <div className="flex-1 overflow-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 pb-4 min-w-[600px] lg:min-w-0">
                        {ACTIVE_COLUMNS.map((col) => {
                            const colRequests = activeRequests.filter(r => r.status === col.id);
                            const Icon = col.icon;

                            return (
                                <div
                                    key={col.id}
                                    className="flex flex-col min-w-0"
                                >
                                    {/* Column Header */}
                                    <div className={cn(
                                        "flex items-center justify-between px-2 py-2 rounded-lg border mb-3 shadow-sm",
                                        col.bg, col.border
                                    )}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Icon className={cn("h-4 w-4 shrink-0", col.color)} />
                                            <h3 className={cn("font-semibold text-xs truncate", col.color)}>{col.title}</h3>
                                        </div>
                                        <Badge className={cn("font-bold text-[10px] h-5 px-1.5 shrink-0", col.badge)}>
                                            {colRequests.length}
                                        </Badge>
                                    </div>

                                    {/* Droppable Area */}
                                    <SortableContext
                                        id={col.id}
                                        items={colRequests.map(r => r.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex-1 min-h-[200px] rounded-lg">
                                            {colRequests.length === 0 ? (
                                                <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-lg bg-muted/5 space-y-1">
                                                    <Icon className="h-5 w-5 text-muted-foreground/20" />
                                                    <p className="text-[10px] text-muted-foreground/50 font-medium">Empty</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {colRequests.map(req => (
                                                        <SortableItem
                                                            key={req.id}
                                                            id={req.id}
                                                            request={req}
                                                            lastOrder={getLastOrder(req)}
                                                            isLocked={!canChangeStatus(req)}
                                                            timeUntilArchive={col.id === 'organized' ? getTimeUntilArchived(req) : null}
                                                            onStatusChange={handleStatusChange}
                                                            onClick={handleCardClick}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Drag Overlay */}
                <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                    {activeId ? (
                        <div className="rotate-2 cursor-grabbing opacity-90">
                            {/* Simplified representation for drag overlay */}
                            <Card className="w-[280px] shadow-xl border-primary">
                                <CardContent className="p-3">
                                    <div className="font-medium text-sm">
                                        {requests.find(r => r.id === activeId)?.itemName}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Archived Orders Section */}
                {showArchived && (
                    <div className="mt-8 border-t pt-6 bg-muted/10 rounded-xl p-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-muted-foreground">
                            <Archive className="h-5 w-5" />
                            Order History ({archivedRequests.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {archivedRequests.map(req => (
                                <Card
                                    key={req.id}
                                    className="bg-white/50 hover:bg-white transition-colors cursor-pointer border hover:border-teal-200"
                                    onClick={() => handleCardClick(req)}
                                >
                                    <CardContent className="p-3 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 bg-teal-50 rounded-bl-lg">
                                            <CheckCircle2 className="h-3 w-3 text-teal-600" />
                                        </div>
                                        <div className="font-medium text-sm pr-6 mb-1 truncate">
                                            {req.itemName || "Unknown Item"}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex justify-between items-end">
                                            <span>Qty: {req.quantityRequested}</span>
                                            <span className="text-[10px]">
                                                {req.updatedAt ? formatDistanceToNow(new Date(req.updatedAt as any)) : ''} ago
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {archivedRequests.length === 0 && (
                                <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
                                    No archived orders found.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Dialogs */}
                <OrderDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={loadData}
                />

                {organizeRequest && (
                    <OrganizeStockDialog
                        isOpen={isOrganizeOpen}
                        onOpenChange={(open) => {
                            setIsOrganizeOpen(open);
                            if (!open) { setOrganizeRequest(null); setOrganizeStockItem(null); }
                        }}
                        request={organizeRequest}
                        stockItem={organizeStockItem}
                        onSubmit={handleOrganizeSubmit}
                    />
                )}

                {approveRequest && (
                    <ApproveOrderDialog
                        isOpen={isApproveOpen}
                        onOpenChange={(open) => {
                            setIsApproveOpen(open);
                            if (!open) setApproveRequest(null);
                        }}
                        request={approveRequest}
                        onSubmit={handleApproveSubmit}
                    />
                )}

                {detailsRequest && (
                    <OrderDetailsDialog
                        isOpen={isDetailsOpen}
                        onOpenChange={(open) => {
                            setIsDetailsOpen(open);
                            if (!open) setDetailsRequest(null);
                        }}
                        request={detailsRequest}
                    />
                )}
            </DndContext>
        </div>
    );
}
