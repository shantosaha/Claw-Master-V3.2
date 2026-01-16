"use client";

import { useState, useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MonitoringReportItem } from "@/services/monitoringService";

interface NonCraneReportTableProps {
    data: MonitoringReportItem[];
}

export function NonCraneReportTable({ data }: NonCraneReportTableProps) {
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof MonitoringReportItem; direction: 'asc' | 'desc' } | null>(null);
    const [pageSize, setPageSize] = useState(50);

    // Reset page when data changes
    useEffect(() => {
        setPage(1);
    }, [data.length, data[0]?.machineId]);

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (aValue === undefined || bValue === undefined) return 0;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    const requestSort = (key: keyof MonitoringReportItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: keyof MonitoringReportItem }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-muted-foreground/30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-3.5 w-3.5 text-primary" /> : <ArrowDown className="ml-2 h-3.5 w-3.5 text-primary" />;
    };

    const renderSortableHeader = (label: string, key: keyof MonitoringReportItem, className?: string) => (
        <TableHead className={cn("text-xs font-black uppercase tracking-wider text-muted-foreground py-4", className)}>
            <Button
                variant="ghost"
                size="sm"
                className="-ml-3 h-8 hover:bg-transparent font-black"
                onClick={() => requestSort(key)}
            >
                {label}
                <SortIcon columnKey={key} />
            </Button>
        </TableHead>
    );

    if (data.length === 0) {
        return (
            <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-muted-foreground font-medium">No arcade machines found in this category</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            {renderSortableHeader("Status", "status", "w-[120px] pl-6")}
                            {renderSortableHeader("Tag", "tag", "w-[120px]")}
                            {renderSortableHeader("Machine Name", "description", "min-w-[200px]")}
                            {renderSortableHeader("Zone / Area", "description", "w-[150px]")}
                            {renderSortableHeader("Customer Plays", "customerPlays", "text-right")}
                            {renderSortableHeader("Staff Tests", "staffPlays", "text-right")}
                            {renderSortableHeader("Points/Tickets", "payouts", "text-right")}
                            <TableHead className="text-right text-xs font-black uppercase tracking-wider text-muted-foreground pr-6">Revenue (Est.)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item) => (
                            <TableRow key={item.machineId} className="group hover:bg-muted/10 transition-colors">
                                <TableCell className="pl-6">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-bold text-[10px] capitalize px-2 py-0.5",
                                            item.status === 'online' && "bg-green-50 text-green-700 border-green-200",
                                            item.status === 'offline' && "bg-gray-50 text-gray-500 border-gray-200",
                                            item.status === 'error' && "bg-red-50 text-red-700 border-red-200",
                                            item.status === 'maintenance' && "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full mr-1.5",
                                            item.status === 'online' ? "bg-green-500" : "bg-current"
                                        )} />
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-[11px] font-bold text-muted-foreground">
                                    {item.tag}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/machines/${item.machineId}`}
                                            className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1 group/link"
                                        >
                                            {item.description}
                                            <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </Link>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-medium">
                                    Main Floor
                                </TableCell>
                                <TableCell className="text-right font-black text-sm text-blue-600">
                                    {item.customerPlays?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-medium text-xs text-muted-foreground">
                                    {item.staffPlays?.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 font-bold text-[10px]">
                                        {item.payouts?.toLocaleString() || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-6 font-black text-sm text-green-600">
                                    ${((item.customerPlays || 0) * 3.6).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Page {page} of {totalPages} ({data.length} machines)
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-bold text-xs"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="font-bold text-xs"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
