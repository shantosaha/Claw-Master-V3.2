"use client";

import * as React from "react";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ReorderRequest, StockItem } from "@/types";
import {
    Package,
    User,
    Calendar,
    MapPin,
    Cpu,
    History,
    AlertTriangle,
    FileText,
    ExternalLink,
    Boxes,
    ArrowRight,
    Sparkles,
    Clock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { stockService, orderService } from "@/services";
import { cn } from "@/lib/utils";

interface OrderDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    request: ReorderRequest & { itemName?: string };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; icon: string; label: string }> = {
    submitted: { bg: "bg-blue-500", text: "text-white", border: "border-blue-400", icon: "📋", label: "Requested" },
    approved: { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-400", icon: "✅", label: "Approved" },
    rejected: { bg: "bg-red-500", text: "text-white", border: "border-red-400", icon: "❌", label: "Rejected" },
    ordered: { bg: "bg-purple-500", text: "text-white", border: "border-purple-400", icon: "🚚", label: "Ordered" },
    received: { bg: "bg-amber-500", text: "text-white", border: "border-amber-400", icon: "📦", label: "Received" },
    organized: { bg: "bg-teal-500", text: "text-white", border: "border-teal-400", icon: "✨", label: "Organized" },
};

export function OrderDetailsDialog({ isOpen, onOpenChange, request }: OrderDetailsDialogProps) {
    const [stockItem, setStockItem] = React.useState<StockItem | null>(null);
    const [previousOrders, setPreviousOrders] = React.useState<ReorderRequest[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (isOpen && request.itemId) {
            loadDetails();
        }
    }, [isOpen, request.itemId]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            if (request.itemId) {
                const item = await stockService.getById(request.itemId);
                setStockItem(item);
            }

            const allOrders = await orderService.getAll();
            const currentOrderDate = request.createdAt ? new Date(request.createdAt as any).getTime() : Date.now();

            // Filter to orders for the same item that were created BEFORE this order
            const itemOrders = allOrders
                .filter(o => {
                    if (o.itemId !== request.itemId || o.id === request.id) return false;
                    const orderDate = o.createdAt ? new Date(o.createdAt as any).getTime() : 0;
                    return orderDate < currentOrderDate; // Only orders BEFORE the current one
                })
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
                    return dateB - dateA; // Most recent first
                })
                .slice(0, 5); // Last 5 orders before this one
            setPreviousOrders(itemOrders);
        } catch (error) {
            console.error("Failed to load order details:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalStock = stockItem?.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.submitted;
    const isLowStock = stockItem && totalStock <= (stockItem.lowStockThreshold || 0);

    const formatOrderDate = (date: any) => {
        if (!date) return 'Unknown';
        const d = date instanceof Date ? date : new Date(date);
        return format(d, 'MMM d, yyyy • h:mm a');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-hidden p-0 gap-0 rounded-2xl border-0 shadow-2xl">
                {/* Gradient Header */}
                <div className={cn(
                    "relative px-6 pt-6 pb-8 bg-gradient-to-br",
                    request.status === 'submitted' && "from-blue-500 to-blue-700",
                    request.status === 'approved' && "from-emerald-500 to-emerald-700",
                    request.status === 'rejected' && "from-red-500 to-red-700",
                    request.status === 'ordered' && "from-purple-500 to-purple-700",
                    request.status === 'received' && "from-amber-500 to-amber-700",
                    request.status === 'organized' && "from-teal-500 to-teal-700",
                )}>
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl" />
                    </div>

                    <DialogHeader className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <Badge className="bg-white/20 text-white hover:bg-white/30 border-0 mb-2 text-[10px] font-medium backdrop-blur-sm">
                                    {statusConfig.icon} {statusConfig.label}
                                </Badge>
                                <DialogTitle className="text-xl font-bold text-white leading-tight truncate">
                                    {request.itemName || "Unknown Item"}
                                </DialogTitle>
                                <p className="text-white/70 text-sm mt-1 font-mono">
                                    #{request.id?.slice(-8) || 'N/A'}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-4xl font-black text-white">{request.quantityRequested}</div>
                                <div className="text-white/60 text-xs uppercase tracking-wider">units</div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-6 py-5 space-y-5 bg-gradient-to-b from-background to-muted/20">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="relative">
                                <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full" />
                                <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-primary animate-pulse" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50">
                                    <Boxes className="h-4 w-4 text-emerald-600 mb-1" />
                                    <div className="text-2xl font-bold text-emerald-700">{totalStock}</div>
                                    <div className="text-[10px] text-emerald-600/80 uppercase tracking-wide">In Stock</div>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 mb-1" />
                                    <div className="text-2xl font-bold text-amber-700">{stockItem?.lowStockThreshold || 0}</div>
                                    <div className="text-[10px] text-amber-600/80 uppercase tracking-wide">Threshold</div>
                                </div>
                                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                                    <Package className="h-4 w-4 text-blue-600 mb-1" />
                                    <div className="text-2xl font-bold text-blue-700">{request.quantityRequested}</div>
                                    <div className="text-[10px] text-blue-600/80 uppercase tracking-wide">Ordered</div>
                                </div>
                            </div>

                            {/* Low Stock Alert */}
                            {isLowStock && (
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60 rounded-xl">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-700">Low Stock Alert</p>
                                        <p className="text-xs text-red-600/80">Stock is at or below threshold</p>
                                    </div>
                                </div>
                            )}

                            {/* Timeline & Details */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Timeline & Details
                                </h4>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Created</p>
                                        <p className="text-sm font-medium">{formatOrderDate(request.createdAt)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Requested By</p>
                                        <p className="text-sm font-medium flex items-center gap-1.5">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            {request.requestedBy || 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {/* Previous Order Highlight */}
                                {previousOrders.length > 0 && (
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 text-violet-700">
                                                <History className="h-3.5 w-3.5" />
                                                <span className="text-xs font-semibold uppercase tracking-wide">Last Order</span>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] h-5 bg-white/80 border-violet-200 text-violet-700">
                                                {STATUS_CONFIG[previousOrders[0].status]?.label || previousOrders[0].status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-violet-900">{previousOrders[0].quantityRequested} units</p>
                                                <p className="text-xs text-violet-600">
                                                    {previousOrders[0].createdAt
                                                        ? format(new Date(previousOrders[0].createdAt as any), 'MMM d, yyyy')
                                                        : 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-violet-500/80 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {previousOrders[0].createdAt
                                                        ? formatDistanceToNow(new Date(previousOrders[0].createdAt as any)) + ' ago'
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {request.notes && (
                                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-semibold uppercase tracking-wide">Notes</span>
                                    </div>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{request.notes}</p>
                                </div>
                            )}

                            {/* Stock Locations */}
                            {stockItem?.locations && stockItem.locations.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        Stock Locations
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {stockItem.locations.map((loc, idx) => (
                                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border shadow-sm">
                                                <span className="text-xs font-medium text-foreground/80">{loc.name}</span>
                                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold bg-primary/10 text-primary border-0">
                                                    {loc.quantity}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Machine Assignment */}
                            {stockItem?.assignedMachineId && (
                                <Link
                                    href={`/machines/${stockItem.assignedMachineId}`}
                                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-sky-50 border border-cyan-200/50 hover:border-cyan-300 transition-colors group"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-cyan-100 rounded-lg">
                                            <Cpu className="h-4 w-4 text-cyan-700" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-cyan-600 uppercase tracking-wide">Assigned Machine</p>
                                            <p className="font-semibold text-cyan-900">{stockItem.assignedMachineName || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-cyan-500 group-hover:text-cyan-700 transition-colors" />
                                </Link>
                            )}

                            {/* Replacement Machines */}
                            {stockItem?.replacementMachines && stockItem.replacementMachines.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                        Replacement for Machines
                                    </h4>
                                    <div className="space-y-1.5">
                                        {stockItem.replacementMachines.map((machine: any, idx: number) => (
                                            <Link
                                                key={idx}
                                                href={machine.id ? `/machines/${machine.id}` : '#'}
                                                className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200/40 rounded-lg hover:bg-amber-50 transition-colors group"
                                            >
                                                <span className="text-sm font-medium text-amber-900">{machine.name || machine}</span>
                                                {machine.id && <ArrowRight className="h-3.5 w-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Order History */}
                            {previousOrders.length > 1 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <History className="h-3.5 w-3.5" />
                                        Order History
                                    </h4>
                                    <div className="space-y-1.5">
                                        {previousOrders.slice(1).map((order, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg border border-border/30">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-sm">{order.quantityRequested}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {order.createdAt ? formatDistanceToNow(new Date(order.createdAt as any)) + ' ago' : ''}
                                                    </span>
                                                </div>
                                                <Badge
                                                    className={cn(
                                                        "text-[9px] font-medium",
                                                        STATUS_CONFIG[order.status]?.bg,
                                                        STATUS_CONFIG[order.status]?.text
                                                    )}
                                                >
                                                    {STATUS_CONFIG[order.status]?.label || order.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Item Link */}
                            {request.itemId && (
                                <Link
                                    href={`/inventory/${request.itemId}`}
                                    className="flex items-center justify-center gap-2 p-3 mt-2 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all group"
                                >
                                    <Package className="h-4 w-4" />
                                    <span className="font-medium text-sm">View Full Item Details</span>
                                    <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
