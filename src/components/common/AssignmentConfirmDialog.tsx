"use client";

import Link from "next/link";
import { AlertTriangle, Package } from "lucide-react";
import { StockItem } from "@/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface AssignmentWarning {
    type: 'error' | 'warning' | 'info';
    message: string;
}

interface AssignmentConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    warnings: AssignmentWarning[];
    /** The item currently on the machine that will be replaced */
    currentItem?: StockItem | null;
    /** Action description shown at the bottom */
    actionDescription?: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

/**
 * Reusable confirmation dialog for machine assignments.
 * Shows warnings and optionally displays the current item that will be replaced.
 */
export function AssignmentConfirmDialog({
    open,
    onOpenChange,
    title = "Confirm Assignment",
    warnings,
    currentItem,
    actionDescription,
    onConfirm,
    confirmText = "Proceed Anyway",
    cancelText = "Cancel",
}: AssignmentConfirmDialogProps) {
    const hasErrors = warnings.some(w => w.type === 'error');
    const hasWarnings = warnings.some(w => w.type === 'warning');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${hasErrors ? 'text-red-500' : hasWarnings ? 'text-amber-500' : 'text-blue-500'}`} />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 pt-2">
                            {/* Current Item Preview (if replacing) */}
                            {currentItem && (
                                <div className="border rounded-lg p-3 bg-muted/30">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">
                                        This machine already has an item:
                                    </p>
                                    <Link
                                        href={`/inventory/${currentItem.id || (currentItem as any).itemId}`}
                                        className="flex items-center gap-3 group hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted border border-border/50 flex-shrink-0">
                                            {currentItem.imageUrl ? (
                                                <img
                                                    src={currentItem.imageUrl}
                                                    alt={currentItem.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground group-hover:text-primary group-hover:underline truncate">
                                                {currentItem.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Click to view details →
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* Warnings List */}
                            {warnings.length > 0 && (
                                <div className="space-y-2">
                                    {warnings.map((warning, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-start gap-2 text-sm ${warning.type === 'error'
                                                ? 'text-red-600'
                                                : warning.type === 'warning'
                                                    ? 'text-amber-600'
                                                    : 'text-blue-600'
                                                }`}
                                        >
                                            <span className="flex-shrink-0">
                                                {warning.type === 'error' ? '🚫' : warning.type === 'warning' ? '⚠️' : 'ℹ️'}
                                            </span>
                                            <span>{warning.message}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Description */}
                            {actionDescription && (
                                <p className="text-xs text-muted-foreground pt-1 border-t">
                                    {actionDescription}
                                </p>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={hasErrors ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Helper function to build warnings array for machine assignments
 */
export function buildAssignmentWarnings({
    item,
    machine,
    currentActiveItem,
    targetSize,
}: {
    item: StockItem;
    machine: { id: string; name: string; prizeSize?: string };
    currentActiveItem?: StockItem | null;
    targetSize?: string;
}): AssignmentWarning[] {
    const warnings: AssignmentWarning[] = [];
    const totalQty = item.locations?.reduce((acc, loc) => acc + loc.quantity, 0) ?? 0;
    const threshold = item.lowStockThreshold || 5;

    // 1. Stock Level Warnings
    if (totalQty === 0) {
        warnings.push({
            type: 'error',
            message: 'This item is OUT OF STOCK',
        });
    } else if (totalQty <= threshold) {
        warnings.push({
            type: 'warning',
            message: `Low Stock: Only ${totalQty} units remaining`,
        });
    } else if (totalQty <= threshold * 2) {
        warnings.push({
            type: 'info',
            message: `Limited Stock: ${totalQty} units remaining`,
        });
    }

    // 2. Size Compatibility
    const machineSize = targetSize || machine.prizeSize;
    if (machineSize && item.size) {
        // Import areSizesCompatible if needed, or do simple check
        const itemSizeNorm = item.size.toLowerCase().trim();
        const machineSizeNorm = machineSize.toLowerCase().trim();

        // Simple compatibility check (can be enhanced with areSizesCompatible utility)
        if (itemSizeNorm !== machineSizeNorm &&
            !itemSizeNorm.includes(machineSizeNorm) &&
            !machineSizeNorm.includes(itemSizeNorm)) {
            warnings.push({
                type: 'warning',
                message: `Size Mismatch: Machine expects "${machineSize}" prizes, but this item is "${item.size}"`,
            });
        }
    }

    // 3. Machine Occupancy
    if (currentActiveItem && currentActiveItem.id !== item.id) {
        warnings.push({
            type: 'warning',
            message: `Proceeding will replace the current item on this machine`,
        });
    }

    return warnings;
}
