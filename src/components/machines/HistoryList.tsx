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
                                {typeof log.details === 'string' ? log.details : (log.details?.reason || JSON.stringify(log.details) || "-")}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
