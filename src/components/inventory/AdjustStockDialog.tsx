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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel as ShadcnSelectLabel } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { StockItem, AdjustStockFormValues, User, ReorderRequest } from "@/types";
import { PackagePlus, PackageMinus, PackageCheck, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DEFAULT_STORAGE_LOCATION, primaryStorageLocations, secondaryStorageLocations } from "./StockItemForm";

// Combine all storage locations
const allStorageLocations = [...primaryStorageLocations, ...secondaryStorageLocations];

const adjustStockSchema = z.object({
    locationName: z.string().min(1, "Location is required."),
    adjustmentType: z.enum(["add", "remove", "set"]),
    quantity: z.coerce.number().int().min(0, "Quantity must be a non-negative number."),
    notes: z.string().optional(),
});

const createAdjustStockSchema = (requestToReceive?: ReorderRequest | null) => {
    return adjustStockSchema.superRefine((data, ctx) => {
        if (requestToReceive) {
            const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
            if (data.quantity > remainingToReceive) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["quantity"],
                    message: `Cannot receive more than the ${remainingToReceive} units remaining for this order.`,
                });
            }
        }
    });
};

interface AdjustStockDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: StockItem | null;
    onSubmit: (itemId: string, values: AdjustStockFormValues) => void;
    user: User | null;
    requestToReceive?: ReorderRequest | null;
}

