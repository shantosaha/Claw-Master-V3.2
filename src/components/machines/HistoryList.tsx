"use client";

import { AuditLog } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, RefreshCw, Settings, ArrowRight } from "lucide-react";

interface HistoryListProps {
    history: AuditLog[];
}

// Get icon and color for action type
const getActionDisplay = (action: string) => {
    const normalizedAction = action.toLowerCase().replace(/_/g, " ");

    if (normalizedAction.includes("field") || normalizedAction.includes("update")) {
        return { icon: Pencil, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    }
    if (normalizedAction.includes("create") || normalizedAction.includes("add")) {
        return { icon: Plus, color: "bg-green-500/10 text-green-500 border-green-500/20" };
    }
    if (normalizedAction.includes("delete") || normalizedAction.includes("remove")) {
        return { icon: Trash2, color: "bg-red-500/10 text-red-500 border-red-500/20" };
    }
    if (normalizedAction.includes("sync") || normalizedAction.includes("rotate")) {
        return { icon: RefreshCw, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
    }
    return { icon: Settings, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" };
};

// Format details for display
const formatDetails = (log: AuditLog): React.ReactNode => {
    if (!log.details) return <span className="text-muted-foreground">-</span>;
    if (typeof log.details === 'string') return <span>{log.details}</span>;

    const d = log.details as Record<string, unknown>;

    // Field update format
    if (d.field && d.oldValue !== undefined && d.newValue !== undefined) {
        return (
            <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="font-medium text-foreground">{String(d.field)}:</span>
                <span className="text-muted-foreground line-through">
                    {String(d.oldValue) || "Not set"}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground font-medium">
                    {String(d.newValue) || "Not set"}
                </span>
            </div>
        );
    }

    // Generic message format
    if (d.message) return <span>{String(d.message)}</span>;
    if (d.reason) return <span>{String(d.reason)}</span>;

    // Fallback: show key-value pairs
    const entries = Object.entries(d).slice(0, 3);
    return (
        <div className="text-xs text-muted-foreground">
            {entries.map(([key, val]) => (
                <span key={key} className="mr-2">
                    {key}: <span className="font-medium">{String(val)}</span>
                </span>
            ))}
        </div>
    );
};

export function HistoryList({ history }: HistoryListProps) {
    if (!history || history.length === 0) {
        return (
            <div className="text-sm text-muted-foreground text-center py-8">
                <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No activity recorded yet.
            </div>
        );
    }

    // Sort by timestamp desc
    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <ScrollArea className="h-[350px] w-full">
            <div className="space-y-3 pr-4">
                {sortedHistory.map((log) => {
                    const { icon: Icon, color } = getActionDisplay(log.action);

                    return (
                        <div key={log.id} className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0">
                            <div className={`p-1.5 rounded-md ${color} shrink-0`}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                                        {log.action.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                        {formatDate(log.timestamp, "MMM d, yyyy 'at' HH:mm")}
                                    </span>
                                </div>
                                <div className="text-muted-foreground">
                                    {formatDetails(log)}
                                </div>
                                {log.userRole && (
                                    <div className="text-[10px] text-muted-foreground/70">
                                        by {log.userId.substring(0, 8)}... ({log.userRole})
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
