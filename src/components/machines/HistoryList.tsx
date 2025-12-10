"use client";

import { AuditLog } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HistoryListProps {
    history: AuditLog[];
}

export function HistoryList({ history }: HistoryListProps) {
    if (!history || history.length === 0) {
        return <div className="text-sm text-muted-foreground text-center py-4">No history available.</div>;
    }

    // Sort by timestamp desc
    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="space-y-4">
                {sortedHistory.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>{log.userId.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{log.action.toUpperCase()}</span>
                                <span className="text-muted-foreground text-xs">
                                    {formatDate(log.timestamp, "MMM d, HH:mm")}
                                </span>
                            </div>
                            <p className="text-muted-foreground">
                                {(() => {
                                    if (!log.details) return "-";
                                    if (typeof log.details === 'string') return log.details;
                                    const d = log.details as Record<string, unknown>;
                                    if (d.message) return String(d.message);
                                    if (d.reason) return String(d.reason);
                                    return JSON.stringify(d);
                                })()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
