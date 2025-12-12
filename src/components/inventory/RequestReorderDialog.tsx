"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { StockItem, ReorderRequest } from "@/types";
import { orderService } from "@/services";
import { AlertTriangle, Clock, User, Package, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const requestReorderSchema = z.object({
    quantity: z.string().min(1, "Quantity is required").transform((val) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num <= 0) return 0;
        return num;
    }).refine((val) => val > 0, "Quantity must be greater than 0"),
    notes: z.string().optional(),
});

interface RequestReorderDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: StockItem;
    onSubmit: (data: { quantity: number; notes?: string }) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'submitted':
            return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
        case 'approved':
            return 'bg-green-500/10 text-green-600 border-green-500/20';
        case 'ordered':
            return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
        case 'fulfilled':
        case 'received':
            return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
        case 'rejected':
            return 'bg-red-500/10 text-red-600 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
};

export function RequestReorderDialog({ isOpen, onOpenChange, item, onSubmit }: RequestReorderDialogProps) {
    const [existingOrders, setExistingOrders] = React.useState<ReorderRequest[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = React.useState(false);

    const form = useForm<any>({
        resolver: zodResolver(requestReorderSchema),
        defaultValues: {
            quantity: "",
            notes: "",
        },
    });

    // Fetch existing pending orders for this item when dialog opens
    React.useEffect(() => {
        if (isOpen && item) {
            const fetchExistingOrders = async () => {
                setIsLoadingOrders(true);
                try {
                    const allOrders = await orderService.getAll();
                    // Filter for orders matching this item that are not yet completed
                    const pendingStatuses = ['submitted', 'approved', 'ordered'];
                    const pending = allOrders.filter(order =>
                        (order.itemId === item.id || order.itemName === item.name) &&
                        pendingStatuses.includes(order.status)
                    );
                    setExistingOrders(pending);
                } catch (error) {
                    console.error("Failed to fetch existing orders:", error);
                    setExistingOrders([]);
                } finally {
                    setIsLoadingOrders(false);
                }
            };
            fetchExistingOrders();

            form.reset({
                quantity: "",
                notes: "",
            });
        }
    }, [isOpen, item, form]);

    const handleSubmit = (data: z.infer<typeof requestReorderSchema>) => {
        onSubmit({
            quantity: data.quantity, // Already transformed to number
            notes: data.notes,
        });
        onOpenChange(false);
    };

    const totalPendingQuantity = existingOrders.reduce((sum, order) => sum + order.quantityRequested, 0);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request Reorder</DialogTitle>
                    <DialogDescription>
                        Create a restock request for <strong>{item.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Current Stock</span>
                                <p className="text-md font-semibold">
                                    {item.locations.reduce((acc, loc) => acc + loc.quantity, 0)} units
                                </p>
                            </div>
                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Reorder Point</span>
                                <p className="text-md font-semibold">
                                    {item.supplyChain?.reorderPoint || 0} units
                                </p>
                            </div>
                        </div>

                        {/* Existing Orders Warning */}
                        {isLoadingOrders ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Checking for existing orders...
                            </div>
                        ) : existingOrders.length > 0 && (
                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">Existing Orders in Progress</AlertTitle>
                                <AlertDescription className="text-amber-700">
                                    <p className="mb-2">
                                        There {existingOrders.length === 1 ? 'is' : 'are'} <strong>{existingOrders.length}</strong> pending order{existingOrders.length > 1 ? 's' : ''} for this item
                                        (total: <strong>{totalPendingQuantity} units</strong>).
                                    </p>
                                    <div className="space-y-2 mt-3">
                                        {existingOrders.map((order, idx) => (
                                            <div key={order.id || idx} className="bg-white/50 rounded-lg p-3 border border-amber-200/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </Badge>
                                                    <span className="text-xs text-amber-600">
                                                        #{order.id?.slice(-6) || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Package className="h-3 w-3" />
                                                        <span><strong>{order.quantityRequested}</strong> units</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span className="truncate">{order.requestedBy || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 col-span-2">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {order.createdAt
                                                                ? `${formatDistanceToNow(new Date(order.createdAt))} ago`
                                                                : 'Unknown date'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                {order.notes && (
                                                    <p className="text-xs mt-2 italic text-amber-600 truncate">
                                                        "{order.notes}"
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-3 text-xs">
                                        You can still create a new order if needed.
                                    </p>
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Request Quantity</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Enter quantity..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Reason for reorder, urgency, etc..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {existingOrders.length > 0 ? 'Submit Additional Request' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
