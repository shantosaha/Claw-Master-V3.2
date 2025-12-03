"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArcadeMachine, MachineDisplayItem } from "@/types";
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

interface MachineTableProps {
    machines: MachineDisplayItem[];
    onEdit: (machine: MachineDisplayItem) => void;
    onDelete: (machine: MachineDisplayItem) => void;
    onStatusUpdate: (machine: MachineDisplayItem, status: string) => void;
    onStockUpdate: (machine: MachineDisplayItem, stockLevel: 'Full' | 'Good' | 'Low' | 'Empty') => void;
}

type SortField = 'assetTag' | 'name' | 'prizeSize' | 'status' | 'playCount' | 'revenue';
type SortDirection = 'asc' | 'desc' | null;

export function MachineTable({ machines, onEdit, onDelete, onStatusUpdate, onStockUpdate }: MachineTableProps) {
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

        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

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

    const handleRowClick = (machineId: string, e: React.MouseEvent) => {
        // Don't navigate if clicking on action buttons
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menuitem"]')) {
            return;
        }
        router.push(`/machines/${machineId}`);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('assetTag')}
                                className="h-8 px-2"
                            >
                                Asset Tag
                                {getSortIcon('assetTag')}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('name')}
                                className="h-8 px-2"
                            >
                                Name
                                {getSortIcon('name')}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('prizeSize')}
                                className="h-8 px-2"
                            >
                                Prize Size
                                {getSortIcon('prizeSize')}
                            </Button>
                        </TableHead>
                        <TableHead>Current Item</TableHead>
                        <TableHead>Stock Level</TableHead>
                        <TableHead>Upcoming</TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('revenue')}
                                className="h-8 px-2"
                            >
                                Revenue
                                {getSortIcon('revenue')}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort('status')}
                                className="h-8 px-2"
                            >
                                Status
                                {getSortIcon('status')}
                            </Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                            // If it's a slot, we use the slot data. If it's a machine (no slots), we use the first slot if available or the machine itself
                            // But since we flattened it, 'item' is the display unit.
                            // However, we need to access stock info which is in the slot object.

                            // Find the specific slot object if this is a slot row
                            let currentSlot = null;
                            if (item.isSlot && item.slotId) {
                                currentSlot = item.slots.find(s => s.id === item.slotId);
                            } else if (item.slots && item.slots.length > 0) {
                                // Fallback for machine row if any (though we shouldn't have mixed rows if flattened correctly)
                                currentSlot = item.slots[0];
                            }

                            const displayStatus = item.slotStatus || item.status;

                            return (
                                <TableRow
                                    key={item.slotId || item.id}
                                    className="hover:bg-muted/50"
                                >
                                    <TableCell className="font-medium">
                                        <Link
                                            href={item.isSlot && item.slotId ? `/machines/${item.id}?slotId=${item.slotId}` : `/machines/${item.id}`}
                                            className="hover:underline block w-full h-full"
                                        >
                                            {item.assetTag}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={item.isSlot && item.slotId ? `/machines/${item.id}?slotId=${item.slotId}` : `/machines/${item.id}`}
                                            className="hover:underline block w-full h-full"
                                        >
                                            {item.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.prizeSize || "-"}</TableCell>
                                    <TableCell>
                                        {currentSlot?.currentItem ? (
                                            <Link
                                                href={`/inventory/${currentSlot.currentItem.id}`}
                                                className="text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <Package className="h-3 w-3" />
                                                {currentSlot.currentItem.name}
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Empty
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {currentSlot ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                                        <Badge
                                                            variant={
                                                                currentSlot.stockLevel === 'Full' ? 'default' :
                                                                    currentSlot.stockLevel === 'Good' ? 'secondary' :
                                                                        currentSlot.stockLevel === 'Low' ? 'outline' :
                                                                            'destructive'
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            {currentSlot.stockLevel}
                                                        </Badge>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuLabel>Update Stock Level</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => onStockUpdate(item, 'Full')}>Full</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onStockUpdate(item, 'Good')}>Good</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onStockUpdate(item, 'Low')}>Low</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onStockUpdate(item, 'Empty')}>Empty</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {currentSlot?.upcomingQueue && currentSlot.upcomingQueue.length > 0 ? (
                                            <Link
                                                href={`/inventory/${currentSlot.upcomingQueue[0].itemId}`}
                                                className="text-blue-600 hover:underline text-sm"
                                            >
                                                {currentSlot.upcomingQueue.length} queued
                                            </Link>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.revenue ? `$${item.revenue.toFixed(2)}` : "-"}</TableCell>
                                    <TableCell>{item.playCount ?? '-'}</TableCell>
                                    <TableCell>{item.lastSyncedAt ? formatDate(item.lastSyncedAt) : '-'}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                                    <Badge variant={getStatusColor(displayStatus) as any} className="cursor-pointer">
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
                                    <TableCell className="text-right">
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
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Machine
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
