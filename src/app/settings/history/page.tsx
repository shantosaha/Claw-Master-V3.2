"use client";

import { useEffect, useState } from "react";
import { auditService } from "@/services";
import { AuditLog } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsHistoryPage() {
    const { userProfile, hasRole, loading: authLoading } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!authLoading) {
            // Check roles: admin, manager, or supervisor
            if (!userProfile || !hasRole(["admin", "manager"])) {
                toast.error("Unauthorized", { description: "You do not have permission to view activity logs." });
                router.push("/dashboard");
                return;
            }
            loadLogs();
        }
    }, [userProfile, authLoading, hasRole, router]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await auditService.getAll();
            // Sort by timestamp desc
            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setLogs(data);
        } catch (error) {
            console.error("Failed to load audit logs:", error);
            toast.error("Failed to load logs");
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

    const formatDetails = (details: any) => {
        if (!details) return "-";

        // Handle nicely formatted specific fields
        if (details.changes && Array.isArray(details.changes)) {
            return (
                <div className="flex flex-col gap-1 text-xs">
                    {details.changes.map((change: string, idx: number) => (
                        <span key={idx} className="block">• {change}</span>
                    ))}
                </div>
            );
        }

        // Handle name/category create/update
        if (details.name) {
            return (
                <div className="text-xs">
                    <span className="font-semibold">{details.name}</span>
                    {details.category && <span className="text-muted-foreground"> ({details.category})</span>}
                    {details.reason && <div className="text-muted-foreground mt-1">{details.reason}</div>}
                </div>
            );
        }

        // Fallback to simpler view or JSON
        if (typeof details === 'object') {
            // Try to show meaningful fields
            const entries = Object.entries(details).filter(([k]) => k !== 'changes');
            if (entries.length > 0) {
                return (
                    <div className="text-xs grid gap-1">
                        {entries.map(([key, value]) => (
                            <div key={key} className="flex gap-1">
                                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="text-muted-foreground">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                );
            }
        }

        return JSON.stringify(details);
    };

    if (authLoading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
                                            <TableCell className="max-w-md" title={log.details ? JSON.stringify(log.details) : undefined}>
                                                {formatDetails(log.details)}
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