export function AdjustStockDialog({ isOpen, onOpenChange, item, onSubmit, user, requestToReceive }: AdjustStockDialogProps) {
    // Use item's first location, or default to global DEFAULT_STORAGE_LOCATION
    const defaultLocation = item?.locations?.[0]?.name || DEFAULT_STORAGE_LOCATION;

    const form = useForm<any>({
        resolver: async (data, context, options) => {
            const schema = createAdjustStockSchema(requestToReceive);
            return zodResolver(schema)(data, context, options);
        },
        defaultValues: {
            locationName: defaultLocation,
            adjustmentType: "add",
            quantity: 0,
            notes: "",
        },
    });

    const watchQuantity = form.watch("quantity");
    const watchAdjustmentType = form.watch("adjustmentType");
    const watchLocationName = form.watch("locationName");

    const currentItemQuantityAtLocation = React.useMemo(() => {
        if (!item || !watchLocationName) return 0;
        const loc = item.locations?.find(l => l.name === watchLocationName);
        return loc?.quantity || 0;
    }, [item, watchLocationName]);

    const quantityToAdjust = React.useMemo(() => {
        return typeof watchQuantity === 'number' ? watchQuantity : parseInt(watchQuantity as any) || 0;
    }, [watchQuantity]);

    const [discrepancy, setDiscrepancy] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (requestToReceive) {
            const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
            const diff = remainingToReceive - quantityToAdjust;
            setDiscrepancy(diff);
        } else {
            setDiscrepancy(null);
        }
    }, [quantityToAdjust, requestToReceive]);

    const newQuantityAfterAdjustment = React.useMemo(() => {
        let newQty = currentItemQuantityAtLocation;
        switch (watchAdjustmentType) {
            case 'add':
                newQty += quantityToAdjust;
                break;
            case 'remove':
                newQty -= quantityToAdjust;
                break;
            case 'set':
                newQty = quantityToAdjust;
                break;
        }
        return Math.max(0, newQty); // Quantity cannot be negative
    }, [currentItemQuantityAtLocation, quantityToAdjust, watchAdjustmentType]);


    React.useEffect(() => {
        if (item && isOpen) {
            const currentUserName = user?.displayName || user?.email || "System";
            const currentTime = new Date().toLocaleString();

            const quantityFromRequest = requestToReceive
                ? requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0)
                : 0;

            const defaultNotes = requestToReceive
                ? `Receiving order for request #${requestToReceive.id}.`
                : `Stock adjusted by ${currentUserName} on ${currentTime}. Reason: `;

            form.reset({
                locationName: item.locations?.[0]?.name || DEFAULT_STORAGE_LOCATION,
                adjustmentType: "add",
                quantity: quantityFromRequest,
                notes: defaultNotes,
            });
        }
    }, [item, isOpen, form, user, requestToReceive]);

    if (!item) return null;

    const handleSubmit = (data: z.infer<typeof adjustStockSchema>) => {
        const schema = createAdjustStockSchema(requestToReceive);
        const result = schema.safeParse(data);

        if (result.success) {
            const processedData = result.data;
            if (requestToReceive) {
                const currentUserName = user?.displayName || user?.email || "System";
                const currentTime = new Date().toLocaleString();
                const remainingToReceive = requestToReceive.quantityRequested - (requestToReceive.quantityReceived || 0);
                const discrepancyValue = remainingToReceive - processedData.quantity;

                const baseNote = `Received by ${currentUserName} on ${currentTime}.`;

                if (discrepancyValue > 0 && processedData.quantity > 0) {
                    processedData.notes = `Partial Receipt: Received ${processedData.quantity} of ${remainingToReceive} remaining units from request #${requestToReceive.id}. ${baseNote}`;
                } else if (processedData.quantity > 0) {
                    processedData.notes = `Final Receipt: Received remaining ${processedData.quantity} units from request #${requestToReceive.id}. ${baseNote}`;
                } else {
                    processedData.notes = data.notes;
                }
            }

            onSubmit(item.id, {
                ...processedData,
                selectedQuantity: String(processedData.quantity), // For backward compatibility
            });
            onOpenChange(false);
        } else {
            toast.error("Validation Error", {
                description: "Please check the form for errors.",
            });
        }
    };

    // Build location options: item's current locations + all predefined locations (no duplicates)
    const locationOptions = React.useMemo(() => {
        const optionsSet = new Set<string>();

        // Add item's existing locations first
        if (item.locations && item.locations.length > 0) {
            item.locations.forEach(loc => optionsSet.add(loc.name));
        }

        // Add all predefined storage locations
        allStorageLocations.forEach(loc => optionsSet.add(loc));

        return Array.from(optionsSet).map(name => {
            const itemLoc = item.locations?.find(l => l.name === name);
            return {
                name,
                quantity: itemLoc?.quantity || 0
            };
        });
    }, [item]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">Adjust Stock for: {item.name}</DialogTitle>
                    <DialogDescription className="font-body">
                        Modify the quantity for a specific location.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="locationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select a location" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Primary Locations</ShadcnSelectLabel>
                                                {primaryStorageLocations.map((loc) => {
                                                    const itemLoc = item.locations?.find(l => l.name === loc);
                                                    return (
                                                        <SelectItem key={loc} value={loc} className="font-body">
                                                            {loc} (Current: {itemLoc?.quantity || 0} units)
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectGroup>
                                            <SelectGroup>
                                                <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Secondary Locations</ShadcnSelectLabel>
                                                {secondaryStorageLocations.map((loc) => {
                                                    const itemLoc = item.locations?.find(l => l.name === loc);
                                                    return (
                                                        <SelectItem key={loc} value={loc} className="font-body">
                                                            {loc} (Current: {itemLoc?.quantity || 0} units)
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectGroup>
                                            {/* Show any custom locations from the item that aren't in predefined list */}
                                            {item.locations?.filter(l => !allStorageLocations.includes(l.name)).length > 0 && (
                                                <SelectGroup>
                                                    <ShadcnSelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">Custom Locations</ShadcnSelectLabel>
                                                    {item.locations?.filter(l => !allStorageLocations.includes(l.name)).map((loc) => (
                                                        <SelectItem key={loc.name} value={loc.name} className="font-body">
                                                            {loc.name} (Current: {loc.quantity} units)
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="adjustmentType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Adjustment Type</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!requestToReceive}>
                                        <FormControl>
                                            <SelectTrigger className="font-body">
                                                <SelectValue placeholder="Select adjustment type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="add" className="font-body flex items-center"><PackagePlus className="mr-2 h-4 w-4" /> Add to Stock</SelectItem>
                                            <SelectItem value="remove" className="font-body flex items-center"><PackageMinus className="mr-2 h-4 w-4" /> Remove from Stock</SelectItem>
                                            <SelectItem value="set" className="font-body flex items-center"><PackageCheck className="mr-2 h-4 w-4" /> Set New Quantity</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Enter quantity..."
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                            className="font-body"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Warning: Removing from empty location */}
                        {watchAdjustmentType === 'remove' && currentItemQuantityAtLocation === 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>No Stock at This Location</AlertTitle>
                                <AlertDescription>
                                    There is currently no stock at <strong>{watchLocationName}</strong>. You cannot remove items from an empty location.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Warning: Removing more than available */}
                        {watchAdjustmentType === 'remove' && currentItemQuantityAtLocation > 0 && quantityToAdjust > currentItemQuantityAtLocation && (
                            <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertTitle>Insufficient Stock</AlertTitle>
                                <AlertDescription>
                                    You're trying to remove <strong>{quantityToAdjust}</strong> units, but only <strong>{currentItemQuantityAtLocation}</strong> units are available at this location.
                                    The quantity will be set to 0.
                                </AlertDescription>
                            </Alert>
                        )}

                        {requestToReceive && discrepancy !== null && discrepancy !== 0 && (
                            <Alert variant={discrepancy > 0 ? "default" : "destructive"} className={cn(discrepancy > 0 && "bg-blue-50 border-blue-200 text-blue-800")}>
                                <AlertTriangle className={cn("h-4 w-4", discrepancy > 0 ? "text-blue-500" : "text-destructive")} />
                                <AlertTitle>{discrepancy > 0 ? "Partial Receipt" : "Over Receipt"}</AlertTitle>
                                <AlertDescription>
                                    You are about to receive {Math.abs(discrepancy)} {discrepancy > 0 ? "fewer" : "more"} units than remaining. This will be logged.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="text-sm font-body text-muted-foreground">
                            Current at location: <span className="font-semibold text-foreground">{currentItemQuantityAtLocation} units</span>.
                            New quantity will be: <span className="font-semibold text-foreground">{newQuantityAfterAdjustment} units</span>.
                        </div>


                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Reason for adjustment..." {...field} className="font-body" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-body">Cancel</Button>
                            <Button type="submit" className="font-body bg-primary text-primary-foreground">Apply Adjustment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
