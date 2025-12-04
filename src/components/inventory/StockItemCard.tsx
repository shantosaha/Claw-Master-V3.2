"use client";

import * as React from "react";
import { StockItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MoreHorizontal, Edit, Link as LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface StockItemCardProps {
    item: StockItem;
    viewStyle: "grid" | "compact-grid";
    onEdit: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    onAdjust: (item: StockItem) => void;
    onViewHistory: (item: StockItem) => void;
    onChangeAssignedStatus: (itemId: string, newStatus: string) => void;
    onChangeStockStatus: (itemId: string, newStatus: string) => void;
}

export function StockItemCard({
    item,
    viewStyle,
    onEdit,
    onDelete,
    onAdjust,
    onViewHistory,
    onChangeAssignedStatus,
    onChangeStockStatus = () => console.warn("onChangeStockStatus missing"),
}: StockItemCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
    const totalQuantity = item.locations.reduce((sum, loc) => sum + loc.quantity, 0);
    const isLowStock = totalQuantity <= item.lowStockThreshold && totalQuantity > 0;
    const isOutOfStock = totalQuantity === 0;

    const getStockStatusBadge = () => {
        const status = item.stockStatus;

        // If there's an explicit status set manually that overrides the calculation, we might want to respect it,
        // but the requirement says "Assignment availability must use the same stock-level calculation as the inventory view."
        // and "New Stock-Level Threshold Rules". This implies the calculation should be the primary source of truth.
        // However, if the user manually set "Out of Stock" even if qty > 0 (maybe damaged?), we should probably respect it.
        // But the prompt specifically asks to fix the logic to use the calculation.

        // Let's use the calculation based on totalQuantity.
        return calculateStockLevel(totalQuantity, item.stockStatus);
    };

    const getAssignmentStatusBadge = () => {
        const status = item.assignedStatus || "Not Assigned";
        if (status === "Assigned") {
            return {
                text: "Using",
                className: "bg-purple-500 text-white hover:bg-purple-600",
            };
        }
        if (status === "Assigned for Replacement") {
            return {
                text: "Assigned for Upcoming",
                className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
            };
        }
        return {
            text: "Not Assigned",
            className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
        };
    };

    const stockStatus = getStockStatusBadge();
    const assignmentStatus = getAssignmentStatusBadge();

    if (viewStyle === "compact-grid") {
        return (
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group relative">
                {/* Three-dot menu in top right */}
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(item); }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAdjust(item); }}>
                                Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onViewHistory(item); }}>
                                View History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(item); }} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Image */}
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="relative aspect-square bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                            {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                                <>
                                    <img
                                        src={item.imageUrls?.[0] || item.imageUrl || ""}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://placehold.co/400x400?text=No+Image";
                                        }}
                                    />
                                    {item.imageUrls && item.imageUrls.length > 1 && (
                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded-full">
                                            +{item.imageUrls.length - 1}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-gray-400 text-sm">
                                    {item.name.split(' ').slice(0, 2).join(' ')}
                                </div>
                            )}
                        </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                        <VisuallyHidden>
                            <DialogTitle>{item.name} - Image Preview</DialogTitle>
                        </VisuallyHidden>
                        <div className="relative w-full h-[80vh] bg-black/80 flex items-center justify-center outline-none" onKeyDown={(e) => {
                            if (e.key === 'ArrowLeft') {
                                setCurrentImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                            } else if (e.key === 'ArrowRight') {
                                setCurrentImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                            }
                        }} tabIndex={0}>
                            <img
                                src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[currentImageIndex] : item.imageUrl || ""}
                                alt={item.name}
                                className="object-contain max-h-full max-w-full"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://placehold.co/400x400?text=No+Image";
                                }}
                            />

                            {item.imageUrls && item.imageUrls.length > 1 && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all z-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                                        }}
                                    >
                                        <ChevronLeft className="h-8 w-8" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all z-50"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCurrentImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                        }}
                                    >
                                        <ChevronRight className="h-8 w-8" />
                                    </Button>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full pointer-events-none">
                                        {currentImageIndex + 1} / {item.imageUrls.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                <CardContent className="p-3 space-y-2">
                    {/* Title */}
                    <Link href={`/inventory/${item.id}`} className="hover:underline">
                        <h3 className="font-semibold text-sm line-clamp-1" title={item.name}>
                            {item.name}
                        </h3>
                    </Link>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {item.type}
                        </Badge>
                        {item.size && (
                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                {item.size}
                            </Badge>
                        )}
                    </div>

                    {/* Stock Status (clickable) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge className={cn("w-full justify-center text-xs py-1 cursor-pointer", stockStatus.colorClass)}>
                                {stockStatus.label}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">

                            <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "In Stock")}>
                                In Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Limited Stock")}>
                                Limited Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Low Stock")}>
                                Low Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Out of Stock")}>
                                Out of Stock
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Assignment Status (clickable) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge className={cn("w-full justify-center text-xs py-1 cursor-pointer", assignmentStatus.className)}>
                                {assignmentStatus.text}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => onChangeAssignedStatus(item.id, "Not Assigned")}>
                                Not Assigned
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeAssignedStatus(item.id, "Assigned")}>
                                Using
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onChangeAssignedStatus(item.id, "Assigned for Replacement")}>
                                Replacement
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Assigned Machine */}
                    {item.assignedMachineId ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <LinkIcon className="h-3 w-3" />
                            <span className="truncate">{item.assignedMachineName || "Machine"}</span>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground">Not Assigned</div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Grid view (larger cards)
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group relative h-full flex flex-col">
            {/* Three-dot menu in top right */}
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(item); }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); onAdjust(item); }}>
                            Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); onViewHistory(item); }}>
                            View History
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDelete(item); }} className="text-destructive">
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Category Badge */}
            <div className="absolute top-3 left-3 z-10">
                <Badge variant="secondary" className="text-xs">
                    {item.category}
                </Badge>
            </div>

            {/* Image */}
            <div className="relative aspect-[3/2] bg-gray-100 group/image overflow-hidden">
                <Link href={`/inventory/${item.id}`} className="block w-full h-full">
                    {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                        <img
                            src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[currentImageIndex] : item.imageUrl || ""}
                            alt={item.name}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover/image:scale-105"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/400x400?text=No+Image";
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                            {item.name}
                        </div>
                    )}
                </Link>

                {/* Navigation Arrows - Outside Link */}
                {((item.imageUrls && item.imageUrls.length > 0) || item.imageUrl) && item.imageUrls && item.imageUrls.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                            }}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCurrentImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                            }}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full pointer-events-none z-20">
                            {currentImageIndex + 1}/{item.imageUrls.length}
                        </div>
                    </>
                )}
            </div>

            <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                {/* Title and SKU */}
                <div>
                    <Link href={`/inventory/${item.id}`} className="hover:underline">
                        <h3 className="font-semibold line-clamp-1" title={item.name}>
                            {item.name}
                        </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
                </div>

                {/* Quantity Description */}
                <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Qty Desc:</span>
                        <span className="font-medium">{item.quantityDescription || item.quantityText || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Stock:</span>
                        <span className="font-medium">{totalQuantity} units</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Ticket Value:</span>
                        <span className="font-medium">{item.playWinTarget || item.value || 0}</span>
                    </div>
                </div>

                {/* Stock & Assignment status (compact rows with extra info) */}
                <div className="space-y-2 pt-3">
                    {/* Stock status row */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Stock status</span>
                            <span className="text-[11px] text-muted-foreground">
                                Low alert at {item.lowStockThreshold} units
                            </span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge
                                    className={cn(
                                        "min-w-[110px] justify-center text-xs py-1 cursor-pointer",
                                        stockStatus.colorClass
                                    )}
                                >
                                    {stockStatus.label}
                                </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">

                                <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "In Stock")}>
                                    In Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Limited Stock")}>
                                    Limited Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Low Stock")}>
                                    Low Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onChangeStockStatus(item.id, "Out of Stock")}>
                                    Out of Stock
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Assignment row */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-muted-foreground">Assignment</span>
                            <span className="text-[11px] text-muted-foreground truncate">
                                {item.assignedMachineName || "No machine assigned"}
                            </span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge
                                    className={cn(
                                        "min-w-[130px] justify-center text-xs py-1 cursor-pointer",
                                        assignmentStatus.className
                                    )}
                                >
                                    {assignmentStatus.text}
                                </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onChangeAssignedStatus(item.id, "Not Assigned")}>
                                    Not Assigned
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onChangeAssignedStatus(item.id, "Assigned")}>
                                    Using
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onChangeAssignedStatus(item.id, "Assigned for Replacement")}
                                >
                                    Replacement
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Locations */}
                {item.locations.length > 0 && (
                    <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Locations:</span>
                        </div>
                        <ul className="space-y-0.5 pl-4">
                            {item.locations.slice(0, 2).map((loc, i) => (
                                <li key={i} className="text-muted-foreground">
                                    {loc.name}: {loc.quantity}
                                </li>
                            ))}
                            {item.locations.length > 2 && (
                                <li className="text-muted-foreground">+{item.locations.length - 2} more</li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Assigned Machine block removed in large grid to avoid repetition; use Assignment row above instead */}

                <div className="mt-auto pt-3 space-y-2">
                    {/* Edit Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                            e.preventDefault();
                            onEdit(item);
                        }}
                    >
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
