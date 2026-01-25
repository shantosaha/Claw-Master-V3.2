"use client";

import { useState, useEffect, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { MachineStatus, MonitoringReportItem } from "@/services/monitoringService";

type ExtendedMachineStatus = MachineStatus & Partial<MonitoringReportItem> & { group?: string; points?: number };

interface NonCraneReportTableProps {
    data: ExtendedMachineStatus[];
}

type SortKey = 'tag' | 'description' | 'status' | 'location' | 'customerPlays' | 'staffPlays' | 'revenue' | 'cashRevenue' | 'bonusRevenue' | 'lastUpdated' | 'points';

/**
 * Simplified report table for non-crane machines.
 * Excludes claw-specific columns (C1-C4, payout accuracy, etc.)
 */
export function NonCraneReportTable({ data }: NonCraneReportTableProps) {
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
    const [pageSize, setPageSize] = useState(25);

    // Reset page when data changes
    useEffect(() => {
        setPage(1);
    }, [data.length]);

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'tag':
                        aValue = a.assetTag || a.tag || '';
                        bValue = b.assetTag || b.tag || '';
                        break;
                    case 'description':
                        aValue = a.name || '';
                        bValue = b.name || '';
                        break;
                    case 'status':
                        aValue = a.status || '';
                        bValue = b.status || '';
                        break;
                    case 'location':
                        aValue = a.location || '';
                        bValue = b.location || '';
                        break;
                    case 'customerPlays':
                        aValue = a.customerPlays || 0;
                        bValue = b.customerPlays || 0;
                        break;
                    case 'staffPlays':
                        aValue = a.staffPlays || 0;
                        bValue = b.staffPlays || 0;
                        break;
                    case 'revenue':
                        aValue = a.revenue || 0;
                        bValue = b.revenue || 0;
                        break;
                    case 'cashRevenue':
                        aValue = a.cashRevenue || 0;
                        bValue = b.cashRevenue || 0;
                        break;
                    case 'bonusRevenue':
                        aValue = a.bonusRevenue || 0;
                        bValue = b.bonusRevenue || 0;
                        break;
                    case 'lastUpdated':
                        aValue = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
                        bValue = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
                        break;
                    case 'points':
                        aValue = (a as any).points || 0;
                        bValue = (b as any).points || 0;
                        break;
                    default:
                        return 0;
                }

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

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const renderSortableHeader = (label: string, key: SortKey, className?: string) => (
        <TableHead className={cn("whitespace-nowrap text-center", className)}>
            <Button
                variant="ghost"
                size="sm"
                className="h-8 data-[state=open]:bg-accent w-full justify-center px-0 mx-0 font-bold"
                onClick={() => requestSort(key)}
            >
                {label}
                <SortIcon columnKey={key} />
            </Button>
        </TableHead>
    );

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No non-crane machines available
            </div>
        );
    }

    const statusBadgeVariants = {
        online: "bg-green-100 text-green-800 border-green-200",
        offline: "bg-gray-100 text-gray-800 border-gray-200",
        error: "bg-red-100 text-red-800 border-red-200",
        maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-md border bg-card">
                <Table containerClassName="max-h-[calc(100vh-220px)] overflow-y-auto">
                    <TableHeader>
                        <TableRow className="bg-muted/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
                            {renderSortableHeader("Status", "status", "w-[80px] px-0.5")}
                            {renderSortableHeader("Tag", "tag", "w-[50px] px-0.5")}
                            {renderSortableHeader("Machine", "description", "min-w-[120px] px-0.5")}
                            {renderSortableHeader("Location", "location", "w-[80px] px-0.5")}
                            {renderSortableHeader("Plays", "customerPlays", "w-[55px] px-0.5")}
                            {renderSortableHeader("Staff", "staffPlays", "w-[50px] px-0.5")}
                            {renderSortableHeader("Points", "points", "w-[55px] px-0.5")}
                            {renderSortableHeader("Total", "revenue", "w-[60px] px-0.5")}
                            {renderSortableHeader("Cash", "cashRevenue", "w-[50px] px-0.5")}
                            {renderSortableHeader("Bonus", "bonusRevenue", "w-[50px] px-0.5")}
                            {renderSortableHeader("Last Sync", "lastUpdated", "w-[80px] px-0.5")}
                            <TableHead className="w-[80px] px-0.5 text-center font-bold">Group</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.map((item) => {
                            const estimatedRevenue = (item.revenue || 0).toFixed(0);
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="px-0.5 text-center">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize text-[10px] px-1 py-0",
                                                statusBadgeVariants[item.status]
                                            )}
                                        >
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs px-0.5 text-center">{item.assetTag || item.tag || '-'}</TableCell>
                                    <TableCell className="px-0.5 text-center">
                                        <Link href={`/machines/${item.id}`} className="hover:underline text-primary font-medium text-xs">
                                            {item.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs px-0.5 text-center">{item.location}</TableCell>
                                    <TableCell className="text-center font-medium text-xs px-0.5">
                                        {!isNaN(Number(item.customerPlays)) ? item.customerPlays : '-'}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground text-xs px-0.5">
                                        {!isNaN(Number(item.staffPlays)) ? item.staffPlays : '-'}
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-purple-600 text-xs px-0.5">
                                        {item.points !== undefined && !isNaN(Number(item.points)) ? item.points : '-'}
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-green-600 text-xs px-0.5">
                                        ${isNaN(Number(item.revenue)) ? '0' : (item.revenue || 0).toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-center text-xs px-0.5 text-muted-foreground">
                                        ${isNaN(Number(item.cashRevenue)) ? '0' : (item.cashRevenue || 0).toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-center text-xs px-0.5 text-orange-600">
                                        ${isNaN(Number(item.bonusRevenue)) ? '0' : (item.bonusRevenue || 0).toFixed(0)}
                                    </TableCell>
                                    <TableCell className="text-center text-[10px] px-0.5 leading-tight text-muted-foreground">
                                        {item.lastUpdated ? (
                                            <>
                                                {format(new Date(item.lastUpdated), 'M/d/yy')}<br />
                                                {format(new Date(item.lastUpdated), 'h:mm a')}
                                            </>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="px-0.5 text-center">
                                        <Badge variant="secondary" className="text-[10px] px-1">
                                            {item.group || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sortedData.length)} of {sortedData.length}</span>
                        <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span>per page</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-2">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
