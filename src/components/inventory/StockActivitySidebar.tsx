"use client";

import { AuditLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import {
    History,
    Package,
    Edit,
    Plus,
    Minus,
    Bot,
    Trash2,
    ArrowRight,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    User,
    AlertTriangle,
    CheckCircle,
    Clock
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface StockActivitySidebarProps {
    history?: AuditLog[];
    onViewAll?: () => void;
    maxItems?: number;
}

const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("add")) return <Plus className="h-3 w-3" />;
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) return <Trash2 className="h-3 w-3" />;
    if (lowerAction.includes("update") || lowerAction.includes("edit")) return <Edit className="h-3 w-3" />;
    if (lowerAction.includes("unassign")) return <Minus className="h-3 w-3" />;
    if (lowerAction.includes("assign") || lowerAction.includes("machine")) return <Bot className="h-3 w-3" />;
    if (lowerAction.includes("adjust") || lowerAction.includes("stock_level")) return <TrendingUp className="h-3 w-3" />;
    if (lowerAction.includes("stock")) return <Package className="h-3 w-3" />;
    if (lowerAction.includes("transfer") || lowerAction.includes("move")) return <ArrowRight className="h-3 w-3" />;
    if (lowerAction.includes("sync") || lowerAction.includes("refresh")) return <RefreshCw className="h-3 w-3" />;
    if (lowerAction.includes("status")) return <CheckCircle className="h-3 w-3" />;
    return <History className="h-3 w-3" />;
};

const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("add")) return "bg-green-500";
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) return "bg-red-500";
    if (lowerAction.includes("update") || lowerAction.includes("edit")) return "bg-blue-500";
    if (lowerAction.includes("unassign")) return "bg-orange-500";
    if (lowerAction.includes("assign")) return "bg-purple-500";
    if (lowerAction.includes("stock_level")) return "bg-amber-500";
    if (lowerAction.includes("adjust") || lowerAction.includes("stock")) return "bg-cyan-500";
    if (lowerAction.includes("status")) return "bg-indigo-500";
    return "bg-gray-500";
};

// Format action name for display
const formatActionName = (action: string) => {
    return action
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Get a human-readable description of the activity
const getActivityDescription = (log: AuditLog): string => {
    const details = log.details || {};
    const action = log.action.toLowerCase();

    // Stock level changes
    if (action.includes("stock_level")) {
        const oldStatus = details.oldStatus || "Unknown";
        const newStatus = details.newStatus || "Unknown";
        const qty = details.quantitySetTo;
        if (qty !== undefined) {
            return `Changed from "${oldStatus}" to "${newStatus}" (qty: ${qty})`;
        }
        return `Changed from "${oldStatus}" to "${newStatus}"`;
    }

    // Machine assignment
    if (action.includes("assign_machine")) {
        const machine = details.machine || "Unknown";
        const status = details.status || "Assigned";
        return `Assigned to ${machine} as "${status}"`;
    }

    // Machine unassignment
    if (action.includes("unassign")) {
        const machine = details.machine || "Unknown";
        const reason = details.reason || "Manual removal";
        return `Removed from ${machine}: ${reason}`;
    }

    // Status change
    if (action.includes("status_change")) {
        const oldStatus = details.oldStatus || "Unknown";
        const newStatus = details.newStatus || "Unknown";
        const machine = details.machine;
        if (machine && machine !== "None") {
            return `${oldStatus} → ${newStatus} on ${machine}`;
        }
        return `${oldStatus} → ${newStatus}`;
    }

    // Stock adjustment
    if (action.includes("adjust_stock")) {
        const location = details.location || "Unknown";
        const change = details.change;
        const newQty = details.newQuantity;
        if (change !== undefined && newQty !== undefined) {
            const changeText = typeof change === "number" ? (change >= 0 ? `+${change}` : change) : change;
            return `${location}: ${changeText} → ${newQty} units`;
        }
        return `Stock adjusted at ${location}`;
    }

    // Create item
    if (action.includes("create")) {
        const category = details.category || "";
        const qty = details.initialQuantity;
        if (category && qty !== undefined) {
            return `Created with ${qty} units in ${category}`;
        }
        return "Item created";
    }

    // Update item
    if (action.includes("update")) {
        const changes = details.changes || "";
        if (typeof changes === 'string' && changes) {
            return changes;
        }
        return "Item details updated";
    }

    // Default: try to extract a reason or show raw details
    if (typeof details.reason === 'string') {
        return details.reason;
    }

    // Return a summary of the details
    const summary = Object.entries(details)
        .filter(([_, v]) => v !== undefined && v !== null)
        .slice(0, 2)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

    return summary || "Activity recorded";
};

// Get who performed the action
const getPerformedBy = (log: AuditLog): string | null => {
    const details = log.details || {};
    if (details.changedBy && typeof details.changedBy === 'string') {
        return details.changedBy;
    }
    if (log.userId && log.userId !== "system") return log.userId;
    return null;
};

export function StockActivitySidebar({
    history = [],
    onViewAll,
    maxItems = 8
}: StockActivitySidebarProps) {
    // Sort by date descending and take first N items
    const sortedHistory = [...history]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Activity Log
                    </CardTitle>
                    {history.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {history.length} events
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {sortedHistory.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-muted-foreground">
                            No activity recorded yet.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Changes to this item will appear here.
                        </p>
                    </div>
                ) : (
                    <TooltipProvider>
                        <ScrollArea className="h-[280px] pr-1">
                            <div className="space-y-1">
                                {sortedHistory.map((log, index) => {
                                    const performedBy = getPerformedBy(log);
                                    const description = getActivityDescription(log);

                                    return (
                                        <Tooltip key={log.id || index}>
                                            <TooltipTrigger asChild>
                                                <div className="flex gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default group">
                                                    {/* Timeline dot */}
                                                    <div className="flex flex-col items-center shrink-0">
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm ${getActionColor(log.action)}`}>
                                                            {getActionIcon(log.action)}
                                                        </div>
                                                        {index < sortedHistory.length - 1 && (
                                                            <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-medium text-xs text-foreground truncate">
                                                                {formatActionName(log.action)}
                                                            </p>
                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                                                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                                                            {description}
                                                        </p>
                                                        {performedBy && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                                                <User className="h-2.5 w-2.5" />
                                                                <span>{performedBy}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-[300px]">
                                                <div className="space-y-1">
                                                    <p className="font-semibold">{formatActionName(log.action)}</p>
                                                    <p className="text-xs">{description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(log.timestamp), "PPpp")}
                                                    </p>
                                                    {performedBy && (
                                                        <p className="text-xs text-muted-foreground">
                                                            By: {performedBy}
                                                        </p>
                                                    )}
                                                    {log.details && Object.keys(log.details).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t text-xs">
                                                            {Object.entries(log.details)
                                                                .filter(([k, v]) => v !== undefined && v !== null)
                                                                .map(([k, v]) => (
                                                                    <div key={k} className="flex justify-between">
                                                                        <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                                        <span className="font-medium">{String(v)}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </TooltipProvider>
                )}

                {history.length > maxItems && onViewAll && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 text-xs"
                        onClick={onViewAll}
                    >
                        View All {history.length} Activities →
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
