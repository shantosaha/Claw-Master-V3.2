"use client";

import * as React from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReorderRequest, StockItem } from "@/types";
import { Plus, Trash2, AlertTriangle, Package, Info } from "lucide-react";
import { DEFAULT_STORAGE_LOCATION, primaryStorageLocations, secondaryStorageLocations } from "@/components/inventory/StockItemForm";

const organizeStockSchema = z.object({
    distributions: z.array(z.object({
        locationName: z.string(),
        quantity: z.number().int().min(0, "Quantity must be 0 or more"),
    })),
});

type FormValues = {
    distributions: { locationName: string; quantity: number }[];
};

interface OrganizeStockDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    request: ReorderRequest & { itemName?: string };
    stockItem: StockItem | null;
    onSubmit: (distributions: { locationName: string; quantity: number }[]) => void;
}

export function OrganizeStockDialog({ isOpen, onOpenChange, request, stockItem, onSubmit }: OrganizeStockDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(organizeStockSchema),
        defaultValues: {
            distributions: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "distributions",
    });

    // Use useWatch for real-time updates
    const watchedDistributions = useWatch({
        control: form.control,
        name: "distributions",
        defaultValue: [],
    });

    // Reset form when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            form.reset({
                distributions: [],
            });
        }
    }, [isOpen, form]);

    // Calculate totals from watched values
    const totalDistributed = React.useMemo(() => {
        if (!watchedDistributions || !Array.isArray(watchedDistributions)) return 0;
        return watchedDistributions.reduce((sum, d) => {
            const qty = typeof d?.quantity === 'number' ? d.quantity : (parseInt(String(d?.quantity)) || 0);
            return sum + qty;
        }, 0);
    }, [watchedDistributions]);

    const remaining = request.quantityRequested - totalDistributed;

    const handleFormSubmit = (data: FormValues) => {
        // Filter out empty distributions (no location or 0 quantity)
        let finalDistributions = data.distributions.filter(d => d.locationName && d.quantity > 0);

        // If there's remaining quantity, add it to B-Plushy Room Storage
        if (remaining > 0) {
            const existingDefaultIndex = finalDistributions.findIndex(d => d.locationName === DEFAULT_STORAGE_LOCATION);
            if (existingDefaultIndex >= 0) {
                finalDistributions[existingDefaultIndex].quantity += remaining;
            } else {
                finalDistributions.push({ locationName: DEFAULT_STORAGE_LOCATION, quantity: remaining });
            }
        }

        // Validate total doesn't exceed received quantity
        const total = finalDistributions.reduce((sum, d) => sum + d.quantity, 0);
        if (total > request.quantityRequested) {
            form.setError("distributions", {
                message: `Total distributed (${total}) exceeds received quantity (${request.quantityRequested})`
            });
            return;
        }

        // Make sure we have at least one distribution
        if (finalDistributions.length === 0) {
            finalDistributions.push({ locationName: DEFAULT_STORAGE_LOCATION, quantity: request.quantityRequested });
        }

        onSubmit(finalDistributions);
        onOpenChange(false);
    };

    // Get current stock at each location for display
    const getStockAtLocation = (locationName: string) => {
        if (!stockItem) return 0;
        const loc = stockItem.locations?.find(l => l.name === locationName);
        return loc?.quantity || 0;
    };

    const handleAddLocation = () => {
        // Pre-fill with remaining quantity, minimum 1
        const qty = remaining > 0 ? remaining : 1;
        append({ locationName: "", quantity: qty });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Organize Stock</DialogTitle>
                    <DialogDescription>
                        Distribute <strong>{request.quantityRequested} units</strong> of <strong>{request.itemName}</strong> from {DEFAULT_STORAGE_LOCATION} to other locations.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Received</p>
                                <p className="text-lg font-bold">{request.quantityRequested}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Distributing</p>
                                <p className="text-lg font-bold text-blue-600">{totalDistributed}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">Stays in B-Plushy</p>
                                <p className={`text-lg font-bold ${remaining === 0 ? 'text-muted-foreground' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {remaining < 0 ? 'OVER' : remaining}
                                </p>
                            </div>
                        </div>

                        {/* Info about remaining */}
                        {remaining > 0 && fields.length > 0 && (
                            <Alert variant="default" className="bg-blue-50 border-blue-200">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">Partial Distribution</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    <strong>{remaining} units</strong> will remain in <strong>{DEFAULT_STORAGE_LOCATION}</strong>.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Over-allocation warning */}
                        {remaining < 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Over-allocated!</AlertTitle>
                                <AlertDescription>
                                    You've allocated <strong>{Math.abs(remaining)}</strong> more units than received. Please reduce quantities.
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Distribution List */}
                        {fields.length > 0 && (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex gap-2 items-end p-3 border rounded-lg bg-card">
                                        <FormField
                                            control={form.control}
                                            name={`distributions.${index}.locationName`}
                                            render={({ field: selectField }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="text-xs">Move to Location</FormLabel>
                                                    <Select onValueChange={selectField.onChange} value={selectField.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9">
                                                                <SelectValue placeholder="Select location" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <ShadcnSelectLabel className="text-xs font-semibold">Primary</ShadcnSelectLabel>
                                                                {primaryStorageLocations.map((loc) => (
                                                                    <SelectItem key={loc} value={loc} className="text-sm">
                                                                        {loc} ({getStockAtLocation(loc)} in stock)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                            <SelectGroup>
                                                                <ShadcnSelectLabel className="text-xs font-semibold">Secondary</ShadcnSelectLabel>
                                                                {secondaryStorageLocations.map((loc) => (
                                                                    <SelectItem key={loc} value={loc} className="text-sm">
                                                                        {loc} ({getStockAtLocation(loc)} in stock)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`distributions.${index}.quantity`}
                                            render={({ field: inputField }) => (
                                                <FormItem className="w-28">
                                                    <FormLabel className="text-xs">Quantity</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            value={inputField.value}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                inputField.onChange(isNaN(val) ? 0 : val);
                                                            }}
                                                            className="h-9"
                                                            min={0}
                                                            max={request.quantityRequested}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {fields.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No distribution set.</p>
                                <p className="text-xs text-muted-foreground">All {request.quantityRequested} units will stay in {DEFAULT_STORAGE_LOCATION}.</p>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleAddLocation}
                            disabled={remaining <= 0 && fields.length > 0}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {fields.length === 0
                                ? "Distribute to Other Location"
                                : remaining > 0
                                    ? `Add Location (${remaining} available)`
                                    : "Add Location"
                            }
                        </Button>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={remaining < 0}>
                                <Package className="h-4 w-4 mr-2" />
                                {fields.length === 0
                                    ? `Keep All in ${DEFAULT_STORAGE_LOCATION.split('-')[0]}...`
                                    : remaining > 0
                                        ? `Confirm (${remaining} stays in B-Plushy)`
                                        : 'Confirm Organization'
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
