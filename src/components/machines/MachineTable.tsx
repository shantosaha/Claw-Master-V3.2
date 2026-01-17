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
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Package, Archive, RotateCcw } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";
import { isCraneMachine } from "@/utils/machineTypeUtils";

interface MachineTableProps {
    machines: MachineDisplayItem[];
    onEdit: (machine: MachineDisplayItem) => void;
    onDelete: (machine: MachineDisplayItem) => void;
    onStatusUpdate: (machine: MachineDisplayItem, status: string) => void;
    onAssignStock: (machine: ArcadeMachine, slotId?: string) => void;
    onStockLevelChange: (item: StockItem, newLevel: string) => void;
    onRestore?: (machine: MachineDisplayItem) => void;
}

type SortField = 'assetTag' | 'name' | 'location' | 'prizeSize' | 'status' | 'playCount' | 'revenue' | 'currentItemName' | 'stockLevel' | 'queueLength';
type SortDirection = 'asc' | 'desc' | null;

export function MachineTable({
    machines,
    onEdit,
    onDelete,
    onStatusUpdate,
    onAssignStock,
    onStockLevelChange,
    onRestore
}: MachineTableProps) {
    const router = useRouter();
    const [sortField, setSortField] = useState<SortField>('assetTag');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
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
                case 'status':
                    return item.slotStatus || item.status || '';
                case 'assetTag':
                    return item.assetTag || (item as any).tag || '';
                case 'name':
                    return item.name || '';
                default:
                    return (item as any)[field];
            }
        };

        const aValue = getValue(a, sortField);
        const bValue = getValue(b, sortField);

        // Natural sort helper that handles numbers correctly
        const compareValues = (v1: any, v2: any, field: SortField): number => {
            // Handle numeric fields first
            const numericFields: SortField[] = ['playCount', 'revenue', 'queueLength'];
            if (numericFields.includes(field)) {
                const n1 = Number(v1) || 0;
                const n2 = Number(v2) || 0;
                return n1 - n2;
            }

            // Priority sorting for stockLevel
            if (field === 'stockLevel') {
                const priority: Record<string, number> = {
                    'Full': 0, 'In Stock': 0,
                    'Good': 1, 'Limited Stock': 2,
                    'Low': 3, 'Low Stock': 3,
                    'Empty': 4, 'Out of Stock': 4
                };
                const p1 = priority[String(v1)] ?? 99;
                const p2 = priority[String(v2)] ?? 99;
                return p1 - p2;
            }

            // Natural sort for strings
            const s1 = String(v1 || '').trim();
            const s2 = String(v2 || '').trim();

            return s1.localeCompare(s2, undefined, {
                numeric: true,
                sensitivity: 'base'
            });
        };

        let result = compareValues(aValue, bValue, sortField);

        // Secondary sort for stability (Tag)
        if (result === 0) {
            const aTag = a.assetTag || (a as any).tag || '';
            const bTag = b.assetTag || (b as any).tag || '';
            result = aTag.localeCompare(bTag, undefined, { numeric: true });
        }

        // Tertiary sort for absolute stability (Name)
        if (result === 0) {
            const aName = String(a.name || '');
            const bName = String(b.name || '');
            result = aName.localeCompare(bName, undefined, { numeric: true });
        }

        // Final fallback for multi-slot stability (Slot ID)
        if (result === 0) {
            const aSid = String(a.slotId || a.id);
            const bSid = String(b.slotId || b.id);
            result = aSid.localeCompare(bSid);
        }

        return sortDirection === 'asc' ? result : -result;
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
                            const isCrane = isCraneMachine(item.originalMachine);

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
                                                    src={getThumbnailUrl(item.imageUrl, 64)}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    decoding="async"
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
                                        {isCrane ? (
                                            currentSlot?.currentItem ? (
                                                <Link
                                                    href={`/inventory/${currentSlot.currentItem.id || (currentSlot.currentItem as any).itemId}`}
                                                    className="flex items-center gap-2 hover:underline group"
                                                >
                                                    {currentSlot.currentItem.imageUrl ? (
                                                        <img
                                                            src={getThumbnailUrl(currentSlot.currentItem.imageUrl, 48)}
                                                            alt={currentSlot.currentItem.name}
                                                            loading="lazy"
                                                            decoding="async"
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
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-1">
                                        {isCrane ? (
                                            currentSlot ? (() => {
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
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="px-2 py-1 hidden md:table-cell max-w-[140px]">
                                        {isCrane ? (
                                            currentSlot?.upcomingQueue && currentSlot.upcomingQueue.length > 0 ? (
                                                (() => {
                                                    const queueItem = currentSlot.upcomingQueue[0];
                                                    return (
                                                        <Link
                                                            href={`/inventory/${queueItem.itemId || (queueItem as any).id}`}
                                                            className="flex items-center gap-2 hover:underline"
                                                        >
                                                            {queueItem.imageUrl ? (
                                                                <img
                                                                    src={getThumbnailUrl(queueItem.imageUrl, 48)}
                                                                    alt={queueItem.name}
                                                                    loading="lazy"
                                                                    decoding="async"
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
                                            )
                                        ) : (
                                            <span className="text-muted-foreground text-xs">N/A</span>
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
                                        <TooltipProvider delayDuration={300}>
                                            <div className="flex items-center justify-end gap-0.5">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top"><p>Edit</p></TooltipContent>
                                                </Tooltip>
                                                {item.originalMachine.isArchived && onRestore ? (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                onClick={(e) => { e.stopPropagation(); onRestore(item); }}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top"><p>Restore</p></TooltipContent>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                                                            >
                                                                <Archive className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top"><p>{item.isSlot && item.slotId ? "Delete Slot" : "Archive"}</p></TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </TooltipProvider>
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
