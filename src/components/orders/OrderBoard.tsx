"use client";

import { useEffect, useState } from "react";
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
} from "@dnd-kit/core";
import {
    useSortable,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/context/AuthContext";
import { OrderDialog } from "./OrderDialog";


const COLUMNS = [
    { id: "submitted", title: "Requested" },
    { id: "approved", title: "Approved" },
    { id: "ordered", title: "Ordered" },
    { id: "received", title: "Received" },
    { id: "organized", title: "Organized" },
];

function SortableItem({ id, request }: { id: string; request: ReorderRequest & { itemName?: string } }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
            <Card className="cursor-grab active:cursor-grabbing">
                <CardContent className="p-3">
                    <div className="font-medium">{request.itemName || "Unknown Item"}</div>
                    <div className="text-sm text-muted-foreground">Qty: {request.quantityRequested}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(request.createdAt, "MMM d")}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function OrderBoard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<(ReorderRequest & { itemName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        let unsubscribeStock: (() => void) | undefined;

        // Subscribe to real-time stock updates to enrich order data
        if (typeof (stockService as any).subscribe === 'function') {
            unsubscribeStock = (stockService as any).subscribe(async (stockItems: StockItem[]) => {
                // Re-enrich requests when stock data changes
                setRequests(prev => prev.map(r => ({
                    ...r,
                    itemName: r.itemName || stockItems.find(i => i.id === r.itemId)?.name || "Unknown Item",
                })));
            });
        }

        // Initial load
        loadData();

        return () => {
            if (unsubscribeStock) unsubscribeStock();
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [reqs, items] = await Promise.all([
                orderService.getAll(),
                stockService.getAll(),
            ]);

            const enrichedReqs = reqs.map(r => ({
                ...r,
                itemName: r.itemName || items.find(i => i.id === r.itemId)?.name || "Unknown Item",
            }));

            setRequests(enrichedReqs);
        } catch (error) {
            console.error("Failed to load orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the container (column)
        const activeRequest = requests.find(r => r.id === activeId);
        if (!activeRequest) return;

        // If dropped on a column header (which we'll use as droppable zones)
        if (COLUMNS.some(c => c.id === overId)) {
            if (activeRequest.status !== overId) {
                // Status change
                const newStatus = overId as ReorderRequest['status'];

                // Optimistic update
                setRequests(prev => prev.map(r =>
                    r.id === activeId ? { ...r, status: newStatus } : r
                ));

                try {
                    await orderService.update(activeId, { status: newStatus });
                } catch (error) {
                    console.error("Failed to update status:", error);
                    loadData(); // Revert
                }
            }
        }
    };

    if (loading) return <div>Loading orders...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Request
                </Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>

                <div className="flex gap-4 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => (
                        <div key={col.id} className="min-w-[250px] w-full bg-muted/30 p-2 rounded-lg">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-semibold">{col.title}</h3>
                                <Badge variant="secondary">{requests.filter(r => r.status === col.id).length}</Badge>
                            </div>

                            <div className="space-y-2">
                                {requests.filter(r => r.status === col.id).map(req => (
                                    <Card key={req.id} className="cursor-pointer hover:bg-accent">
                                        <CardContent className="p-3">
                                            <div className="font-medium">{req.itemName || "Unknown Item"}</div>
                                            <div className="text-sm text-muted-foreground">Qty: {req.quantityRequested}</div>
                                            <div className="mt-2">
                                                {/* Quick Status Change for now since DnD setup is complex */}
                                                <select
                                                    className="text-xs border rounded p-1"
                                                    value={req.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value as any;

                                                        // Optimistic update
                                                        setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: newStatus } : r));

                                                        try {
                                                            await orderService.update(req.id, { status: newStatus });

                                                            // If status is 'received', update stock quantity
                                                            if (newStatus === 'received' && req.status !== 'received' && req.itemId) {
                                                                const stockItem = await stockService.getById(req.itemId);
                                                                if (stockItem) {
                                                                    // Add to "Warehouse" or first location
                                                                    const updatedLocations = [...stockItem.locations];
                                                                    const warehouseIndex = updatedLocations.findIndex(l => l.name === "Warehouse");

                                                                    if (warehouseIndex >= 0) {
                                                                        updatedLocations[warehouseIndex].quantity += req.quantityRequested;
                                                                    } else {
                                                                        updatedLocations.push({ name: "Warehouse", quantity: req.quantityRequested });
                                                                    }

                                                                    await stockService.update(req.itemId, {
                                                                        locations: updatedLocations
                                                                    });
                                                                    alert(`Stock updated! Added ${req.quantityRequested} to ${stockItem.name}.`);
                                                                }
                                                            }
                                                        } catch (error) {
                                                            console.error("Failed to update status:", error);
                                                            loadData(); // Revert
                                                        }
                                                    }}

                                                >
                                                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                                </select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <OrderDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    onSuccess={loadData}
                />
            </DndContext>
        </div>
    );
}
