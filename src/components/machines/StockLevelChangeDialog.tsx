"use client";

import { useState } from "react";
import { StockItem } from "@/types";
import { stockService } from "@/services";
import { useData } from "@/context/DataProvider";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockLevelChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: StockItem | null;
    newLevel: string;
}

export function StockLevelChangeDialog({ open, onOpenChange, item, newLevel }: StockLevelChangeDialogProps) {
    const { refreshItems, refreshMachines } = useData();
    const [restockQuantity, setRestockQuantity] = useState("0");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClose = () => {
        setRestockQuantity("0");
        onOpenChange(false);
    };

    const handleConfirm = async () => {
        if (!item) return;
        setIsSubmitting(true);

        try {
            let updatedLocations = [...(item.locations || [])];

            if (newLevel === "Out of Stock") {
                // Out of Stock always sets all quantities to 0
                updatedLocations = updatedLocations.map(loc => ({
                    ...loc,
                    quantity: 0,
                }));
            } else {
                const qtyNum = Math.max(0, Number(restockQuantity) || 0);
                if (updatedLocations.length === 0) {
                    updatedLocations = [{ name: "Warehouse", quantity: qtyNum }];
                } else {
                    updatedLocations = updatedLocations.map((loc, index) => ({
                        ...loc,
                        quantity: index === 0 ? qtyNum : 0
                    }));
                }
            }

            console.log("Updating item:", item.id, "with locations:", updatedLocations, "stockStatus:", newLevel);

            await stockService.update(item.id, {
                locations: updatedLocations,
                stockStatus: newLevel,
                updatedAt: new Date(),
            });

            toast.success("Stock Level Updated", { description: `${item.name} is now "${newLevel}".` });

            // Await refreshes to ensure data is fully updated before closing
            await refreshItems();
            await refreshMachines();
        } catch (error) {
            console.error("Failed to update stock level:", error);
            toast.error("Failed to update stock level");
        } finally {
            setIsSubmitting(false);
            handleClose();
        }
    };

    // Default quantity based on level
    const getDefaultQuantity = (level: string) => {
        switch (level) {
            case "In Stock": return "26";
            case "Limited Stock": return "12";
            case "Low Stock": return "5";
            default: return "0";
        }
    };

    // Set default quantity when dialog opens or level changes
    if (open && restockQuantity === "0" && newLevel !== "Out of Stock") {
        setRestockQuantity(getDefaultQuantity(newLevel));
    }

    if (!item) return null;

    const currentQty = item.locations?.reduce((s, l) => s + l.quantity, 0) || 0;

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {newLevel === "Out of Stock" ? "Are you sure?" : "Update Stock Status"}
                    </DialogTitle>
                    {newLevel === "Out of Stock" ? (
                        <DialogDescription>
                            This will set the stock quantity of <strong className="text-foreground">{item.name}</strong> to 0 and mark it as &quot;Out of Stock&quot;. This action cannot be undone.
                        </DialogDescription>
                    ) : (
                        <DialogDescription>
                            You&apos;re changing the stock status for &quot;{item.name}&quot;. Enter the new quantity.
                        </DialogDescription>
                    )}
                </DialogHeader>

                {newLevel !== "Out of Stock" && (
                    <div className="space-y-3">
                        <Label htmlFor="restock-qty" className="text-sm font-medium">
                            Update Quantity
                        </Label>
                        <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200 mb-2">
                            Current quantity ({currentQty}) doesn&apos;t match &quot;{newLevel}&quot;.
                            <br />
                            Please confirm the new quantity:
                        </div>
                        <Input
                            id="restock-qty"
                            type="number"
                            min={0}
                            value={restockQuantity}
                            onChange={(e) => setRestockQuantity(e.target.value)}
                            placeholder="Enter quantity"
                        />
                        <p className="text-xs text-muted-foreground">
                            This will set the quantity for the first location and set others to 0.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        variant={newLevel === "Out of Stock" ? "destructive" : "default"}
                    >
                        {isSubmitting ? "Updating..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
