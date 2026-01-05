"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StockItem } from "@/types";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { getComputedAssignedStatus, getAssignmentCount } from "@/utils/machineAssignmentUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MachineAssignmentChips } from "./MachineAssignmentChips";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    X,
    ZoomIn,
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
    // Image gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Calculate stock level from quantities
    const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);

    // Get current status badges
    const currentStockStatus = STOCK_STATUS_OPTIONS.find(s => s.value === stockLevel.label) || STOCK_STATUS_OPTIONS[0];
    const computedAssignedStatus = getComputedAssignedStatus(item);
    const currentAssignedStatus = ASSIGNED_STATUS_OPTIONS.find(s => s.value === computedAssignedStatus) || ASSIGNED_STATUS_OPTIONS[0];
    const assignmentCount = getAssignmentCount(item);

    // Get all images
    const allImages: string[] = [];
    if (item.imageUrls && item.imageUrls.length > 0) {
        allImages.push(...item.imageUrls);
    } else if (item.imageUrl) {
        allImages.push(item.imageUrl);
    }

    const currentImage = allImages[selectedImageIndex] || null;
    const hasMultipleImages = allImages.length > 1;

    const handlePrevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    };

    const handleNextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <>
            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Image Section */}
                    <div className="lg:w-64 xl:w-80 bg-muted/50 flex flex-col items-center justify-center p-4 border-b lg:border-b-0 lg:border-r shrink-0">
                        {/* Main Image */}
                        <div
                            className="relative w-full max-w-[220px] aspect-square group cursor-pointer"
                            onClick={() => currentImage && setIsLightboxOpen(true)}
                        >
                            {currentImage ? (
                                <>
                                    <img
                                        src={currentImage}
                                        alt={`${item.name} - Image ${selectedImageIndex + 1}`}
                                        className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                                    />
                                    {/* Zoom indicator */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    {/* Navigation arrows (if multiple images) */}
                                    {hasMultipleImages && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={handlePrevImage}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={handleNextImage}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {/* Image counter */}
                                    {hasMultipleImages && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                            {selectedImageIndex + 1} / {allImages.length}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="h-16 w-16 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip */}
                        {hasMultipleImages && (
                            <div className="flex gap-2 mt-3 overflow-x-auto max-w-full pb-1">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                                            ? "border-primary ring-2 ring-primary/30"
                                            : "border-transparent hover:border-muted-foreground/30"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
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
                                    <div className="flex items-center gap-1 font-mono text-xs bg-primary/10 px-2 py-0.5 rounded border border-primary/20 text-primary">
                                        <Tag className="h-3 w-3" />
                                        <span className="font-semibold opacity-70">ID:</span>
                                        <span>{item.id}</span>
                                    </div>
                                    {item.sku && (
                                        <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded border border-muted-foreground/20">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span className="font-semibold opacity-70">SKU:</span>
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
                        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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

                            {/* Assigned Status - Read-only for multi-machine, dropdown for single */}
                            <div className="bg-muted/50 rounded-lg p-3 min-w-0">
                                <p className="text-xs text-muted-foreground mb-1 truncate">
                                    Assigned Status
                                    {assignmentCount > 1 && (
                                        <span className="text-amber-600 ml-1">({assignmentCount})</span>
                                    )}
                                </p>
                                {assignmentCount > 1 ? (
                                    // Multi-machine: Read-only display with tooltip
                                    <div
                                        className={`h-auto py-1 px-2 ${currentAssignedStatus.color} border rounded-md text-xs font-medium cursor-default truncate`}
                                        title="Use the Machine Assignments panel in sidebar to manage individual machine assignments"
                                    >
                                        {computedAssignedStatus}
                                        <span className="hidden sm:inline text-[10px] opacity-70 ml-1">(sidebar)</span>
                                    </div>
                                ) : (
                                    // Single or no machine: Dropdown
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`h-auto py-1 px-2 ${currentAssignedStatus.color} border hover:opacity-80 w-full justify-between`}
                                            >
                                                <span className="font-medium truncate">
                                                    {computedAssignedStatus}
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
                                                    className={status.value === computedAssignedStatus ? "bg-accent" : ""}
                                                >
                                                    <Badge variant="outline" className={`${status.color} mr-2`}>
                                                        {status.label}
                                                    </Badge>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>

                        {/* Machine Assignment Chips */}
                        <MachineAssignmentChips item={item} />
                    </div>
                </div>
            </div>

            {/* Lightbox Dialog */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
                    <VisuallyHidden>
                        <DialogTitle>{item.name} - Image Gallery</DialogTitle>
                    </VisuallyHidden>
                    <div className="relative w-full h-[80vh] flex items-center justify-center">
                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                            onClick={() => setIsLightboxOpen(false)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Navigation - Previous */}
                        {hasMultipleImages && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
                                onClick={handlePrevImage}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                        )}

                        {/* Main Image */}
                        {currentImage && (
                            <img
                                src={currentImage}
                                alt={`${item.name} - Full Size`}
                                className="max-w-full max-h-full object-contain p-8"
                            />
                        )}

                        {/* Navigation - Next */}
                        {hasMultipleImages && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 text-white hover:bg-white/20"
                                onClick={handleNextImage}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        )}

                        {/* Image Counter */}
                        {hasMultipleImages && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
                                {selectedImageIndex + 1} / {allImages.length}
                            </div>
                        )}

                        {/* Thumbnail Strip */}
                        {hasMultipleImages && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                                            ? "border-white ring-2 ring-white/50"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
