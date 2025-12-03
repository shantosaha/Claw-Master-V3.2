"use client";

import { useState, useEffect } from "react";
import { ReorderRequest, StockItem } from "@/types";
import { orderService, stockService } from "@/services";
import { logAction } from "@/services/auditLogger";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface OrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function OrderDialog({ open, onOpenChange, onSuccess }: OrderDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [formData, setFormData] = useState({
        itemId: "",
        quantity: 0,
    });

    useEffect(() => {
        if (open) {
            loadStockItems();
        }
    }, [open]);

    const loadStockItems = async () => {
        try {
            const items = await stockService.getAll();
            setStockItems(items);
        } catch (error) {
            console.error("Failed to load stock items:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const newId = await orderService.add({
                itemId: formData.itemId,
                quantity: formData.quantity,
                requestedBy: user.uid,
                status: "submitted",
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any);

            await logAction(
                user.uid,
                "create",
                "stock", // Using 'stock' as entity type for reorder for now
                newId,
                "Created reorder request",
                null,
                formData
            );

            onSuccess();
            onOpenChange(false);
            setFormData({ itemId: "", quantity: 0 });
        } catch (error) {
            console.error("Failed to create order:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Reorder Request</DialogTitle>
                    <DialogDescription>
                        Select an item and quantity to request.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="item" className="text-right">
                            Item
                        </Label>
                        <Select
                            value={formData.itemId}
                            onValueChange={(value) => setFormData({ ...formData, itemId: value })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                                {stockItems.map((item) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.name} ({item.sku})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            Quantity
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                            className="col-span-3"
                            required
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="submit" onClick={handleSubmit} disabled={loading || !formData.itemId || formData.quantity <= 0}>
                        {loading ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
