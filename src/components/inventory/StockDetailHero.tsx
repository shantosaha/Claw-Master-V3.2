"use client";

import React from "react";
import Link from "next/link";
import { StockItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Package,
    Pencil,
    Trash2,
    MoreVertical,
    ShoppingCart,
    ArrowUpDown,
    Tag,
    Layers,
    MapPin,
    Gamepad2,
    ChevronDown,
} from "lucide-react";

interface StockDetailHeroProps {
    item: StockItem;
    onEdit: () => void;
    onDelete: () => void;
    onAdjustStock: () => void;
    onRequestReorder: () => void;
    onChangeStockStatus: (newStatus: string) => void;
    onChangeAssignedStatus: (newStatus: string) => void;
}

const STOCK_STATUS_OPTIONS = [
    { value: "In Stock", label: "In Stock", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    { value: "Limited Stock", label: "Limited Stock", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    { value: "Low Stock", label: "Low Stock", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    { value: "Out of Stock", label: "Out of Stock", color: "bg-red-500/10 text-red-600 border-red-500/20" },
];

const ASSIGNED_STATUS_OPTIONS = [
    { value: "Not Assigned", label: "Not Assigned", color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
    { value: "Assigned", label: "Assigned (Using)", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { value: "Assigned for Replacement", label: "Assigned for Replacement", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
];

export function StockDetailHero({
    item,
    onEdit,
    onDelete,
    onAdjustStock,
    onRequestReorder,
    onChangeStockStatus,
    onChangeAssignedStatus,
}: StockDetailHeroProps) {
    // Calculate stock level from quantities
    const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);

    // Get current status badges
    const currentStockStatus = STOCK_STATUS_OPTIONS.find(s => s.value === stockLevel.label) || STOCK_STATUS_OPTIONS[0];
    const currentAssignedStatus = ASSIGNED_STATUS_OPTIONS.find(s => s.value === item.assignedStatus) || ASSIGNED_STATUS_OPTIONS[0];

    // Image display
    const imageUrl = item.imageUrls?.[0] || item.imageUrl;

    return (
        <div className="rounded-xl border bg-card overflow-hidden">
            <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="md:w-64 lg:w-80 bg-muted/50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full max-w-[200px] h-auto object-contain rounded-lg"
                        />
                    ) : (
                        <div className="w-full aspect-square max-w-[200px] rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Title & Basic Info */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold">{item.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {item.sku && (
                                    <div className="flex items-center gap-1">
                                        <Tag className="h-3.5 w-3.5" />
                                        <span>{item.sku}</span>
                                    </div>
                                )}
                                {item.category && (
                                    <div className="flex items-center gap-1">
                                        <Layers className="h-3.5 w-3.5" />
                                        <span>{item.category}</span>
                                    </div>
                                )}
                                {item.size && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                                            {item.size}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={onEdit}>
                                <Pencil className="h-4 w-4 mr-1.5" />
                                Edit
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onAdjustStock}>
                                        <ArrowUpDown className="h-4 w-4 mr-2" />
                                        Adjust Stock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onRequestReorder}>
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Request Reorder
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Item
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Stats & Quick Info */}
                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Total Quantity */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Total Quantity</p>
                            <p className="text-2xl font-bold">{totalQty}</p>
                        </div>

                        {/* Low Stock Threshold */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Low Stock Threshold</p>
                            <p className="text-2xl font-bold">{item.lowStockThreshold}</p>
                        </div>

                        {/* Stock Status (Dropdown) */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Stock Status</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-auto py-1 px-2 ${currentStockStatus.color} border hover:opacity-80 w-full justify-between`}
                                    >
                                        <span className="font-medium">{stockLevel.label}</span>
                                        <ChevronDown className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Change Stock Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {STOCK_STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                            key={status.value}
                                            onClick={() => onChangeStockStatus(status.value)}
                                            className={status.value === stockLevel.label ? "bg-accent" : ""}
                                        >
                                            <Badge variant="outline" className={`${status.color} mr-2`}>
                                                {status.label}
                                            </Badge>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Assigned Status (Dropdown) */}
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Assigned Status</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-auto py-1 px-2 ${currentAssignedStatus.color} border hover:opacity-80 w-full justify-between`}
                                    >
                                        <span className="font-medium truncate">
                                            {item.assignedStatus || "Not Assigned"}
                                        </span>
                                        <ChevronDown className="h-3.5 w-3.5 ml-1 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>Change Assignment</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {ASSIGNED_STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                            key={status.value}
                                            onClick={() => onChangeAssignedStatus(status.value)}
                                            className={status.value === item.assignedStatus ? "bg-accent" : ""}
                                        >
                                            <Badge variant="outline" className={`${status.color} mr-2`}>
                                                {status.label}
                                            </Badge>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Machine Assignment Info */}
                    {item.assignedMachineName && (
                        <div className="mt-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                            <div className="flex items-center gap-2 text-sm">
                                <Gamepad2 className="h-4 w-4 text-blue-500" />
                                <span className="text-muted-foreground">Assigned to:</span>
                                {item.assignedMachineId ? (
                                    <Link
                                        href={`/machines/${item.assignedMachineId}`}
                                        className="font-medium text-blue-600 hover:underline hover:text-blue-800"
                                    >
                                        {item.assignedMachineName}
                                    </Link>
                                ) : (
                                    <span className="font-medium text-blue-600">{item.assignedMachineName}</span>
                                )}
                                {item.assignedStatus && (
                                    <Badge variant="outline" className={currentAssignedStatus.color}>
                                        {item.assignedStatus}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
