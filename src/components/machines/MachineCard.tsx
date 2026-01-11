"use client";

import { ArcadeMachine, ArcadeMachineSlot, StockItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getThumbnailUrl } from "@/lib/utils/imageUtils";

interface MachineCardProps {
    machine: ArcadeMachine;
    onManageStock: (machine: ArcadeMachine) => void;
    onStatusChange: (machine: ArcadeMachine, status: ArcadeMachine['status']) => void;
    onEdit: (machine: ArcadeMachine) => void;
    onDelete: (machine: ArcadeMachine) => void;
    onAssignStock: (machine: ArcadeMachine, slotId?: string) => void;
    onStockLevelChange: (item: StockItem, newLevel: string) => void;
}

export function MachineCard({
    machine,
    onManageStock,
    onStatusChange,
    onEdit,
    onDelete,
    onAssignStock,
    onStockLevelChange
}: MachineCardProps) {
    const router = useRouter();

    const getStatusColor = (status: ArcadeMachine['status']) => {
        switch (status) {
            case 'Online': return "default";
            case 'Maintenance': return "secondary";
            case 'Error': return "destructive";
            case 'Offline': return "outline";
            default: return "secondary";
        }
    };

    const getStockStatusColor = (level: ArcadeMachineSlot['stockLevel']) => {
        switch (level) {
            case 'In Stock': return "bg-emerald-500";
            case 'Limited Stock': return "bg-amber-500";
            case 'Low Stock': return "bg-orange-500";
            case 'Out of Stock': return "bg-red-500";
            case 'Full': return "bg-emerald-500";
            case 'Good': return "bg-blue-500";
            case 'Low': return "bg-orange-500";
            case 'Empty': return "bg-red-500";
            default: return "bg-gray-300";
        }
    };

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menuitem"]')) {
            return;
        }
        router.push(`/machines/${machine.id}`);
    };

    // Get the first slot's current item for display
    const primarySlot = machine.slots?.[0];
    const currentItem = primarySlot?.currentItem;

    return (
        <Card
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative group"
            onClick={handleCardClick}
        >
            {/* Compact Header with Image */}
            <div className="relative h-28 w-full bg-muted">
                {machine.imageUrl ? (
                    <img
                        src={getThumbnailUrl(machine.imageUrl, 200)}
                        alt={machine.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                        No Image
                    </div>
                )}

                {/* Status Badge & Actions - Top Right */}
                <div className="absolute top-1 right-1 flex gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge
                                variant={getStatusColor(machine.status) as any}
                                className="cursor-pointer text-[9px] px-1.5 py-0 h-4 shadow-sm"
                            >
                                {machine.status}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-xs">Set Status</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onStatusChange(machine, 'Online')}>Online</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(machine, 'Maintenance')}>Maintenance</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(machine, 'Offline')}>Offline</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onStatusChange(machine, 'Error')}>Error</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-4 w-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm bg-white/90 hover:bg-white text-black">
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(machine)}>
                                <Edit className="mr-2 h-3 w-3" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(machine)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3 w-3" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Machine Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                    <h3 className="text-white text-[11px] font-semibold truncate leading-tight">{machine.name}</h3>
                    <p className="text-white/70 text-[9px] truncate">{machine.location || 'No location'}</p>
                </div>
            </div>

            {/* Compact Content */}
            <div className="p-2 space-y-1.5">
                {/* Current Stock Item */}
                {currentItem ? (
                    <div className="flex items-center gap-1.5">
                        {/* Stock Status Dot */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div
                                    className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 cursor-pointer", getStockStatusColor(primarySlot?.stockLevel))}
                                    title={primarySlot?.stockLevel}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel className="text-xs">Update Stock</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onStockLevelChange(currentItem, 'In Stock')}>In Stock</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStockLevelChange(currentItem, 'Limited Stock')}>Limited</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStockLevelChange(currentItem, 'Low Stock')}>Low</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStockLevelChange(currentItem, 'Out of Stock')}>Out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Item Image */}
                        {currentItem.imageUrl && (
                            <img
                                src={getThumbnailUrl(currentItem.imageUrl, 48)}
                                alt={currentItem.name}
                                loading="lazy"
                                decoding="async"
                                className="w-6 h-6 rounded object-cover border bg-muted flex-shrink-0"
                            />
                        )}

                        {/* Item Name & Status */}
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/inventory/${currentItem.id}`}
                                className="text-[10px] text-blue-600 hover:underline truncate block leading-tight"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {currentItem.name}
                            </Link>
                            <span className="text-[9px] text-muted-foreground">{primarySlot?.stockLevel}</span>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-6 text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssignStock(machine, primarySlot?.id);
                        }}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Assign Stock
                    </Button>
                )}

                {/* Additional Slots Indicator */}
                {machine.slots.length > 1 && (
                    <div className="text-[9px] text-muted-foreground text-center">
                        +{machine.slots.length - 1} more slot{machine.slots.length > 2 ? 's' : ''}
                    </div>
                )}
            </div>
        </Card>
    );
}
