"use client";

import { useEffect, useState } from "react";
import { auditService } from "@/services";
import { AuditLog } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SettingsHistoryPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getAll();
            // Sort by timestamp desc
            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase();
        const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';

        return (
            log.action.toLowerCase().includes(searchLower) ||
            log.entityType.toLowerCase().includes(searchLower) ||
            detailsStr.includes(searchLower) ||
            log.userId.toLowerCase().includes(searchLower)
        );
    });

    const getActionColor = (action: string): "destructive" | "default" | "secondary" | "outline" => {
        const lowerAction = action.toLowerCase();
        if (lowerAction.includes("create")) return "default";
        if (lowerAction.includes("update") || lowerAction.includes("edit")) return "secondary";
        if (lowerAction.includes("delete") || lowerAction.includes("remove")) return "destructive";
        return "outline";
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings History</h1>
                <p className="text-muted-foreground">
                    Audit log of all system changes and user actions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Audit Logs</CardTitle>
                            <CardDescription>View detailed history of changes.</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            Loading history...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(log.timestamp)}
                                            </TableCell>
                                            <TableCell>{log.userId}</TableCell>
                                            <TableCell>
                                                <Badge variant={getActionColor(log.action)}>
                                                    {log.action.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{log.entityType}</TableCell>
                                            <TableCell className="max-w-md truncate" title={log.details ? JSON.stringify(log.details) : undefined}>
                                                {log.details
                                                    ? (typeof log.details.reason === 'string'
                                                        ? log.details.reason
                                                        : JSON.stringify(log.details))
                                                    : "-"
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
