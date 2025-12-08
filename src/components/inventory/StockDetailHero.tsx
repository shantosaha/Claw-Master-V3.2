"use client";

import { StockItem } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { Edit, Trash2, MoreHorizontal, Package, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface StockDetailHeroProps {
    item: StockItem;
    onEdit: () => void;
    onDelete: () => void;
    onAdjustStock: () => void;
    onRequestReorder: () => void;
    onChangeStockStatus?: (status: string) => void;
    onChangeAssignedStatus?: (status: string) => void;
}

const stockStatusOptions = ["In Stock", "Limited Stock", "Low Stock", "Out of Stock"];
const assignedStatusOptions = ["Not Assigned", "Assigned", "Assigned for Replacement"];

export function StockDetailHero({
    item,
    onEdit,
    onDelete,
    onAdjustStock,
    onRequestReorder,
    onChangeStockStatus,
    onChangeAssignedStatus,
}: StockDetailHeroProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const totalQty = item.locations?.reduce((sum, loc) => sum + loc.quantity, 0) || 0;
    const stockLevel = calculateStockLevel(totalQty, item.stockStatus);

    const images = item.imageUrls && item.imageUrls.length > 0
        ? item.imageUrls
        : item.imageUrl
            ? [item.imageUrl]
            : [];

    const handlePrevImage = () => {
        setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNextImage = () => {
        setSelectedImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Gallery */}
                    <div className="md:w-1/3">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/40 border">
                            {images.length > 0 ? (
                                <>
                                    <img
                                        src={images[selectedImageIndex]}
                                        alt={item.name}
                                        className="absolute inset-0 w-full h-full object-contain p-2"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = "https://placehold.co/400x400?text=No+Image";
                                        }}
                                    />
                                    {images.length > 1 && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                                                onClick={handlePrevImage}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-8 w-8"
                                                onClick={handleNextImage}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                {selectedImageIndex + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                                    <Package className="h-16 w-16 opacity-30" />
                                </div>
                            )}
                        </div>
                        {/* Thumbnail Strip */}
                        {images.length > 1 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                {images.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`relative w-14 h-14 shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={url} alt={`Thumbnail ${index + 1}`} className="object-cover w-full h-full" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Item Details */}
                    <div className="md:w-2/3 space-y-4">
                        {/* Title and Actions Row */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">{item.name}</h1>
                                <p className="text-muted-foreground mt-1">
                                    SKU: <span className="font-mono">{item.sku}</span>
                                    {item.brand && <> • {item.brand}</>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={onEdit}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={onAdjustStock}>
                                            <Package className="h-4 w-4 mr-2" /> Adjust Stock
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onRequestReorder}>
                                            <ShoppingCart className="h-4 w-4 mr-2" /> Request Reorder
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" /> Delete Item
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex flex-wrap gap-2">
                            {/* Stock Status - Editable */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Badge
                                        className={`${stockLevel.colorClass} text-white cursor-pointer hover:opacity-80`}
                                    >
                                        {stockLevel.label}
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => onChangeStockStatus?.("")}>
                                        Auto (Calculate)
                                    </DropdownMenuItem>
                                    {stockStatusOptions.map(status => (
                                        <DropdownMenuItem
                                            key={status}
                                            onClick={() => onChangeStockStatus?.(status)}
                                        >
                                            {status}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Assigned Status - Editable */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Badge
                                        className={`cursor-pointer hover:opacity-80 ${item.assignedStatus === "Assigned"
                                                ? "bg-purple-500 text-white hover:bg-purple-600"
                                                : item.assignedStatus === "Assigned for Replacement"
                                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                            }`}
                                    >
                                        {item.assignedStatus === "Assigned"
                                            ? "Using"
                                            : item.assignedStatus === "Assigned for Replacement"
                                                ? "Replacement"
                                                : "Not Assigned"
                                        }
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => onChangeAssignedStatus?.("Not Assigned")}>
                                        Not Assigned
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onChangeAssignedStatus?.("Assigned")}>
                                        Using (Assigned)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onChangeAssignedStatus?.("Assigned for Replacement")}>
                                        Replacement (Assigned for Replacement)
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Category & Size */}
                            <Badge variant="outline">{item.category}</Badge>
                            {item.size && <Badge variant="outline">{item.size}</Badge>}
                            {item.type && <Badge variant="outline">{item.type}</Badge>}
                        </div>

                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Total Quantity</div>
                                <div className="text-xl font-bold">{totalQty}</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Inventory Value</div>
                                <div className="text-xl font-bold">
                                    ${((item.value || item.supplyChain?.costPerUnit || 0) * totalQty).toFixed(2)}
                                </div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Cost Per Unit</div>
                                <div className="text-xl font-bold">
                                    ${item.supplyChain?.costPerUnit?.toFixed(2) || "0.00"}
                                </div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <div className="text-xs text-muted-foreground">Reorder Point</div>
                                <div className="text-xl font-bold">
                                    {item.supplyChain?.reorderPoint || item.lowStockThreshold || "N/A"}
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {item.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
