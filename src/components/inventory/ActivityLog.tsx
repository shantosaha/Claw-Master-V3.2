import { AuditLog } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface ActivityLogProps {
    logs?: AuditLog[];
}

export function ActivityLog({ logs = [] }: ActivityLogProps) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No activity recorded.
            </div>
        );
    }

    // Sort logs by date descending
    const sortedLogs = [...logs].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <ScrollArea className="h-[300px] rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">Date & Time</TableHead>
                        <TableHead className="w-[150px]">Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[150px]">User</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedLogs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium text-xs">
                                {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">
                                {log.action.replace(/_/g, " ")}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {typeof log.details === 'string' ? log.details : (log.details?.reason || JSON.stringify(log.details) || "-")}
                            </TableCell>
                            <TableCell className="text-xs">
                                {log.userId}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    );
}
