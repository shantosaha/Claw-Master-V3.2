"use client";

import { AuditLog } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
    History,
    Package,
    Edit,
    Plus,
    Minus,
    Bot,
    Trash2,
    ArrowRight,
    RefreshCw
} from "lucide-react";

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
    if (lowerAction.includes("assign") || lowerAction.includes("machine")) return <Bot className="h-3 w-3" />;
    if (lowerAction.includes("adjust") || lowerAction.includes("stock")) return <Package className="h-3 w-3" />;
    if (lowerAction.includes("transfer") || lowerAction.includes("move")) return <ArrowRight className="h-3 w-3" />;
    if (lowerAction.includes("sync") || lowerAction.includes("refresh")) return <RefreshCw className="h-3 w-3" />;
    return <History className="h-3 w-3" />;
};

const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("add")) return "bg-green-500";
    if (lowerAction.includes("delete") || lowerAction.includes("remove")) return "bg-red-500";
    if (lowerAction.includes("update") || lowerAction.includes("edit")) return "bg-blue-500";
    if (lowerAction.includes("assign")) return "bg-purple-500";
    if (lowerAction.includes("adjust") || lowerAction.includes("stock")) return "bg-orange-500";
    return "bg-gray-500";
};

export function StockActivitySidebar({
    history = [],
    onViewAll,
    maxItems = 5
}: StockActivitySidebarProps) {
    // Sort by date descending and take first N items
    const sortedHistory = [...history]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Activity Log
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {sortedHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No activity recorded yet.
                    </p>
                ) : (
                    <ScrollArea className="h-[200px]">
                        <div className="space-y-3">
                            {sortedHistory.map((log, index) => (
                                <div key={log.id || index} className="flex gap-3 text-sm">
                                    {/* Timeline dot */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${getActionColor(log.action)}`}>
                                            {getActionIcon(log.action)}
                                        </div>
                                        {index < sortedHistory.length - 1 && (
                                            <div className="w-px h-full bg-border mt-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-3">
                                        <p className="font-medium text-xs">
                                            {log.action.replace(/_/g, " ")}
                                        </p>
                                        {log.details && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {typeof log.details === 'string'
                                                    ? log.details
                                                    : log.details?.reason || JSON.stringify(log.details)
                                                }
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}

                {history.length > maxItems && onViewAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 text-xs"
                        onClick={onViewAll}
                    >
                        View All Activity →
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
