"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArcadeMachine, MachineDisplayItem, StockItem } from "@/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Package } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MachineTableProps {
    machines: MachineDisplayItem[];
    onEdit: (machine: MachineDisplayItem) => void;
    onDelete: (machine: MachineDisplayItem) => void;
    onStatusUpdate: (machine: MachineDisplayItem, status: string) => void;
    onAssignStock: (machine: ArcadeMachine, slotId?: string) => void;
    onStockLevelChange: (item: StockItem, newLevel: string) => void;
}

type SortField = 'assetTag' | 'name' | 'location' | 'prizeSize' | 'status' | 'playCount' | 'revenue' | 'currentItemName' | 'stockLevel' | 'queueLength';
type SortDirection = 'asc' | 'desc' | null;

export function MachineTable({
    machines,
    onEdit,
    onDelete,
    onStatusUpdate,
    onAssignStock,
    onStockLevelChange
}: MachineTableProps) {
    const router = useRouter();
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);

    const getStatusColor = (status: string) => {
        const normalized = status.toLowerCase();
        switch (normalized) {
            case 'online': return "default";
            case 'maintenance': return "secondary";
            case 'error': return "destructive";
            case 'offline': return "outline";
            default: return "secondary";
        }
    };

    const getStockLevelColorClass = (level: string) => {
        switch (level) {
            case "In Stock":
                return "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50";
            case "Limited Stock":
                return "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50";
            case "Low Stock":
                return "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50";
            case "Out of Stock":
                return "bg-red-50 text-red-600 border-red-200 hover:bg-red-50";
            // Legacy fallbacks
            case 'Full': return "bg-emerald-50 text-emerald-600 border-emerald-200";
            case 'Good': return "bg-blue-50 text-blue-600 border-blue-200";
            case 'Low': return "bg-orange-50 text-orange-600 border-orange-200";
            case 'Empty': return "bg-red-50 text-red-600 border-red-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortDirection(null);
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        if (sortDirection === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4" />;
        }
        return <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const sortedMachines = [...machines].sort((a, b) => {
        if (!sortField || !sortDirection) return 0;

        const getValue = (item: MachineDisplayItem, field: SortField) => {
            let currentSlot = null;
            if (item.isSlot && item.slotId) {
                currentSlot = item.slots.find(s => s.id === item.slotId);
            } else if (item.slots && item.slots.length > 0) {
                currentSlot = item.slots[0];
            }

            switch (field) {
                case 'currentItemName':
                    return currentSlot?.currentItem?.name || '';
                case 'stockLevel':
                    return currentSlot?.stockLevel || '';
                case 'queueLength':
                    return currentSlot?.upcomingQueue?.length || 0;
                default:
                    return (item as any)[field];
            }
        };

        let aValue = getValue(a, sortField);
        let bValue = getValue(b, sortField);

        // Handle null/undefined values
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Convert to string for comparison
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="h-10 text-xs">
                        <TableHead className="w-[70px] px-2 h-10">
                            <div
                                onClick={() => handleSort('assetTag')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Tag
                                {getSortIcon('assetTag')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10">
                            <div
                                onClick={() => handleSort('name')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Machine
                                {getSortIcon('name')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10 hidden md:table-cell">
                            <div
                                onClick={() => handleSort('location')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Location
                                {getSortIcon('location')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10 hidden lg:table-cell">
                            <div
                                onClick={() => handleSort('prizeSize')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Size
                                {getSortIcon('prizeSize')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10">
                            <div
                                onClick={() => handleSort('currentItemName')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Current Item
                                {getSortIcon('currentItemName')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10">
                            <div
                                onClick={() => handleSort('stockLevel')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Stock Level
                                {getSortIcon('stockLevel')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10 hidden md:table-cell">
                            <div
                                onClick={() => handleSort('queueLength')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Upcoming
                                {getSortIcon('queueLength')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10 hidden xl:table-cell">
                            <div
                                onClick={() => handleSort('revenue')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Rev
                                {getSortIcon('revenue')}
                            </div>
                        </TableHead>
                        <TableHead className="px-2 h-10">
                            <div
                                onClick={() => handleSort('status')}
                                className="flex items-center cursor-pointer hover:text-foreground"
                            >
                                Status
                                {getSortIcon('status')}
                            </div>
                        </TableHead>
                        <TableHead className="text-right px-2 h-10">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedMachines.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={10} className="text-center h-24">
                                No machines found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedMachines.map((item) => {
                            let currentSlot = null;
                            if (item.isSlot && item.slotId) {
                                currentSlot = item.slots.find(s => s.id === item.slotId);
                            } else if (item.slots && item.slots.length > 0) {
                                currentSlot = item.slots[0];
                            }

                            const displayStatus = item.slotStatus || item.status;

                            return (
                                <TableRow
                                    key={item.slotId || item.id}
                                    className="hover:bg-muted/50 text-sm h-12"
                                >
                                    <TableCell className="font-medium w-[70px] px-2 py-1">
                                        <Link
                                            href={item.isSlot && item.slotId ? `/machines/${item.id}?slotId=${item.slotId}` : `/machines/${item.id}`}
                                            className="hover:underline block truncate"
                                            title={item.assetTag}
                                        >
                                            {item.assetTag}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="px-2 py-1 max-w-[180px]">
                                        <Link
                                            href={item.isSlot && item.slotId ? `/machines/${item.id}?slotId=${item.slotId}` : `/machines/${item.id}`}
                                            className="hover:underline flex items-center gap-2"
                                        >
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="w-8 h-8 rounded object-cover flex-shrink-0 hidden sm:block"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-[10px] flex-shrink-0 hidden sm:flex">
                                                    N/A
                                                </div>
                                            )}
                                            <span className="truncate" title={item.name}>{item.name}</span>
                                        </Link>
                                    </TableCell>
                                    <TableCell className="px-2 py-1 hidden md:table-cell max-w-[100px] truncate" title={item.location}>
                                        {item.location || "-"}
                                    </TableCell>
                                    <TableCell className="px-2 py-1 hidden lg:table-cell">{item.prizeSize || "-"}</TableCell>
                                    <TableCell className="px-2 py-1 max-w-[160px]">
                                        {currentSlot?.currentItem ? (
                                            <Link
                                                href={`/inventory/${currentSlot.currentItem.id}`}
                                                className="flex items-center gap-2 hover:underline group"
                                            >
                                                {currentSlot.currentItem.imageUrl ? (
                                                    <img
                                                        src={currentSlot.currentItem.imageUrl}
                                                        alt={currentSlot.currentItem.name}
                                                        className="w-6 h-6 rounded object-cover flex-shrink-0 bg-muted group-hover:ring-1 group-hover:ring-primary/20 transition-all hidden sm:block"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0 hidden sm:flex">
                                                        <Package className="h-3 w-3" />
                                                    </div>
                                                )}
                                                <span className="text-blue-600 font-medium truncate" title={currentSlot.currentItem.name}>
                                                    {currentSlot.currentItem.name}
                                                </span>
                                            </Link>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 -ml-2"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (currentSlot) onAssignStock(item.originalMachine, currentSlot.id);
                                                }}
                                            >
                                                + Assign
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-1">
                                        {currentSlot ? (() => {
                                            // Calculate quantity for display
                                            const locationsSum = currentSlot.currentItem?.locations?.reduce((sum, loc) => sum + loc.quantity, 0);
                                            const stockQty = locationsSum !== undefined ? locationsSum : 0;

                                            return currentSlot.currentItem ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-6 px-1 hover:bg-transparent">
                                                            <Badge
                                                                className={cn("cursor-pointer border select-none whitespace-nowrap text-[10px] px-1.5 py-0 h-5", getStockLevelColorClass(currentSlot.stockLevel))}
                                                                variant="outline"
                                                            >
                                                                {currentSlot.stockLevel || "Unknown"} <sup className="ml-0.5 font-bold">{stockQty}</sup>
                                                            </Badge>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuLabel>Update Stock Level</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => onStockLevelChange(currentSlot!.currentItem!, 'In Stock')}>In Stock</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onStockLevelChange(currentSlot!.currentItem!, 'Limited Stock')}>Limited Stock</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onStockLevelChange(currentSlot!.currentItem!, 'Low Stock')}>Low Stock</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => onStockLevelChange(currentSlot!.currentItem!, 'Out of Stock')}>Out of Stock</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Badge
                                                    className={cn("border select-none whitespace-nowrap text-[10px] px-1.5 py-0 h-5", getStockLevelColorClass(currentSlot.stockLevel))}
                                                    variant="outline"
                                                >
                                                    {currentSlot.stockLevel || "No Item"}
                                                </Badge>
                                            );
                                        })() : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-1 hidden md:table-cell max-w-[140px]">
                                        {currentSlot?.upcomingQueue && currentSlot.upcomingQueue.length > 0 ? (
                                            (() => {
                                                const queueItem = currentSlot.upcomingQueue[0];
                                                return (
                                                    <Link
                                                        href={`/inventory/${queueItem.itemId}`}
                                                        className="flex items-center gap-2 hover:underline"
                                                    >
                                                        {queueItem.imageUrl ? (
                                                            <img
                                                                src={queueItem.imageUrl}
                                                                alt={queueItem.name}
                                                                className="w-6 h-6 rounded object-cover flex-shrink-0 bg-muted hidden sm:block"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground flex-shrink-0 hidden sm:flex">
                                                                IMG
                                                            </div>
                                                        )}
                                                        <span className="text-xs truncate" title={queueItem.name}>
                                                            {queueItem.name}
                                                        </span>
                                                        {currentSlot.upcomingQueue.length > 1 && (
                                                            <span className="text-[10px] text-muted-foreground ml-1">
                                                                (+{currentSlot.upcomingQueue.length - 1})
                                                            </span>
                                                        )}
                                                    </Link>
                                                );
                                            })()
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-muted-foreground hover:text-blue-600 hover:bg-muted -ml-2"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (currentSlot) onAssignStock(item.originalMachine, currentSlot.id);
                                                }}
                                            >
                                                + Queue
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-1 hidden xl:table-cell">{item.revenue ? `$${item.revenue.toFixed(2)}` : "-"}</TableCell>
                                    <TableCell className="px-2 py-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-6 px-1 hover:bg-transparent">
                                                    <Badge variant={getStatusColor(displayStatus) as any} className="cursor-pointer text-[10px] px-1 py-0 h-5 whitespace-nowrap">
                                                        {displayStatus}
                                                    </Badge>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onStatusUpdate(item, 'Online')}>Online</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusUpdate(item, 'Maintenance')}>Maintenance</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusUpdate(item, 'Offline')}>Offline</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onStatusUpdate(item, 'Error')}>Error</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-1">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => onDelete(item)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> {item.isSlot && item.slotId ? "Delete Slot" : "Delete Machine"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
