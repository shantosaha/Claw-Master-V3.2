"use client";

import * as React from "react";

import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StockItem } from "@/types";
import { Package, MapPin, Ticket, DollarSign, ClipboardList, Tag, Edit3, Trash2, CalendarClock, Info, Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateStockLevel } from "@/utils/inventoryUtils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface StockItemDetailsDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: StockItem | null;
    onEdit: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    canPerformWriteActions: boolean;
    canDelete: boolean;
}

const DetailRow: React.FC<{ label: string; value?: string | number | null; icon?: React.ElementType; className?: string; children?: React.ReactNode }> = ({ label, value, icon: Icon, className, children }) => {
    if (value === undefined && !children) return null;
    if (value === null && !children) return null;
    if (value === "" && !children) return null;

    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 py-2 border-b border-border/50 items-start", className)}>
            <dt className="text-sm font-medium text-muted-foreground sm:col-span-1 flex items-center">
                {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
                {label}
            </dt>
            <dd className="text-sm text-foreground sm:col-span-2">{children || String(value)}</dd>
        </div>
    );
};

const formatDate = (isoString: string | Date | undefined) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const getStockItemDataAiHint = (category: string) => {
    return `${category.toLowerCase().split(' ').join('_')} toy`;
}


export function StockItemDetailsDialog({
    isOpen,
    onOpenChange,
    item,
    onEdit,
    onDelete,
    canPerformWriteActions,
    canDelete,
}: StockItemDetailsDialogProps) {
    const [isImageZoomed, setIsImageZoomed] = React.useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

    if (!item) return null;

    const totalQuantity = item.locations?.reduce((sum, loc) => sum + (loc.quantity || 0), 0) || 0;
    const stockLevel = calculateStockLevel(totalQuantity, item.stockStatus);
    const isLowStock = totalQuantity <= item.lowStockThreshold;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl text-primary flex items-center">
                        <Package className="mr-2 h-6 w-6" /> {item.name}
                    </DialogTitle>
                    <DialogDescription className="font-body">
                        Detailed information for SKU: {item.sku}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow pr-2 -mr-2" type="auto"> {/* Offset scrollbar padding */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="md:col-span-1">
                            {(item.imageUrls && item.imageUrls.length > 0) || item.imageUrl ? (
                                <div className="space-y-2">
                                    <Dialog open={isImageZoomed} onOpenChange={setIsImageZoomed}>
                                        <DialogContent className="max-w-4xl w-full p-2 bg-transparent border-none shadow-none flex items-center justify-center gap-4 outline-none" onKeyDown={(e) => {
                                            if (e.key === 'ArrowLeft') {
                                                setSelectedImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                                            } else if (e.key === 'ArrowRight') {
                                                setSelectedImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                            }
                                        }}>
                                            <VisuallyHidden>
                                                <DialogTitle>{item.name} - Image Preview</DialogTitle>
                                            </VisuallyHidden>
                                            {item.imageUrls && item.imageUrls.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-white hover:bg-white/20 rounded-full h-12 w-12 shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                                                    }}
                                                >
                                                    <ChevronLeft className="h-8 w-8" />
                                                </Button>
                                            )}
                                            <img
                                                src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[selectedImageIndex] : item.imageUrl || ""}
                                                alt={item.name}
                                                className="object-contain max-h-[80vh] w-auto rounded-lg"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = "https://placehold.co/400x400?text=No+Image";
                                                }}
                                            />
                                            {item.imageUrls && item.imageUrls.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-white hover:bg-white/20 rounded-full h-12 w-12 shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                                    }}
                                                >
                                                    <ChevronRight className="h-8 w-8" />
                                                </Button>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                    <div className="cursor-pointer relative group" onClick={() => setIsImageZoomed(true)}>
                                        <img
                                            src={item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[selectedImageIndex] : item.imageUrl || ""}
                                            alt={item.name}
                                            className="object-cover w-full h-auto rounded-lg shadow-md aspect-square"
                                            data-ai-hint={getStockItemDataAiHint(item.category)}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = "https://placehold.co/400x400?text=No+Image";
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center pointer-events-none">
                                            <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs px-2 py-1 rounded-full transition-opacity">Click to Zoom</span>
                                        </div>

                                        {item.imageUrls && item.imageUrls.length > 1 && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => (prev === 0 ? (item.imageUrls?.length || 1) - 1 : prev - 1));
                                                    }}
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImageIndex((prev) => (prev === (item.imageUrls?.length || 1) - 1 ? 0 : prev + 1));
                                                    }}
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    {item.imageUrls && item.imageUrls.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {item.imageUrls.map((url, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedImageIndex(index)}
                                                    className={cn(
                                                        "relative w-16 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all",
                                                        selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                                                    )}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`${item.name} thumbnail ${index + 1}`}
                                                        className="object-cover w-full h-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = "https://placehold.co/400x400?text=No+Image";
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full min-h-[150px] bg-muted flex items-center justify-center rounded-lg shadow-md aspect-square" data-ai-hint={`${getStockItemDataAiHint(item.category)} placeholder`}>
                                    <Package className="h-16 w-16 text-muted-foreground/50" />
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-0.5"> {/* Reduced space-y for tighter packing */}
                            <DetailRow label="Category" value={item.category} icon={Tag} />
                            <DetailRow label="SKU" value={item.sku} icon={ClipboardList} />
                            <DetailRow label="Qty Description" value={item.quantityDescription} icon={Info} />
                            <DetailRow label="Total Quantity" icon={Package}>
                                <span className={cn(isLowStock ? "text-destructive font-semibold" : "font-semibold")}>{totalQuantity} units</span>
                            </DetailRow>
                            <DetailRow label="Stock Status" icon={Info}>
                                <Badge className={cn(stockLevel.colorClass)}>{stockLevel.label}</Badge>
                            </DetailRow>
                            <DetailRow label="Low Stock Threshold" value={`${item.lowStockThreshold} units`} icon={Info} />
                            <DetailRow label="Cost Price" value={item.supplyChain?.costPerUnit ? `$${item.supplyChain.costPerUnit.toFixed(2)}` : "N/A"} icon={DollarSign} />
                            <DetailRow label="Ticket Value" value={item.value ? `${item.value} tickets` : "N/A"} icon={Ticket} />
                            {(item.assignedMachineName || item.assignedMachineId) && (
                                <DetailRow label="Assigned Machine" icon={Gamepad2}>
                                    <div className="flex items-center flex-wrap gap-1">
                                        {item.assignedMachineName ? (
                                            <>
                                                <Link href={`/machines/${item.assignedMachineId || ''}`} passHref>
                                                    <Button variant="link" className="p-0 h-auto text-sm text-foreground font-normal text-left" onClick={(e) => e.stopPropagation()}>
                                                        {item.assignedMachineName}
                                                    </Button>
                                                </Link>
                                                {item.assignedSlotId && (
                                                    <span className="text-muted-foreground text-xs">/ Slot ID: {item.assignedSlotId}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Machine ID: {item.assignedMachineId}</span>
                                        )}
                                    </div>
                                </DetailRow>
                            )}
                            <DetailRow label="Created At" value={formatDate(item.createdAt)} icon={CalendarClock} />
                            <DetailRow label="Last Updated" value={formatDate(item.updatedAt)} icon={CalendarClock} />
                        </div>
                    </div>

                    {item.locations && item.locations.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-md text-foreground mb-2 flex items-center"><MapPin className="mr-2 h-5 w-5 text-primary" />Locations ({totalQuantity} units total)</h3>
                            <div className="space-y-1 rounded-md border p-3 bg-secondary/30 max-h-48 overflow-y-auto">
                                {item.locations.map(loc => (
                                    <div key={loc.name} className="flex justify-between items-center text-sm py-1">
                                        <span className="text-muted-foreground">{loc.name}:</span>
                                        <span className="font-medium text-foreground">{loc.quantity} units</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="mt-auto pt-4 border-t">
                    <div className="flex w-full justify-between items-center flex-wrap gap-2">
                        <div className="flex gap-2">
                            {canPerformWriteActions && (
                                <Button variant="outline" onClick={() => onEdit(item)} className="font-body">
                                    <Edit3 className="mr-2 h-4 w-4" /> Edit Item
                                </Button>
                            )}
                            {canDelete && (
                                <Button variant="destructive" onClick={() => onDelete(item)} className="font-body">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                                </Button>
                            )}
                        </div>
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-body ml-auto sm:ml-0">Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
